from django.urls import path

from . import views

app_name = "marketplace"
urlpatterns = [
    path("listings/", views.listing_collection, name="listings"),
    path("listings/<slug:slug>/", views.listing_item, name="listing"),
    path("listings/<slug:slug>/interest/", views.submit_interest, name="submit-interest"),
    path("vendor/listings/", views.vendor_listing_collection, name="vendor-listings"),
    path("vendor/allocations/", views.vendor_allocation_collection, name="vendor-allocations"),
    path("vendor/allocations/<int:listing_id>/run/", views.vendor_run_matching, name="vendor-run-matching"),
    path("vendor/nutrition-estimate/", views.vendor_nutrition_estimate, name="vendor-nutrition-estimate"),
    path("platform/summary/", views.platform_summary, name="platform-summary"),
]
