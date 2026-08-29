import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SecureEncryptedTextField(models.TextField):
    description = "Encrypted text field"

    def _key(self):
        digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest[:32])

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        return self._decrypt(value)

    def to_python(self, value):
        if value is None or value == "":
            return value
        if isinstance(value, str):
            return self._decrypt(value)
        return value

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return self._encrypt(value)

    def _encrypt(self, value):
        f = Fernet(self._key())
        return f.encrypt(value.encode("utf-8")).decode("utf-8")

    def _decrypt(self, value):
        f = Fernet(self._key())
        if isinstance(value, memoryview):
            value = value.tobytes().decode("utf-8")
        try:
            return f.decrypt(value.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            return value


class User(AbstractUser):
    ROLE_CHOICES = (
        ("user", "User"),
        ("vendor", "Vendor"),
    )

    INCOME_LEVEL_CHOICES = (
        ("under-25000", "Under $25,000 per year"),
        ("25000-49999", "$25,000-$49,999"),
        ("50000-74999", "$50,000-$74,999"),
        ("75000-plus", "$75,000 or more"),
    )

    ITEM_CATEGORY_CHOICES = (
        ("bakery", "Bakery"),
        ("groceries", "Groceries"),
        ("meals", "Meals"),
        ("snacks", "Snacks"),
    )

    EMPLOYMENT_STATUS_CHOICES = (
        ("employed-full-time", "Employed full-time"),
        ("employed-part-time", "Employed part-time"),
        ("unemployed", "Unemployed"),
        ("student", "Student"),
        ("retired", "Retired"),
        ("unable-to-work", "Unable to work"),
    )

    FOOD_ACCESS_CHOICES = (
        ("reliable", "Reliable access"),
        ("sometimes-limited", "Sometimes limited"),
        ("often-limited", "Often limited"),
        ("very-limited", "Very limited"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    income = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    income_level = models.CharField(max_length=20, choices=INCOME_LEVEL_CHOICES, blank=True)
    household_size = models.PositiveSmallIntegerField(default=1)
    dependents = models.PositiveSmallIntegerField(default=0)
    employment_status = models.CharField(max_length=30, choices=EMPLOYMENT_STATUS_CHOICES, blank=True)
    previous_allocations_count = models.PositiveIntegerField(default=0)
    current_food_access = models.CharField(max_length=30, choices=FOOD_ACCESS_CHOICES, blank=True)
    housing_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    debt = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    age = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(120)],
    )
    height_cm = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(30), MaxValueValidator(260)],
    )
    
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(500)],
    )
    preferred_category = models.CharField(max_length=20, choices=ITEM_CATEGORY_CHOICES, blank=True)
    max_distance_km = models.PositiveSmallIntegerField(default=5)
    address = SecureEncryptedTextField(blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True)
    rural_area = models.BooleanField(default=False)
    bank_slip = models.FileField(upload_to="bank_slips/", blank=True, null=True)
    is_income_verified = models.BooleanField(default=False)
    needy_metric = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    vendor_name = models.CharField(max_length=150, blank=True)
    business_type = models.CharField(max_length=80, blank=True)
    business_address = SecureEncryptedTextField(blank=True, null=True)

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return self.username

    def calculate_need_score(self):
        """Weighted need score (0-100) combining income, household, employment, access and cost factors."""
        income_weight = {
            "under-25000": 25,
            "25000-49999": 17,
            "50000-74999": 8,
            "75000-plus": 2,
        }.get(self.income_level, 12)
        household_weight = min(15, max(0, self.household_size - 1) * 3)
        dependents_weight = min(15, self.dependents * 3)
        employment_weight = {
            "unemployed": 15,
            "unable-to-work": 15,
            "student": 8,
            "employed-part-time": 6,
            "retired": 5,
            "employed-full-time": 0,
        }.get(self.employment_status, 6)
        access_weight = {
            "very-limited": 15,
            "often-limited": 10,
            "sometimes-limited": 5,
            "reliable": 0,
        }.get(self.current_food_access, 6)
        housing_weight = 0
        if self.housing_cost is not None and self.income:
            monthly_income = self.income / 12
            if monthly_income > 0:
                ratio = self.housing_cost / monthly_income
                housing_weight = min(10, float(ratio) * 20)
        debt_weight = 0
        if self.debt is not None and self.income:
            if self.income > 0:
                debt_ratio = self.debt / self.income
                debt_weight = min(10, float(debt_ratio) * 10)
        rural_weight = 5 if self.rural_area else 0
        allocation_penalty = min(10, self.previous_allocations_count * 2)

        score = (
            income_weight
            + household_weight
            + dependents_weight
            + employment_weight
            + access_weight
            + housing_weight
            + debt_weight
            + rural_weight
            - allocation_penalty
        )
        return max(0, min(100, round(score)))
