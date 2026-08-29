from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("register/user/", views.user_signup, name="user_signup"),
    path("register/vendor/", views.vendor_signup, name="vendor_signup"),
    path("dashboard/", views.dashboard, name="dashboard"),
]
