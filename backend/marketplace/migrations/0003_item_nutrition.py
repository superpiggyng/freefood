# Generated manually for MVP item nutrition fields.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0002_item_categories_seed_listings"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="calories",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="protein_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="carbs_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="fat_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="fiber_g",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="sodium_mg",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
