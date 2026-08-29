from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase


class CustomUserRegistrationTests(TestCase):
    def test_unique_username_is_required(self):
        User = get_user_model()
        User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="SecurePass123!",
            role="user",
        )

        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="alice",
                email="another@example.com",
                password="SecurePass123!",
                role="user",
            )

    def test_user_can_create_income_verified_profile(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="SecurePass123!",
            role="user",
            income=1200,
            address="123 River Road",
            is_income_verified=True,
        )

        self.assertEqual(user.role, "user")
        self.assertTrue(user.is_income_verified)
        self.assertEqual(user.income, 1200)

    def test_vendor_profile_has_business_fields(self):
        User = get_user_model()
        vendor = User.objects.create_user(
            username="greenbasket",
            email="vendor@example.com",
            password="SecurePass123!",
            role="vendor",
            vendor_name="Green Basket",
            business_type="Grocer",
            business_address="20 Market Street",
        )

        self.assertEqual(vendor.role, "vendor")
        self.assertEqual(vendor.vendor_name, "Green Basket")
        self.assertEqual(vendor.business_type, "Grocer")
