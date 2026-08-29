from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from marketplace.models import Allocation, Interest, Item, MarketplaceListing

from .services import allocate_listing


class MatchingServiceTests(TestCase):
    def setUp(self):
        self.vendor = get_user_model().objects.create_user(
            username="vendor",
            password="password12345",
            role="vendor",
        )
        self.item = Item.objects.create(name="Bakery box", category="bakery")
        self.listing = MarketplaceListing.objects.create(
            vendor=self.vendor,
            item=self.item,
            quantity_available=2,
            price=0,
            pickup_location="123 Main Street",
            pickup_start=timezone.now() + timedelta(hours=2),
            pickup_end=timezone.now() + timedelta(hours=3),
            interest_deadline=timezone.now() - timedelta(minutes=1),
        )

    def user(self, username, needy_metric):
        return get_user_model().objects.create_user(
            username=username,
            password="password12345",
            role="user",
            needy_metric=needy_metric,
        )

    def test_allocates_highest_need_users_first(self):
        low_need = self.user("low", 20)
        high_need = self.user("high", 95)
        middle_need = self.user("middle", 70)
        Interest.objects.create(listing=self.listing, user=low_need)
        Interest.objects.create(listing=self.listing, user=high_need)
        Interest.objects.create(listing=self.listing, user=middle_need)

        result = allocate_listing(self.listing)

        self.assertEqual(result.allocated_count, 2)
        self.assertEqual(result.declined_count, 1)
        self.assertEqual(
            list(Allocation.objects.order_by("created_at").values_list("user__username", flat=True)),
            ["high", "middle"],
        )
        self.assertEqual(
            Interest.objects.get(user=low_need).status,
            Interest.STATUS_DECLINED,
        )

    def test_breaks_ties_by_request_time(self):
        first = self.user("first", 80)
        second = self.user("second", 80)
        first_interest = Interest.objects.create(listing=self.listing, user=first)
        second_interest = Interest.objects.create(listing=self.listing, user=second)
        Interest.objects.filter(pk=first_interest.pk).update(
            created_at=timezone.now() - timedelta(minutes=5)
        )
        Interest.objects.filter(pk=second_interest.pk).update(
            created_at=timezone.now() - timedelta(minutes=1)
        )

        allocate_listing(self.listing)

        self.assertEqual(
            list(Allocation.objects.order_by("created_at").values_list("user__username", flat=True)),
            ["first", "second"],
        )

    def test_allocation_updates_user_allocation_count_and_need_score(self):
        recipient = get_user_model().objects.create_user(
            username="recipient",
            password="password12345",
            role="user",
            income_level="under-25000",
            current_food_access="very-limited",
            previous_allocations_count=0,
        )
        recipient.needy_metric = recipient.calculate_need_score()
        recipient.save(update_fields=["needy_metric"])
        original_score = recipient.needy_metric
        Interest.objects.create(listing=self.listing, user=recipient)

        allocate_listing(self.listing)

        recipient.refresh_from_db()
        self.assertEqual(recipient.previous_allocations_count, 1)
        self.assertEqual(recipient.needy_metric, recipient.calculate_need_score())
        self.assertLess(recipient.needy_metric, original_score)
