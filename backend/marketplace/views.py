import json
from datetime import timedelta

from django.db import IntegrityError, models
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify
from django.views.decorators.http import require_http_methods

from freefood.auth import role_required_json, staff_required_json
from marketplace.ai_nutrition import (
    NutritionEstimateError,
    estimate_nutrition_from_image,
)
from marketplace.models import Allocation, Interest, Item, MarketplaceListing


CATEGORY_LABELS = {
    "bakery": "Bakery",
    "groceries": "Groceries",
    "meals": "Meals",
    "meal": "Meals",
    "produce": "Produce",
    "snacks": "Snacks",
    "other": "Other",
}

CATEGORY_IMAGES = {
    "Bakery": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    "Groceries": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85",
    "Meals": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
    "Produce": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85",
    "Snacks": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85",
    "Other": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
}


def _payload(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def _category_value(value):
    normalized = (value or "other").strip().lower()
    if normalized == "meal":
        return "meals"
    return normalized if normalized in CATEGORY_LABELS else "other"


def _category_label(value):
    return CATEGORY_LABELS.get(value, "Other")


def _listing_slug(listing):
    return f"{slugify(listing.item.name) or 'listing'}-{listing.pk}"


def _money_value(value):
    return float(value) if value is not None else None


def _price_label(value):
    return "FREE" if value == 0 else f"${value:.2f}"


def _pickup_window(listing):
    start = timezone.localtime(listing.pickup_start).strftime("%b %d, %I:%M %p")
    end = timezone.localtime(listing.pickup_end).strftime("%I:%M %p")
    return f"{start} - {end}"


def _date_time_label(value):
    return timezone.localtime(value).strftime("%b %d, %I:%M %p")


def _time_until(value, *, now=None):
    current_time = now or timezone.now()
    seconds = int((value - current_time).total_seconds())
    if seconds <= 0:
        return "Ready now"
    minutes = max(1, round(seconds / 60))
    if minutes < 60:
        return f"{minutes} min left"
    hours = round(minutes / 60)
    if hours < 24:
        return f"{hours} hr left"
    days = round(hours / 24)
    return f"{days} day left" if days == 1 else f"{days} days left"


def _tag_list(value):
    return [tag.strip() for tag in (value or "").split(",") if tag.strip()]


def _nutrition_json(item):
    return {
        "calories": item.calories,
        "proteinG": _money_value(item.protein_g),
        "carbsG": _money_value(item.carbs_g),
        "fatG": _money_value(item.fat_g),
        "fiberG": _money_value(item.fiber_g),
        "sodiumMg": item.sodium_mg,
    }


def _listing_json(listing):
    category = _category_label(listing.item.category)
    original_value = _money_value(listing.original_value)
    return {
        "id": listing.id,
        "slug": _listing_slug(listing),
        "name": listing.item.name,
        "vendor": listing.vendor.vendor_name or listing.vendor.username,
        "category": category,
        "price": _price_label(_money_value(listing.price)),
        "originalPrice": f"${original_value:.2f}" if original_value is not None else None,
        "image": listing.item.image_url or CATEGORY_IMAGES[category],
        "tags": [category, *_tag_list(listing.item.dietary_tags)],
        "quantityLeft": listing.quantity_available,
        "pickupTime": _pickup_window(listing),
        "distance": "Nearby",
        "allergens": [],
        "possibleCrossContact": [],
        "traits": ["value"],
        "vendorPrice": original_value or _money_value(listing.price) or 0,
        "sponsored": _money_value(listing.price) == 0,
        "partnerTier": "Community Partner",
        "description": listing.item.description,
        "servings": f"{listing.quantity_available} available",
        "weight": "",
        "nutrition": _nutrition_json(listing.item),
    }


def _recipient_label(user):
    first = (user.first_name or "").strip()
    last = (user.last_name or "").strip()
    if first and last:
        return f"{first} {last[0]}."
    if first:
        return first
    return user.username


def _priority_label(score):
    if score >= 80:
        return "Very high"
    if score >= 60:
        return "High"
    if score >= 40:
        return "Medium"
    return "Standard"


def _allocation_stage(listing, *, now=None):
    current_time = now or timezone.now()
    if listing.status == MarketplaceListing.STATUS_OPEN:
        if listing.interest_deadline <= current_time:
            return "ready", "Ready to match"
        return "collecting", "Collecting requests"
    if listing.status == MarketplaceListing.STATUS_MATCHING:
        return "matching", "Matching in progress"
    if listing.status == MarketplaceListing.STATUS_ALLOCATED:
        return "allocated", "Allocated"
    if listing.status == MarketplaceListing.STATUS_COMPLETED:
        return "completed", "Completed"
    if listing.status == MarketplaceListing.STATUS_EXPIRED:
        return "expired", "Expired"
    return "cancelled", "Cancelled"


def _listing_interests(listing):
    prefetched = getattr(listing, "ranked_interests", None)
    if prefetched is not None:
        return list(prefetched)
    return list(
        Interest.objects.filter(listing=listing)
        .select_related("user", "allocation")
        .order_by("-user__needy_metric", "created_at", "pk")
    )


def _interest_allocation(interest):
    try:
        return interest.allocation
    except Allocation.DoesNotExist:
        return None


def _vendor_allocation_listing_json(listing, *, now=None):
    current_time = now or timezone.now()
    category = _category_label(listing.item.category)
    stage, stage_label = _allocation_stage(listing, now=current_time)
    interests = _listing_interests(listing)
    preview_remaining = listing.quantity_available
    request_rows = []
    allocated_count = 0
    declined_count = 0

    for index, interest in enumerate(interests, start=1):
        allocation = _interest_allocation(interest)
        projected_status = "not-selected"
        projected_quantity = 0
        if interest.status == Interest.STATUS_ALLOCATED:
            projected_status = "allocated"
            projected_quantity = allocation.allocated_quantity if allocation else interest.requested_quantity
            allocated_count += 1
        elif interest.status == Interest.STATUS_DECLINED:
            projected_status = "declined"
            declined_count += 1
        elif interest.status == Interest.STATUS_SUBMITTED and listing.status == MarketplaceListing.STATUS_OPEN:
            if preview_remaining > 0:
                projected_status = "projected"
                projected_quantity = min(interest.requested_quantity, preview_remaining)
                preview_remaining -= projected_quantity
            else:
                projected_status = "waitlisted"
        elif interest.status == Interest.STATUS_WITHDRAWN:
            projected_status = "withdrawn"

        request_rows.append({
            "id": interest.id,
            "rank": index,
            "requesterName": _recipient_label(interest.user),
            "needScore": interest.user.needy_metric,
            "priority": _priority_label(interest.user.needy_metric),
            "requestedQuantity": interest.requested_quantity,
            "requestedAt": interest.created_at.isoformat(),
            "requestedAtLabel": _date_time_label(interest.created_at),
            "previousAllocationsCount": interest.user.previous_allocations_count,
            "status": interest.status,
            "statusLabel": interest.get_status_display(),
            "projectedStatus": projected_status,
            "projectedQuantity": projected_quantity,
            "pickupCode": allocation.pickup_code if allocation else "",
        })

    submitted_count = sum(1 for interest in interests if interest.status == Interest.STATUS_SUBMITTED)
    can_run_matching = (
        listing.status == MarketplaceListing.STATUS_OPEN
        and listing.quantity_available > 0
        and listing.interest_deadline <= current_time
    )
    return {
        "id": listing.id,
        "slug": _listing_slug(listing),
        "name": listing.item.name,
        "category": category,
        "image": listing.item.image_url or CATEGORY_IMAGES[category],
        "quantityAvailable": listing.quantity_available,
        "price": _price_label(_money_value(listing.price)),
        "pickupWindow": _pickup_window(listing),
        "pickupLocation": listing.pickup_location,
        "interestDeadline": listing.interest_deadline.isoformat(),
        "interestDeadlineLabel": _date_time_label(listing.interest_deadline),
        "deadlineRelative": _time_until(listing.interest_deadline, now=current_time),
        "status": listing.status,
        "stage": stage,
        "stageLabel": stage_label,
        "canRunMatching": can_run_matching,
        "requestCount": len(interests),
        "submittedCount": submitted_count,
        "allocatedCount": allocated_count,
        "declinedCount": declined_count,
        "remainingQuantity": listing.quantity_available,
        "requests": request_rows,
    }


def _listing_queryset():
    return MarketplaceListing.objects.select_related("item", "vendor").filter(
        status=MarketplaceListing.STATUS_OPEN,
        quantity_available__gt=0,
    )


def _find_listing(identifier):
    if str(identifier).isdigit():
        return MarketplaceListing.objects.select_related("item", "vendor").filter(pk=identifier).first()

    possible_id = str(identifier).rsplit("-", 1)[-1]
    if possible_id.isdigit():
        return MarketplaceListing.objects.select_related("item", "vendor").filter(pk=possible_id).first()

    for listing in _listing_queryset():
        if _listing_slug(listing) == identifier:
            return listing
    return None


def _parse_datetime(value, fallback):
    parsed = parse_datetime(value) if value else None
    if parsed is None:
        return fallback
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed)
    return parsed


