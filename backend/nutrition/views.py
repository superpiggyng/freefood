import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from freefood.auth import login_required_json

from .models import FoodPreferenceProfile, PreferenceResponse, RestaurantMeal
from .services import calculate_daily_targets, score_meal, weekly_nutrition_summary


@login_required_json
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


@login_required_json
def matches(request):
    profile, _ = FoodPreferenceProfile.objects.get_or_create(user=request.user)
    targets = calculate_daily_targets(request.user)
    results = []
    for meal in RestaurantMeal.objects.filter(is_available=True).select_related("vendor"):
        result = score_meal(profile, meal, user=request.user)
        if result.eligible:
            results.append({"id": meal.id, "name": meal.name, "restaurant": meal.vendor.vendor_name or meal.vendor.username, "image": meal.image_url, "price": str(meal.price), "score": result.score, "reasons": result.reasons, "warnings": result.warnings, "allergens": meal.allergens, "nutrition": meal.nutrition})
    results.sort(key=lambda item: item["score"], reverse=True)
    return JsonResponse({"results": results, "dailyTargets": targets, "disclaimer": "Suggestions use optional food preferences and estimated nutrition targets. This is not medical advice."})


@login_required_json
@require_http_methods(["GET"])
def weekly_summary(request):
    return JsonResponse(weekly_nutrition_summary(request.user))
