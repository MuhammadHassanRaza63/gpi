from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CentralCase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("dataset", models.CharField(max_length=4)),
                ("sn", models.CharField(max_length=32)),
                ("accept_time", models.DateTimeField()),
                ("month", models.PositiveSmallIntegerField()),
                ("service_title", models.CharField(blank=True, max_length=120)),
                ("main_tagging", models.CharField(blank=True, max_length=60)),
                ("city", models.CharField(blank=True, max_length=80)),
                ("sub_region", models.CharField(blank=True, max_length=20)),
                ("big_region", models.CharField(blank=True, max_length=20)),
                ("site_id", models.IntegerField(blank=True, null=True)),
                ("site_class", models.CharField(blank=True, max_length=40)),
                ("team", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("hvc", models.BooleanField(default=False)),
                ("channel", models.CharField(blank=True, max_length=80)),
                ("resolution", models.CharField(blank=True, max_length=40)),
                ("closure", models.CharField(blank=True, max_length=80)),
                ("fix_type", models.CharField(blank=True, max_length=120)),
                ("crr_flag", models.SmallIntegerField(blank=True, null=True)),
                ("satisfaction", models.CharField(blank=True, max_length=20)),
                ("tat_status", models.CharField(blank=True, max_length=24)),
                ("handovers", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("reopened", models.BooleanField(default=False)),
                ("arpu", models.CharField(blank=True, max_length=30)),
            ],
            options={
                "indexes": [models.Index(fields=["dataset", "month"], name="dash_cc_ds_month_idx")],
            },
        ),
    ]
