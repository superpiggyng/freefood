# Generated manually for MVP listing image previews.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0004_seed_item_nutrition"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="image_url",
            field=models.TextField(blank=True),
        ),
    ]
