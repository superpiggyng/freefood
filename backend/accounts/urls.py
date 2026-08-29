from django.urls import path

from . import views

urlpatterns = [
    path("register/user/", views.user_signup, name="user-signup"),
    path("register/vendor/", views.vendor_signup, name="vendor-signup"),
    path("profile/", views.profile, name="profile"),
]
