from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSignupForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
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
        ]

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            self.add_error("password2", "Passwords do not match.")
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "user"
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class VendorSignupForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "vendor_name",
            "business_type",
            "business_address",
            "address",
        ]

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            self.add_error("password2", "Passwords do not match.")
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = "vendor"
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user
