from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Item(models.Model):
    CATEGORY_CHOICES = (
        ("meals", "Meals"),
        ("groceries", "Groceries"),
        ("bakery", "Bakery"),
        ("produce", "Produce"),
        ("snacks", "Snacks"),
        ("other", "Other"),
    )

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="other")
    dietary_tags = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated tags such as vegetarian, halal, gluten-free.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class MarketplaceListing(models.Model):
    STATUS_OPEN = "open"
    STATUS_MATCHING = "matching"
    STATUS_ALLOCATED = "allocated"
    STATUS_COMPLETED = "completed"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (STATUS_OPEN, "Open"),
        (STATUS_MATCHING, "Matching"),
        (STATUS_ALLOCATED, "Allocated"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELLED, "Cancelled"),
    )

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_listings",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="listings",
    )
    quantity_available = models.PositiveIntegerField()
    original_value = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
    )
    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
    )
    pickup_location = models.CharField(max_length=255)
    pickup_start = models.DateTimeField()
    pickup_end = models.DateTimeField()
    interest_deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["interest_deadline", "pickup_start"]

    def __str__(self):
        return f"{self.item} from {self.vendor}"


class Interest(models.Model):
    STATUS_SUBMITTED = "submitted"
    STATUS_WITHDRAWN = "withdrawn"
    STATUS_ALLOCATED = "allocated"
    STATUS_DECLINED = "declined"

    STATUS_CHOICES = (
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_WITHDRAWN, "Withdrawn"),
        (STATUS_ALLOCATED, "Allocated"),
        (STATUS_DECLINED, "Declined"),
    )

    listing = models.ForeignKey(
        MarketplaceListing,
        on_delete=models.CASCADE,
        related_name="interests",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_interests",
    )
    requested_quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_SUBMITTED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["listing", "user"],
                name="unique_interest_per_user_listing",
            )
        ]

    def __str__(self):
        return f"{self.user} interested in {self.listing}"


class Allocation(models.Model):
    STATUS_ALLOCATED = "allocated"
    STATUS_COLLECTED = "collected"
    STATUS_NO_SHOW = "no_show"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (STATUS_ALLOCATED, "Allocated"),
        (STATUS_COLLECTED, "Collected"),
        (STATUS_NO_SHOW, "No show"),
        (STATUS_CANCELLED, "Cancelled"),
    )

    listing = models.ForeignKey(
        MarketplaceListing,
        on_delete=models.CASCADE,
        related_name="allocations",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_allocations",
    )
    interest = models.OneToOneField(
        Interest,
        on_delete=models.SET_NULL,
        related_name="allocation",
        blank=True,
        null=True,
    )
    allocated_quantity = models.PositiveIntegerField(default=1)
    pickup_code = models.CharField(max_length=40, unique=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ALLOCATED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["listing", "user"],
                name="unique_allocation_per_user_listing",
            )
        ]

    def __str__(self):
        return f"{self.allocated_quantity} x {self.listing} allocated to {self.user}"
