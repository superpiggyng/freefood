import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from freefood.auth import login_required_json

from .forms import UserSignupForm, VendorSignupForm


def _payload(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return None
    return request.POST


def _user_json(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role,
        "vendorName": user.vendor_name,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
        "householdSize": user.household_size,
        "incomeLevel": user.income_level,
        "dependents": user.dependents,
        "employmentStatus": user.employment_status,
        "previousAllocationsCount": user.previous_allocations_count,
        "currentFoodAccess": user.current_food_access,
        "housingCost": str(user.housing_cost) if user.housing_cost is not None else None,
        "debt": str(user.debt) if user.debt is not None else None,
        "age": user.age,
        "heightCm": user.height_cm,
        "weightKg": str(user.weight_kg) if user.weight_kg is not None else None,
        "preferredCategory": user.preferred_category,
        "maxDistanceKm": user.max_distance_km,
        "postcode": user.zip_code,
        "ruralArea": user.rural_area,
        "needScore": user.calculate_need_score(),
        "needScoreBreakdown": user.calculate_need_score_breakdown(),
        "needyMetric": user.needy_metric,
    }


def _sync_needy_metric(user):
    """Persist the computed need score so matching can order by it in the database."""
    user.needy_metric = user.calculate_need_score()
    user.save(update_fields=["needy_metric"])


def _register(request, form_class):
    data = _payload(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    form = form_class(data, request.FILES or None)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=422)
    user = form.save()
    _sync_needy_metric(user)
    login(request, user)
    return JsonResponse(_user_json(user), status=201)


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_http_methods(["POST"])
def user_signup(request):
    return _register(request, UserSignupForm)


@require_http_methods(["POST"])
def vendor_signup(request):
    return _register(request, VendorSignupForm)


@require_http_methods(["POST"])
def login_view(request):
    data = _payload(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    username = data.get("username", "")
    password = data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"detail": "Invalid username or password."}, status=401)
    _sync_needy_metric(user)
    login(request, user)
    return JsonResponse(_user_json(user))


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({}, status=204)


@ensure_csrf_cookie
def session(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})
    return JsonResponse({"user": _user_json(request.user)})


@login_required_json
@require_http_methods(["GET", "PATCH"])
def profile(request):
    if request.method == "PATCH":
        data = _payload(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON."}, status=400)
        user = request.user
        if "householdSize" in data:
            user.household_size = data["householdSize"]
        if "incomeLevel" in data:
            user.income_level = data["incomeLevel"]
        if "dependents" in data:
            user.dependents = data["dependents"]
        if "employmentStatus" in data:
            user.employment_status = data["employmentStatus"]
        if "previousAllocationsCount" in data:
            user.previous_allocations_count = data["previousAllocationsCount"]
        if "currentFoodAccess" in data:
            user.current_food_access = data["currentFoodAccess"]
        if "housingCost" in data:
            user.housing_cost = data["housingCost"]
        if "debt" in data:
            user.debt = data["debt"]
        if "age" in data:
            user.age = data["age"]
        if "heightCm" in data:
            user.height_cm = data["heightCm"]
        if "weightKg" in data:
            user.weight_kg = data["weightKg"]
        if "preferredCategory" in data:
            user.preferred_category = data["preferredCategory"]
        if "maxDistanceKm" in data:
            user.max_distance_km = data["maxDistanceKm"]
        if "postcode" in data:
            user.zip_code = data["postcode"]
        if "ruralArea" in data:
            user.rural_area = bool(data["ruralArea"])
        user.save()
        _sync_needy_metric(user)
    return JsonResponse(_user_json(request.user))
