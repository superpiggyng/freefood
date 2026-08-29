from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "needy_metric",
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
                    "income_level",
                    "household_size",
                    "dependents",
                    "employment_status",
                    "previous_allocations_count",
                    "current_food_access",
                    "housing_cost",
                    "debt",
                    "age",
                    "height_cm",
                    "weight_kg",
                    "preferred_category",
                    "max_distance_km",
                    "address",
                    "zip_code",
                    "rural_area",
                    "bank_slip",
                    "needy_metric",
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
                    "income_level",
                    "household_size",
                    "dependents",
                    "employment_status",
                    "previous_allocations_count",
                    "current_food_access",
                    "housing_cost",
                    "debt",
                    "age",
                    "height_cm",
                    "weight_kg",
                    "preferred_category",
                    "max_distance_km",
                    "address",
                    "zip_code",
                    "rural_area",
                    "bank_slip",
                    "needy_metric",
                    "vendor_name",
                    "business_type",
                    "business_address",
                    "is_income_verified",
                )
            },
        ),
    )
