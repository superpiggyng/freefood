from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_income_verified",
        "is_staff",
    )
    fieldsets = UserAdmin.fieldsets + (
        (
            "Profile details",
            {
                "fields": (
                    "role",
                    "income",
                    "address",
                    "zip_code",
                    "rural_area",
                    "bank_slip",
                    "vendor_name",
                    "business_type",
                    "business_address",
                    "is_income_verified",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Profile details",
            {
                "fields": (
                    "role",
                    "income",
                    "address",
                    "zip_code",
                    "rural_area",
                    "bank_slip",
                    "vendor_name",
                    "business_type",
                    "business_address",
                    "is_income_verified",
                )
            },
        ),
    )
