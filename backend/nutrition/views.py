import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .models import FoodPreferenceProfile, PreferenceResponse, RestaurantMeal
from .services import score_meal


@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def preferences(request):
    profile, _ = FoodPreferenceProfile.objects.get_or_create(user=request.user)
    if request.method == "DELETE":
        profile.delete()
        return JsonResponse({}, status=204)
    if request.method == "PUT":
        try:
            body = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON."}, status=400)
        profile.allergens_to_avoid = body.get("allergens", [])
        profile.dietary_styles = body.get("dietaryStyles", [])
        profile.meal_goal = body.get("mealGoal", "")
        profile.max_distance_km = body.get("maxDistanceKm", 5)
        profile.max_price = body.get("maxPrice")
        profile.save()
        PreferenceResponse.objects.create(profile=profile, responses=body)
    return JsonResponse({"allergens": profile.allergens_to_avoid, "dietaryStyles": profile.dietary_styles, "mealGoal": profile.meal_goal, "maxDistanceKm": profile.max_distance_km, "maxPrice": profile.max_price})


@login_required
def matches(request):
    profile, _ = FoodPreferenceProfile.objects.get_or_create(user=request.user)
    results = []
    for meal in RestaurantMeal.objects.filter(is_available=True).select_related("vendor"):
        result = score_meal(profile, meal)
        if result.eligible:
            results.append({"id": meal.id, "name": meal.name, "restaurant": meal.vendor.vendor_name or meal.vendor.username, "image": meal.image_url, "price": str(meal.price), "score": result.score, "reasons": result.reasons, "warnings": result.warnings, "allergens": meal.allergens})
    results.sort(key=lambda item: item["score"], reverse=True)
    return JsonResponse({"results": results, "disclaimer": "Suggestions use optional food preferences and are not medical advice."})
