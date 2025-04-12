# Generated by Django 5.2 on 2025-04-12 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="HearingTestResult",
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
                (
                    "patient_last_name",
                    models.CharField(max_length=100, verbose_name="Фамилия"),
                ),
                (
                    "patient_first_name",
                    models.CharField(max_length=100, verbose_name="Имя"),
                ),
                (
                    "patient_middle_name",
                    models.CharField(
                        blank=True, max_length=100, verbose_name="Отчество"
                    ),
                ),
                (
                    "patient_gender",
                    models.CharField(
                        choices=[("M", "Мужской"), ("F", "Женский")],
                        max_length=1,
                        verbose_name="Пол",
                    ),
                ),
                ("patient_birth_date", models.DateField(verbose_name="Дата рождения")),
                (
                    "patient_phone",
                    models.CharField(blank=True, max_length=20, verbose_name="Телефон"),
                ),
                (
                    "patient_email",
                    models.EmailField(blank=True, max_length=254, verbose_name="Email"),
                ),
                (
                    "test_date",
                    models.DateTimeField(auto_now_add=True, verbose_name="Дата теста"),
                ),
                (
                    "test_type",
                    models.CharField(
                        default="Тональная аудиометрия",
                        max_length=100,
                        verbose_name="Тип теста",
                    ),
                ),
                ("threshold_500", models.FloatField(verbose_name="Порог 500 Гц")),
                ("threshold_1000", models.FloatField(verbose_name="Порог 1000 Гц")),
                ("threshold_2000", models.FloatField(verbose_name="Порог 2000 Гц")),
                ("threshold_4000", models.FloatField(verbose_name="Порог 4000 Гц")),
                ("threshold_8000", models.FloatField(verbose_name="Порог 8000 Гц")),
                ("diagnosis", models.TextField(verbose_name="Заключение")),
                (
                    "recommendations",
                    models.TextField(blank=True, verbose_name="Рекомендации"),
                ),
            ],
            options={
                "verbose_name": "Результат аудиометрии",
                "verbose_name_plural": "Результаты аудиометрии",
            },
        ),
    ]
