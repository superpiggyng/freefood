from django.contrib import admin

from .models import FoodPreferenceProfile, MatchRecommendation, PreferenceResponse, RestaurantMeal

admin.site.register(FoodPreferenceProfile)
admin.site.register(PreferenceResponse)
admin.site.register(RestaurantMeal)
admin.site.register(MatchRecommendation)
