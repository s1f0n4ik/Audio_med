from rest_framework import serializers
from .models import HearingTestResult


class HearingTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = HearingTestResult
        fields = '__all__'
