import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class SecureEncryptedTextField(models.TextField):
    description = "Encrypted text field"

    def _key(self):
        digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest[:32])

    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
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
        return f.decrypt(value.encode("utf-8")).decode("utf-8")


class User(AbstractUser):
    ROLE_CHOICES = (
        ("user", "User"),
        ("vendor", "Vendor"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    income = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    address = SecureEncryptedTextField(blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True)
    rural_area = models.BooleanField(default=False)
    bank_slip = models.FileField(upload_to="bank_slips/", blank=True, null=True)
    is_income_verified = models.BooleanField(default=False)

    vendor_name = models.CharField(max_length=150, blank=True)
    business_type = models.CharField(max_length=80, blank=True)
    business_address = SecureEncryptedTextField(blank=True, null=True)

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return self.username
