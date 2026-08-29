from django.urls import path

from . import views

app_name = "nutrition"
urlpatterns = [
    path("preferences/", views.preferences, name="preferences"),
    path("matches/", views.matches, name="matches"),
    path("weekly-summary/", views.weekly_summary, name="weekly-summary"),
]
