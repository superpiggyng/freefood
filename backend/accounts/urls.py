from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.csrf, name="csrf"),
    path("register/user/", views.user_signup, name="user-signup"),
    path("register/vendor/", views.vendor_signup, name="vendor-signup"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("session/", views.session, name="session"),
    path("profile/", views.profile, name="profile"),
]
