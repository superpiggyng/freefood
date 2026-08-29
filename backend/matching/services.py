from dataclasses import dataclass
from secrets import token_urlsafe

from django.db import transaction
from django.utils import timezone

from marketplace.models import Allocation, Interest, MarketplaceListing


@dataclass(frozen=True)
class AllocationResult:
    listing_id: int
    allocated_count: int
    declined_count: int
    remaining_quantity: int


def _new_pickup_code() -> str:
    return token_urlsafe(8).upper().replace("-", "").replace("_", "")[:10]


def _unique_pickup_code() -> str:
    code = _new_pickup_code()
    while Allocation.objects.filter(pickup_code=code).exists():
        code = _new_pickup_code()
    return code


def listing_is_ready_for_matching(listing: MarketplaceListing, *, now=None) -> bool:
    current_time = now or timezone.now()
    return (
        listing.status == MarketplaceListing.STATUS_OPEN
        and listing.quantity_available > 0
        and listing.interest_deadline <= current_time
    )


@transaction.atomic
def allocate_listing(listing: MarketplaceListing | int, *, now=None) -> AllocationResult:
    listing_id = listing if isinstance(listing, int) else listing.pk
    locked_listing = MarketplaceListing.objects.select_for_update().get(pk=listing_id)

    if not listing_is_ready_for_matching(locked_listing, now=now):
        return AllocationResult(
            listing_id=locked_listing.pk,
            allocated_count=0,
            declined_count=0,
            remaining_quantity=locked_listing.quantity_available,
        )

    locked_listing.status = MarketplaceListing.STATUS_MATCHING
    locked_listing.save(update_fields=["status", "updated_at"])

    remaining = locked_listing.quantity_available
    allocated_count = 0
    declined_count = 0

    interests = (
        Interest.objects.select_for_update()
        .filter(listing=locked_listing, status=Interest.STATUS_SUBMITTED)
        .select_related("user")
        .order_by("-user__needy_metric", "created_at", "pk")
    )

    for interest in interests:
        if remaining <= 0:
            interest.status = Interest.STATUS_DECLINED
            interest.save(update_fields=["status", "updated_at"])
            declined_count += 1
            continue

        quantity = min(interest.requested_quantity, remaining)
        Allocation.objects.create(
            listing=locked_listing,
            user=interest.user,
            interest=interest,
            allocated_quantity=quantity,
            pickup_code=_unique_pickup_code(),
        )
        interest.user.previous_allocations_count += 1
        interest.user.needy_metric = interest.user.calculate_need_score()
        interest.user.save(update_fields=["previous_allocations_count", "needy_metric"])
        interest.status = Interest.STATUS_ALLOCATED
        interest.save(update_fields=["status", "updated_at"])
        remaining -= quantity
        allocated_count += 1

    locked_listing.quantity_available = remaining
    locked_listing.status = (
        MarketplaceListing.STATUS_ALLOCATED
        if allocated_count > 0
        else MarketplaceListing.STATUS_EXPIRED
    )
    locked_listing.save(update_fields=["quantity_available", "status", "updated_at"])

    return AllocationResult(
        listing_id=locked_listing.pk,
        allocated_count=allocated_count,
        declined_count=declined_count,
        remaining_quantity=remaining,
    )


def allocate_ready_listings(*, now=None) -> list[AllocationResult]:
    current_time = now or timezone.now()
    ready_listing_ids = list(
        MarketplaceListing.objects.filter(
            status=MarketplaceListing.STATUS_OPEN,
            quantity_available__gt=0,
            interest_deadline__lte=current_time,
        ).values_list("id", flat=True)
    )
    return [allocate_listing(listing_id, now=current_time) for listing_id in ready_listing_ids]
