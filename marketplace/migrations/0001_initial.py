# Generated manually for preliminary marketplace models.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Item",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=150)),
                ("description", models.TextField(blank=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("meal", "Prepared meal"),
                            ("groceries", "Groceries"),
                            ("bakery", "Bakery"),
                            ("produce", "Produce"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=30,
                    ),
                ),
                (
                    "dietary_tags",
                    models.CharField(
                        blank=True,
                        help_text="Comma-separated tags such as vegetarian, halal, gluten-free.",
                        max_length=255,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="MarketplaceListing",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quantity_available", models.PositiveIntegerField()),
                (
                    "original_value",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=8,
                        null=True,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                (
                    "price",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        max_digits=8,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                ("pickup_location", models.CharField(max_length=255)),
                ("pickup_start", models.DateTimeField()),
                ("pickup_end", models.DateTimeField()),
                ("interest_deadline", models.DateTimeField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("open", "Open"),
                            ("matching", "Matching"),
                            ("allocated", "Allocated"),
                            ("completed", "Completed"),
                            ("expired", "Expired"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="open",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="listings",
                        to="marketplace.item",
                    ),
                ),
                (
                    "vendor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="marketplace_listings",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["interest_deadline", "pickup_start"],
            },
        ),
        migrations.CreateModel(
            name="Interest",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("requested_quantity", models.PositiveIntegerField(default=1)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("submitted", "Submitted"),
                            ("withdrawn", "Withdrawn"),
                            ("allocated", "Allocated"),
                            ("declined", "Declined"),
                        ],
                        default="submitted",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "listing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="interests",
                        to="marketplace.marketplacelisting",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="marketplace_interests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="Allocation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("allocated_quantity", models.PositiveIntegerField(default=1)),
                ("pickup_code", models.CharField(max_length=40, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("allocated", "Allocated"),
                            ("collected", "Collected"),
                            ("no_show", "No show"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="allocated",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "interest",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="allocation",
                        to="marketplace.interest",
                    ),
                ),
                (
                    "listing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="allocations",
                        to="marketplace.marketplacelisting",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="marketplace_allocations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="interest",
            constraint=models.UniqueConstraint(
                fields=("listing", "user"),
                name="unique_interest_per_user_listing",
            ),
        ),
        migrations.AddConstraint(
            model_name="allocation",
            constraint=models.UniqueConstraint(
                fields=("listing", "user"),
                name="unique_allocation_per_user_listing",
            ),
        ),
    ]
