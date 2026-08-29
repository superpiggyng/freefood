# Generated manually for database-backed marketplace demo listings.

import datetime
from decimal import Decimal

import django.core.validators
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


DEMO_LISTINGS = [
    {
        "name": "Bakery Rescue Box",
        "vendor": "Bakers Lane",
        "category": "bakery",
        "description": "A surprise box of bread, rolls and pastries baked this morning and unsold at close.",
        "tags": "Vegetarian",
        "quantity": 2,
        "price": Decimal("0.00"),
        "original_value": None,
    },
    {
        "name": "Fruit & Veg Box",
        "vendor": "Wholeharvest Metro",
        "category": "groceries",
        "description": "Seasonal fruit and vegetables pulled from the shelf for looks, not freshness.",
        "tags": "Vegan, Gluten-free, Dairy-free",
        "quantity": 3,
        "price": Decimal("0.00"),
        "original_value": None,
    },
    {
        "name": "Pantry Essentials Bag",
        "vendor": "Local Grocer",
        "category": "groceries",
        "description": "Rice, pasta, tinned goods and spreads close to their best-before date.",
        "tags": "Pantry, Vegan",
        "quantity": 5,
        "price": Decimal("3.50"),
        "original_value": Decimal("12.00"),
    },
    {
        "name": "Thai Dinner Pack",
        "vendor": "Thai on Eath",
        "category": "meals",
        "description": "Freshly cooked curry, rice and stir fry portioned at the end of dinner service.",
        "tags": "Dairy-free",
        "quantity": 4,
        "price": Decimal("2.00"),
        "original_value": Decimal("12.00"),
    },
    {
        "name": "Dinner Surprise Pack",
        "vendor": "Dinner Ladies",
        "category": "meals",
        "description": "Whatever the kitchen made too much of today, portioned and chilled ready to reheat.",
        "tags": "Vegetarian",
        "quantity": 6,
        "price": Decimal("0.00"),
        "original_value": None,
    },
    {
        "name": "Snacks & Fruit Pack",
        "vendor": "Green Bites Cafe",
        "category": "snacks",
        "description": "Whole fruit, snack packs and baked treats left over from the lunch rush.",
        "tags": "Gluten-free, Vegan, Dairy-free",
        "quantity": 3,
        "price": Decimal("1.50"),
        "original_value": Decimal("6.00"),
    },
]


def seed_listings(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL)
    Item = apps.get_model("marketplace", "Item")
    MarketplaceListing = apps.get_model("marketplace", "MarketplaceListing")

    now = timezone.now()
    for index, listing in enumerate(DEMO_LISTINGS):
        vendor_username = f"demo-vendor-{index + 1}"
        vendor, _ = User.objects.get_or_create(
            username=vendor_username,
            defaults={
                "email": f"{vendor_username}@example.com",
                "role": "vendor",
                "vendor_name": listing["vendor"],
                "business_type": "Food business",
            },
        )
        item, _ = Item.objects.get_or_create(
            name=listing["name"],
            defaults={
                "description": listing["description"],
                "category": listing["category"],
                "dietary_tags": listing["tags"],
            },
        )
        MarketplaceListing.objects.get_or_create(
            vendor=vendor,
            item=item,
            defaults={
                "quantity_available": listing["quantity"],
                "original_value": listing["original_value"],
                "price": listing["price"],
                "pickup_location": "Marrickville, NSW",
                "pickup_start": now + datetime.timedelta(hours=2 + index),
                "pickup_end": now + datetime.timedelta(hours=3 + index),
                "interest_deadline": now + datetime.timedelta(hours=1),
                "status": "open",
            },
        )


def unseed_listings(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL)
    User.objects.filter(username__startswith="demo-vendor-").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="item",
            name="category",
            field=models.CharField(
                choices=[
                    ("meals", "Meals"),
                    ("groceries", "Groceries"),
                    ("bakery", "Bakery"),
                    ("produce", "Produce"),
                    ("snacks", "Snacks"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=30,
            ),
        ),
        migrations.RunPython(seed_listings, unseed_listings),
    ]
