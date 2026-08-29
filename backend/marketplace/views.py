import json
from datetime import timedelta

from django.db import IntegrityError
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify
from django.views.decorators.http import require_http_methods

from freefood.auth import role_required_json, staff_required_json
from marketplace.models import Interest, Item, MarketplaceListing


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


def _tag_list(value):
    return [tag.strip() for tag in (value or "").split(",") if tag.strip()]


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
        "image": CATEGORY_IMAGES[category],
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

    item = Item.objects.create(
        name=data.get("name") or data.get("title") or "Surplus food",
        description=data.get("description", ""),
        category=category,
        dietary_tags=dietary_tags,
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
