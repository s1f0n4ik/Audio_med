from rest_framework.decorators import api_view
from rest_framework.response import Response
import numpy as np
from .models import HearingTestResult
from .serializers import HearingTestResultSerializer


@api_view(['POST'])
def save_results(request):
    try:
        data = request.data.get('data', [])
        patient_data = request.data.get('patient', {})
        thresholds = {}

        if not isinstance(data, list):
            return Response({'status': 'error', 'message': 'Invalid data format'})

        for freq in [500, 1000, 2000, 4000, 8000]:
            freq_results = [r for r in data if r.get('frequency') == freq]

            if not freq_results:
                thresholds[str(freq)] = 1.0
                continue

            heard_volumes = [
                r['volume'] for r in freq_results
                if r.get('heard', False) and isinstance(r.get('volume'), (int, float))
            ]

            if heard_volumes:
                thresholds[str(freq)] = min(heard_volumes)
            else:
                thresholds[str(freq)] = 1.0

        diagnosis = generate_diagnosis(thresholds)

        # Сохраняем результаты в БД
        test_result = HearingTestResult(
            patient_last_name=patient_data.get('lastName', ''),
            patient_first_name=patient_data.get('firstName', ''),
            patient_middle_name=patient_data.get('middleName', ''),
            patient_gender=patient_data.get('gender', ''),
            patient_birth_date=patient_data.get('birthDate', None),
            patient_phone=patient_data.get('phone', ''),
            patient_email=patient_data.get('email', ''),

            threshold_500=thresholds.get('500', 1.0),
            threshold_1000=thresholds.get('1000', 1.0),
            threshold_2000=thresholds.get('2000', 1.0),
            threshold_4000=thresholds.get('4000', 1.0),
            threshold_8000=thresholds.get('8000', 1.0),

            diagnosis=diagnosis,
            recommendations=get_recommendations(diagnosis)
        )
        test_result.save()

        return Response({
            'status': 'success',
            'thresholds': thresholds,
            'diagnosis': diagnosis,
            'test_id': test_result.id
        })
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)})


def generate_diagnosis(thresholds):
    norm_thresholds = {
        '500': 0.1,
        '1000': 0.08,
        '2000': 0.05,
        '4000': 0.03,
        '8000': 0.02
    }

    deviations = []
    for freq, norm in norm_thresholds.items():
        user_threshold = thresholds.get(freq, 1.0)
        if isinstance(user_threshold, (int, float)):
            deviations.append(user_threshold - norm)

    avg_deviation = np.mean(deviations) if deviations else 0

    if avg_deviation < 0.1:
        return "Ваш слух в пределах нормы"
    elif 0.1 <= avg_deviation < 0.3:
        return "Легкое снижение слуха"
    elif 0.3 <= avg_deviation < 0.6:
        return "Умеренное снижение слуха"
    else:
        return "Рекомендуется консультация специалиста"


def get_recommendations(diagnosis):
    if "нормы" in diagnosis.lower():
        return "Повторите тест через год для контроля слуха."
    elif "легкое" in diagnosis.lower():
        return "Рекомендуется избегать шумных помещений, повторить тест через 6 месяцев."
    elif "умеренное" in diagnosis.lower():
        return "Рекомендуется консультация ЛОР-врача и проведение дополнительных исследований."
    else:
        return "Необходима срочная консультация специалиста для детального обследования."


@api_view(['GET'])
def get_test_results(request, test_id):
    try:
        test = HearingTestResult.objects.get(id=test_id)
        serializer = HearingTestResultSerializer(test)
        return Response(serializer.data)
    except HearingTestResult.DoesNotExist:
        return Response({'status': 'error', 'message': 'Test not found'}, status=404)


@api_view(['GET'])
def get_patient_tests(request):
    last_name = request.query_params.get('last_name', '')
    first_name = request.query_params.get('first_name', '')
    birth_date = request.query_params.get('birth_date', None)

    tests = HearingTestResult.objects.all()

    if last_name:
        tests = tests.filter(patient_last_name__icontains=last_name)
    if first_name:
        tests = tests.filter(patient_first_name__icontains=first_name)
    if birth_date:
        tests = tests.filter(patient_birth_date=birth_date)

    serializer = HearingTestResultSerializer(tests.order_by('-test_date'), many=True)
    return Response(serializer.data)
