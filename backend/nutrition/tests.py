from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from marketplace.models import Allocation, Item, MarketplaceListing
from .services import calculate_daily_targets, score_meal


class MealSuggestionTests(SimpleTestCase):
    def profile(self, **overrides):
        values = {"allergens_to_avoid": [], "dietary_styles": [], "meal_goal": "", "max_price": None}
        values.update(overrides)
        return SimpleNamespace(**values)

    def meal(self, **overrides):
        values = {"allergens": [], "possible_cross_contact": [], "dietary_tags": [], "price": 0, "nutrition": {}}
        values.update(overrides)
        return SimpleNamespace(**values)

    def test_selected_allergen_hides_meal(self):
        result = score_meal(self.profile(allergens_to_avoid=["peanut"]), self.meal(allergens=["Peanut"]))
        self.assertFalse(result.eligible)

    def test_preferences_improve_score(self):
        result = score_meal(self.profile(dietary_styles=["vegan"]), self.meal(dietary_tags=["Vegan"]))
        self.assertGreater(result.score, 70)

    def test_cross_contact_is_warning_not_diagnosis(self):
        result = score_meal(self.profile(allergens_to_avoid=["sesame"]), self.meal(possible_cross_contact=["Sesame"]))
        self.assertTrue(result.eligible)
        self.assertTrue(result.warnings)

    def test_calculates_daily_targets_from_body_metrics(self):
        user = SimpleNamespace(age=30, height_cm=170, weight_kg=70)

        targets = calculate_daily_targets(user)

        self.assertEqual(targets["proteinG"], 56)
        self.assertGreater(targets["calories"], 1200)

    def test_nutrition_contribution_improves_score(self):
        user = SimpleNamespace(age=30, height_cm=170, weight_kg=70)

        result = score_meal(
            self.profile(),
            self.meal(nutrition={"calories": 520, "proteinG": 28, "carbsG": 50, "fiberG": 7}),
            user=user,
        )

        self.assertGreater(result.score, 70)
        self.assertIn("protein", " ".join(result.reasons).lower())
        self.assertIn("carbohydrates", " ".join(result.reasons).lower())


class WeeklyNutritionSummaryTests(TestCase):
    def test_allocated_food_counts_toward_weekly_nutrition(self):
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username="recipient",
            password="SecurePass123!",
            role="user",
            age=30,
            height_cm=170,
            weight_kg=70,
        )
        vendor = user_model.objects.create_user(
            username="vendor",
            password="SecurePass123!",
            role="vendor",
            vendor_name="Bakers Lane",
        )
        item = Item.objects.create(
            name="Dinner Pack",
            category="meals",
            calories=500,
            protein_g=25,
            carbs_g=60,
            fat_g=12,
            fiber_g=7,
        )
        listing = MarketplaceListing.objects.create(
            vendor=vendor,
            item=item,
            quantity_available=0,
            original_value=12,
            price=2,
            pickup_location="123 Main Street",
            pickup_start=timezone.now(),
            pickup_end=timezone.now(),
            interest_deadline=timezone.now(),
            status=MarketplaceListing.STATUS_ALLOCATED,
        )
        Allocation.objects.create(
            listing=listing,
            user=user,
            allocated_quantity=2,
            pickup_code="TESTCODE",
        )
        self.client.force_login(user)

        response = self.client.get(reverse("nutrition:weekly-summary"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["totals"]["calories"], 1000)
        self.assertEqual(payload["totals"]["proteinG"], 50)
        self.assertEqual(payload["impact"]["servings"], 2)
        self.assertEqual(payload["impact"]["savedAmount"], 20)
        self.assertIn("allocated food", payload["assumption"].lower())
