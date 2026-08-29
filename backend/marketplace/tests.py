from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class MarketplaceApiTests(TestCase):
    def test_listing_collection_contract(self):
        response = self.client.get(reverse("marketplace:listings"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], len(payload["results"]))
        self.assertIn("pickupTime", payload["results"][0])

    def test_listing_detail_and_not_found(self):
        response = self.client.get(
            reverse("marketplace:listing", kwargs={"slug": "bakery-rescue-box"})
        )
        missing = self.client.get(
            reverse("marketplace:listing", kwargs={"slug": "does-not-exist"})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["slug"], "bakery-rescue-box")
        self.assertEqual(missing.status_code, 404)

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
