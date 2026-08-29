from types import SimpleNamespace

from django.test import SimpleTestCase

from .services import score_meal


class MealSuggestionTests(SimpleTestCase):
    def profile(self, **overrides):
        values = {"allergens_to_avoid": [], "dietary_styles": [], "meal_goal": "", "max_price": None}
        values.update(overrides)
        return SimpleNamespace(**values)

    def meal(self, **overrides):
        values = {"allergens": [], "possible_cross_contact": [], "dietary_tags": [], "price": 0}
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
