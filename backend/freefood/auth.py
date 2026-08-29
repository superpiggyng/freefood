from functools import wraps

from django.http import JsonResponse


def login_required_json(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required."}, status=401)
        return view_func(request, *args, **kwargs)

    return wrapper


def role_required_json(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({"detail": "Authentication required."}, status=401)
            if request.user.role not in roles:
                return JsonResponse({"detail": "You do not have access to this resource."}, status=403)
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def staff_required_json(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required."}, status=401)
        if not request.user.is_staff and not request.user.is_superuser:
            return JsonResponse({"detail": "Staff access required."}, status=403)
        return view_func(request, *args, **kwargs)

    return wrapper
