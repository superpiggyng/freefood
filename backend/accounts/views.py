import json

from django.http import JsonResponse
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


def _register(request, form_class):
    data = _payload(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    form = form_class(data, request.FILES or None)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=422)
    user = form.save()
    return JsonResponse({"id": user.id, "username": user.username, "email": user.email, "role": user.role}, status=201)


@require_http_methods(["POST"])
def user_signup(request):
    return _register(request, UserSignupForm)


@require_http_methods(["POST"])
def vendor_signup(request):
    return _register(request, VendorSignupForm)


@login_required_json
def profile(request):
    user = request.user
    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role,
        "vendorName": user.vendor_name,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
    })
