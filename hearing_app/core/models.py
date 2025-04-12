from django.db import models


class HearingTestResult(models.Model):
    GENDER_CHOICES = [
        ('M', 'Мужской'),
        ('F', 'Женский'),
    ]

    patient_last_name = models.CharField(max_length=100, verbose_name="Фамилия")
    patient_first_name = models.CharField(max_length=100, verbose_name="Имя")
    patient_middle_name = models.CharField(max_length=100, blank=True, verbose_name="Отчество")
    patient_gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Пол")
    patient_birth_date = models.DateField(verbose_name="Дата рождения")
    patient_phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    patient_email = models.EmailField(blank=True, verbose_name="Email")

    test_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата теста")
    test_type = models.CharField(max_length=100, default="Тональная аудиометрия", verbose_name="Тип теста")

    threshold_500 = models.FloatField(verbose_name="Порог 500 Гц")
    threshold_1000 = models.FloatField(verbose_name="Порог 1000 Гц")
    threshold_2000 = models.FloatField(verbose_name="Порог 2000 Гц")
    threshold_4000 = models.FloatField(verbose_name="Порог 4000 Гц")
    threshold_8000 = models.FloatField(verbose_name="Порог 8000 Гц")

    diagnosis = models.TextField(verbose_name="Заключение")
    recommendations = models.TextField(blank=True, verbose_name="Рекомендации")

    class Meta:
        verbose_name = "Результат аудиометрии"
        verbose_name_plural = "Результаты аудиометрии"

    def __str__(self):
        return f"{self.patient_last_name} {self.patient_first_name} - {self.test_date}"