from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Interest, Item, MarketplaceListing


class MarketplaceApiTests(TestCase):
    def setUp(self):
        # The seed data migration populates the marketplace; these tests own their fixtures.
        MarketplaceListing.objects.all().delete()
        Item.objects.all().delete()
        self.vendor = get_user_model().objects.create_user(
            username="vendor",
            email="vendor@example.com",
            password="SecurePass123!",
            role="vendor",
            vendor_name="Bakers Lane",
        )
        self.user = get_user_model().objects.create_user(
            username="recipient",
            email="recipient@example.com",
            password="SecurePass123!",
            role="user",
        )
        self.item = Item.objects.create(
            name="Bakery Rescue Box",
            description="Bread and pastries from today.",
            category="bakery",
            dietary_tags="Vegetarian",
        )
        self.listing = MarketplaceListing.objects.create(
            vendor=self.vendor,
            item=self.item,
            quantity_available=2,
            price=0,
            pickup_location="123 Main Street",
            pickup_start=timezone.now() + timedelta(hours=2),
            pickup_end=timezone.now() + timedelta(hours=3),
            interest_deadline=timezone.now() + timedelta(hours=1),
        )

    def test_listing_collection_contract(self):
        response = self.client.get(reverse("marketplace:listings"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], len(payload["results"]))
        self.assertEqual(payload["count"], 1)
        self.assertIn("pickupTime", payload["results"][0])
        self.assertEqual(payload["results"][0]["name"], "Bakery Rescue Box")

    def test_listing_detail_and_not_found(self):
        slug = f"bakery-rescue-box-{self.listing.pk}"
        response = self.client.get(
            reverse("marketplace:listing", kwargs={"slug": slug})
        )
        missing = self.client.get(
            reverse("marketplace:listing", kwargs={"slug": "does-not-exist"})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["slug"], slug)
        self.assertEqual(missing.status_code, 404)

    def test_vendor_can_create_listing(self):
        self.client.force_login(self.vendor)
        image_url = "data:image/jpeg;base64,abc123"

        response = self.client.post(
            reverse("marketplace:vendor-listings"),
            data={
                "name": "Dinner Surprise Pack",
                "category": "Meals",
                "description": "Prepared meals left after service.",
                "imageUrl": image_url,
                "quantityAvailable": 4,
                "price": 2,
                "originalValue": 12,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(MarketplaceListing.objects.count(), 2)
        self.assertEqual(response.json()["name"], "Dinner Surprise Pack")
        self.assertEqual(response.json()["image"], image_url)
        self.assertEqual(MarketplaceListing.objects.latest("id").item.image_url, image_url)

    def test_vendor_listing_collection_only_returns_own_listings(self):
        other_vendor = get_user_model().objects.create_user(
            username="other-vendor",
            email="other@example.com",
            password="SecurePass123!",
            role="vendor",
            vendor_name="Other Cafe",
        )
        other_item = Item.objects.create(name="Other Cafe Pack", category="meals")
        MarketplaceListing.objects.create(
            vendor=other_vendor,
            item=other_item,
            quantity_available=3,
            price=1,
            pickup_location="456 Other Street",
            pickup_start=timezone.now() + timedelta(hours=2),
            pickup_end=timezone.now() + timedelta(hours=3),
            interest_deadline=timezone.now() + timedelta(hours=1),
        )
        self.client.force_login(self.vendor)

        response = self.client.get(reverse("marketplace:vendor-listings"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["vendor"], "Bakers Lane")
        self.assertEqual(response.json()["results"][0]["name"], "Bakery Rescue Box")

    def test_vendor_can_request_ai_nutrition_estimate(self):
        self.client.force_login(self.vendor)

        with patch("marketplace.views.estimate_nutrition_from_image") as estimate:
            estimate.return_value = {
                "items": [
                    {
                        "name": "Dinner Surprise Pack",
                        "nutrition": {
                            "calories": 520,
                            "proteinG": 24,
                            "carbsG": 58,
                            "fatG": 18,
                            "fiberG": 6,
                            "sodiumMg": 760,
                        },
                        "confidence": "medium",
                    }
                ]
            }
            response = self.client.post(
                reverse("marketplace:vendor-nutrition-estimate"),
                data={
                    "image": SimpleUploadedFile("food.jpg", b"fake-image", content_type="image/jpeg"),
                    "items": '["Dinner Surprise Pack"]',
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["nutrition"]["proteinG"], 24)

    def test_user_can_submit_interest(self):
        self.client.force_login(self.user)

        response = self.client.post(
            reverse("marketplace:submit-interest", kwargs={"slug": f"bakery-rescue-box-{self.listing.pk}"}),
            data={"requestedQuantity": 1},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Interest.objects.get(user=self.user, listing=self.listing).status, Interest.STATUS_SUBMITTED)

    def test_platform_summary_contract(self):
        staff_user = get_user_model().objects.create_user(
            username="platform-admin",
            email="admin@example.com",
            password="SecurePass123!",
            is_staff=True,
        )
        self.client.force_login(staff_user)

        response = self.client.get(reverse("marketplace:platform-summary"))

        self.assertEqual(response.status_code, 200)
        self.assertIn("foodRescuedKg", response.json())

# Create your tests here.
