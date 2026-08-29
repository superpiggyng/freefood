from django.contrib import messages
from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect

from .forms import UserSignupForm, VendorSignupForm

User = get_user_model()


def landing(request):
    return render(request, "accounts/landing.html")


def user_signup(request):
    if request.method == "POST":
        form = UserSignupForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "Your profile was created successfully.")
            return redirect("dashboard")
    else:
        form = UserSignupForm()
    return render(request, "accounts/user_signup.html", {"form": form})


def vendor_signup(request):
    if request.method == "POST":
        form = VendorSignupForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Your vendor profile was created successfully.")
            return redirect("dashboard")
    else:
        form = VendorSignupForm()
    return render(request, "accounts/vendor_signup.html", {"form": form})


def dashboard(request):
    return render(request, "accounts/dashboard.html", {"user": request.user})
