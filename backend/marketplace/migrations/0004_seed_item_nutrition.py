# Generated manually for MVP demo nutrition values.

from decimal import Decimal

from django.db import migrations


DEMO_NUTRITION = {
    "Bakery Rescue Box": {
        "calories": 680,
        "protein_g": Decimal("18.00"),
        "carbs_g": Decimal("102.00"),
        "fat_g": Decimal("22.00"),
        "fiber_g": Decimal("6.00"),
        "sodium_mg": 920,
    },
    "Fruit & Veg Box": {
        "calories": 360,
        "protein_g": Decimal("7.00"),
        "carbs_g": Decimal("82.00"),
        "fat_g": Decimal("2.00"),
        "fiber_g": Decimal("18.00"),
        "sodium_mg": 90,
    },
    "Pantry Essentials Bag": {
        "calories": 920,
        "protein_g": Decimal("28.00"),
        "carbs_g": Decimal("158.00"),
        "fat_g": Decimal("12.00"),
        "fiber_g": Decimal("14.00"),
        "sodium_mg": 840,
    },
    "Thai Dinner Pack": {
        "calories": 740,
        "protein_g": Decimal("32.00"),
        "carbs_g": Decimal("88.00"),
        "fat_g": Decimal("24.00"),
        "fiber_g": Decimal("8.00"),
        "sodium_mg": 1100,
    },
    "Dinner Surprise Pack": {
        "calories": 610,
        "protein_g": Decimal("24.00"),
        "carbs_g": Decimal("72.00"),
        "fat_g": Decimal("20.00"),
        "fiber_g": Decimal("9.00"),
        "sodium_mg": 760,
    },
    "Snacks & Fruit Pack": {
        "calories": 430,
        "protein_g": Decimal("9.00"),
        "carbs_g": Decimal("74.00"),
        "fat_g": Decimal("12.00"),
        "fiber_g": Decimal("11.00"),
        "sodium_mg": 280,
    },
}


def seed_item_nutrition(apps, schema_editor):
    Item = apps.get_model("marketplace", "Item")
    for name, values in DEMO_NUTRITION.items():
        Item.objects.filter(name=name).update(**values)


def unseed_item_nutrition(apps, schema_editor):
    Item = apps.get_model("marketplace", "Item")
    Item.objects.filter(name__in=DEMO_NUTRITION).update(
        calories=None,
        protein_g=None,
        carbs_g=None,
        fat_g=None,
        fiber_g=None,
        sodium_mg=None,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0003_item_nutrition"),
    ]

    operations = [
        migrations.RunPython(seed_item_nutrition, unseed_item_nutrition),
    ]
