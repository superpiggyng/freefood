from django.conf import settings
from django.db import models


class FoodPreferenceProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="food_preferences")
    allergens_to_avoid = models.JSONField(default=list, blank=True)
    dietary_styles = models.JSONField(default=list, blank=True)
    meal_goal = models.CharField(max_length=30, blank=True)
    max_distance_km = models.PositiveSmallIntegerField(default=5)
    max_price = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Food preferences for {self.user}"


class PreferenceResponse(models.Model):
    profile = models.ForeignKey(FoodPreferenceProfile, on_delete=models.CASCADE, related_name="history")
    schema_version = models.CharField(max_length=20, default="1.0")
    responses = models.JSONField(default=dict)
    completed_at = models.DateTimeField(auto_now_add=True)


class RestaurantMeal(models.Model):
    vendor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="restaurant_meals")
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    ingredients = models.JSONField(default=list)
    allergens = models.JSONField(default=list)
    possible_cross_contact = models.JSONField(default=list, blank=True)
    nutrition = models.JSONField(default=dict, blank=True)
    dietary_tags = models.JSONField(default=list, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}  -  {self.vendor}"


class MatchRecommendation(models.Model):
    profile = models.ForeignKey(FoodPreferenceProfile, on_delete=models.CASCADE, related_name="recommendations")
    meal = models.ForeignKey(RestaurantMeal, on_delete=models.CASCADE, related_name="recommendations")
    score = models.PositiveSmallIntegerField()
    reasons = models.JSONField(default=list)
    warnings = models.JSONField(default=list)
    model_version = models.CharField(max_length=30, default="preferences-v1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "-created_at"]
        constraints = [models.UniqueConstraint(fields=["profile", "meal", "model_version"], name="unique_profile_meal_model_match")]
