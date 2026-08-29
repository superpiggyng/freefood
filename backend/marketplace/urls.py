from django.urls import path

from . import views

app_name = "marketplace"
urlpatterns = [
    path("listings/", views.listing_collection, name="listings"),
    path("listings/<slug:slug>/", views.listing_item, name="listing"),
    path("platform/summary/", views.platform_summary, name="platform-summary"),
]