def listing_collection(request):
    results = [_listing_json(listing) for listing in _listing_queryset()]
    return JsonResponse({"results": results, "count": len(results)})


def listing_item(request, slug):
    listing = _find_listing(slug)
    if listing is None:
        return JsonResponse({"detail": "Listing not found."}, status=404)
    return JsonResponse(_listing_json(listing))


@role_required_json("vendor")
@require_http_methods(["GET", "POST"])
def vendor_listing_collection(request):
    if request.method == "GET":
        results = [
            _listing_json(listing)
            for listing in MarketplaceListing.objects.select_related("item", "vendor").filter(
                vendor=request.user
            )
        ]
        return JsonResponse({"results": results, "count": len(results)})

    data = _payload(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    now = timezone.now()
    category = _category_value(data.get("category"))
    tags = data.get("dietaryTags") or data.get("tags") or []
    if isinstance(tags, list):
        dietary_tags = ", ".join(tag for tag in tags if tag != _category_label(category))
    else:
        dietary_tags = str(tags)
    nutrition = data.get("nutrition") or {}

    item = Item.objects.create(
        name=data.get("name") or data.get("title") or "Surplus food",
        description=data.get("description", ""),
        category=category,
        dietary_tags=dietary_tags,
        image_url=data.get("imageUrl") or data.get("image") or "",
        calories=data.get("calories") or nutrition.get("calories"),
        protein_g=data.get("proteinG") or nutrition.get("proteinG"),
        carbs_g=data.get("carbsG") or nutrition.get("carbsG"),
        fat_g=data.get("fatG") or nutrition.get("fatG"),
        fiber_g=data.get("fiberG") or nutrition.get("fiberG"),
        sodium_mg=data.get("sodiumMg") or nutrition.get("sodiumMg"),
    )
    listing = MarketplaceListing.objects.create(
        vendor=request.user,
        item=item,
        quantity_available=int(data.get("quantityAvailable") or data.get("quantityLeft") or 1),
        original_value=data.get("originalValue"),
        price=data.get("price", 0) or 0,
        pickup_location=data.get("pickupLocation") or request.user.business_address or request.user.vendor_name or "Pickup location provided by vendor",
        pickup_start=_parse_datetime(data.get("pickupStart"), now + timedelta(hours=2)),
        pickup_end=_parse_datetime(data.get("pickupEnd"), now + timedelta(hours=3)),
        interest_deadline=_parse_datetime(data.get("interestDeadline"), now + timedelta(hours=1)),
    )
    return JsonResponse(_listing_json(listing), status=201)


@role_required_json("vendor")
@require_http_methods(["GET"])
def vendor_allocation_collection(request):
    ranked_interests = (
        Interest.objects.select_related("user", "allocation")
        .order_by("-user__needy_metric", "created_at", "pk")
    )
    listings = list(
        MarketplaceListing.objects.select_related("item", "vendor")
        .prefetch_related(
            models.Prefetch("interests", queryset=ranked_interests, to_attr="ranked_interests")
        )
        .filter(vendor=request.user)
        .order_by("interest_deadline", "pickup_start", "pk")
    )
    now = timezone.now()
    results = [_vendor_allocation_listing_json(listing, now=now) for listing in listings]
    return JsonResponse({
        "results": results,
        "count": len(results),
        "metrics": {
            "activeListings": sum(1 for item in results if item["stage"] in {"collecting", "ready", "matching"}),
            "waitingRequests": sum(item["submittedCount"] for item in results),
            "readyToMatch": sum(1 for item in results if item["canRunMatching"]),
            "allocatedRecipients": sum(item["allocatedCount"] for item in results),
        },
    })


@role_required_json("vendor")
@require_http_methods(["POST"])
def vendor_run_matching(request, listing_id):
    from matching.services import allocate_listing, listing_is_ready_for_matching

    try:
        listing = MarketplaceListing.objects.select_related("item", "vendor").get(
            pk=listing_id,
            vendor=request.user,
        )
    except MarketplaceListing.DoesNotExist:
        return JsonResponse({"detail": "Listing not found."}, status=404)

    if not listing_is_ready_for_matching(listing):
        return JsonResponse({
            "detail": f"Matching can run after {_date_time_label(listing.interest_deadline)}.",
        }, status=409)

    result = allocate_listing(listing.pk, now=timezone.now())
    listing = MarketplaceListing.objects.select_related("item", "vendor").get(pk=listing.pk)
    return JsonResponse({
        "result": {
            "listingId": result.listing_id,
            "allocatedCount": result.allocated_count,
            "declinedCount": result.declined_count,
            "remainingQuantity": result.remaining_quantity,
        },
        "listing": _vendor_allocation_listing_json(listing, now=timezone.now()),
    })


@role_required_json("vendor")
@require_http_methods(["POST"])
def vendor_nutrition_estimate(request):
    image = request.FILES.get("image")
    if image is None:
        return JsonResponse({"detail": "Food image is required."}, status=400)

    try:
        item_names = json.loads(request.POST.get("items", "[]"))
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Items must be valid JSON."}, status=400)

    if not isinstance(item_names, list):
        return JsonResponse({"detail": "Items must be a list of food names."}, status=400)

    try:
        estimate = estimate_nutrition_from_image(image, item_names)
    except NutritionEstimateError as error:
        return JsonResponse({"source": "fallback", "warning": str(error), "items": []})

    return JsonResponse(estimate)


@role_required_json("user")
@require_http_methods(["POST"])
def submit_interest(request, slug):
    listing = _find_listing(slug)
    if listing is None:
        return JsonResponse({"detail": "Listing not found."}, status=404)
    if listing.status != MarketplaceListing.STATUS_OPEN or listing.quantity_available <= 0:
        return JsonResponse({"detail": "This listing is not accepting requests."}, status=409)

    data = _payload(request)
    requested_quantity = 1
    if data:
        requested_quantity = max(1, int(data.get("requestedQuantity", 1)))

    try:
        interest, created = Interest.objects.get_or_create(
            listing=listing,
            user=request.user,
            defaults={"requested_quantity": requested_quantity},
        )
    except IntegrityError:
        interest = Interest.objects.get(listing=listing, user=request.user)
        created = False

    if not created and interest.status != Interest.STATUS_SUBMITTED:
        interest.status = Interest.STATUS_SUBMITTED
        interest.requested_quantity = requested_quantity
        interest.save(update_fields=["status", "requested_quantity", "updated_at"])

    return JsonResponse({
        "id": interest.id,
        "listing": _listing_json(listing),
        "requestedQuantity": interest.requested_quantity,
        "status": interest.status,
    }, status=201 if created else 200)


@staff_required_json
def platform_summary(request):
    return JsonResponse({"users": 12540, "vendors": 1285, "activeListings": 342, "mealsAllocated": 4612, "foodRescuedKg": 2860, "co2AvoidedKg": 7120})
