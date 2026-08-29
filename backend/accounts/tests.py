import json

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

    def test_need_score_uses_weighted_registration_fields(self):
        User = get_user_model()
        user = User(
            income_level="under-25000",
            household_size=4,
            dependents=3,
            employment_status="unemployed",
            current_food_access="very-limited",
            housing_cost=1500,
            debt=15000,
            rural_area=True,
        )

        self.assertEqual(
            user.calculate_need_score_breakdown(),
            {
                "income": 25,
                "foodAccess": 20,
                "dependents": 15,
                "householdSize": 9,
                "employment": 10,
                "housingPressure": 10,
                "debtPressure": 3,
                "ruralAccess": 5,
                "previousAllocationsPenalty": 0,
            },
        )
        self.assertEqual(user.calculate_need_score(), 97)

    def test_previous_allocations_reduce_need_score_with_cap(self):
        User = get_user_model()
        user = User(
            income_level="under-25000",
            current_food_access="very-limited",
            previous_allocations_count=10,
        )

        breakdown = user.calculate_need_score_breakdown()

        self.assertEqual(breakdown["previousAllocationsPenalty"], -15)
        self.assertEqual(user.calculate_need_score(), 34)

    def test_signup_persists_calculated_needy_metric(self):
        response = self.client.post(
            "/api/accounts/register/user/",
            data=json.dumps({
                "username": "score-user",
                "password1": "SecurePass123!",
                "password2": "SecurePass123!",
                "income_level": "under-25000",
                "household_size": 4,
                "dependents": 3,
                "employment_status": "unemployed",
                "previous_allocations_count": 0,
                "current_food_access": "very-limited",
                "housing_cost": "1500",
                "debt": "15000",
                "max_distance_km": 5,
                "rural_area": True,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="score-user")
        self.assertEqual(user.needy_metric, user.calculate_need_score())
        self.assertEqual(response.json()["needScore"], 97)
        self.assertEqual(response.json()["needScoreBreakdown"]["income"], 25)

    def test_profile_update_recalculates_needy_metric(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="profile-score",
            password="SecurePass123!",
            role="user",
            income_level="75000-plus",
            current_food_access="reliable",
            needy_metric=1,
        )
        self.client.force_login(user)

        response = self.client.patch(
            "/api/accounts/profile/",
            data=json.dumps({
                "incomeLevel": "under-25000",
                "householdSize": 4,
                "dependents": 3,
                "employmentStatus": "unemployed",
                "currentFoodAccess": "very-limited",
                "housingCost": "1500",
                "debt": "15000",
                "ruralArea": True,
            }),
            content_type="application/json",
        )

        user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(user.needy_metric, user.calculate_need_score())
        self.assertEqual(response.json()["needScore"], 97)
