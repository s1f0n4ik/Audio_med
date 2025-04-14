from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
import numpy as np
from .models import HearingTestResult
from .serializers import HearingTestResultSerializer


def calculate_reliability(results):
    heard_count = sum(1 for r in results if r['heard'])
    total = len(results)
    return heard_count / total if total > 0 else 0


@api_view(['POST'])
def save_results(request):
    try:
        data = request.data.get('data', [])
        patient_data = request.data.get('patient', {})
        thresholds = {}
        reliabilities = {}

        if not isinstance(data, list):
            return Response({'status': 'error', 'message': 'Invalid data format'})

        for freq in [500, 1000, 2000, 4000, 8000]:
            freq_results = [r for r in data if r.get('frequency') == freq]
            freq_key = str(freq)

            if not freq_results:
                thresholds[freq_key] = None
                reliabilities[freq_key] = 0
                continue

            reliability = calculate_reliability(freq_results)
            reliabilities[freq_key] = reliability

            heard_volumes = [
                r['volume'] for r in freq_results
                if r.get('heard', False) and isinstance(r.get('volume'), (int, float))
            ]

            thresholds[freq_key] = min(heard_volumes) if heard_volumes else None

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

            threshold_500=thresholds.get('500'),
            threshold_1000=thresholds.get('1000'),
            threshold_2000=thresholds.get('2000'),
            threshold_4000=thresholds.get('4000'),
            threshold_8000=thresholds.get('8000'),

            reliability_500=reliabilities.get('500', 0),
            reliability_1000=reliabilities.get('1000', 0),
            reliability_2000=reliabilities.get('2000', 0),
            reliability_4000=reliabilities.get('4000', 0),
            reliability_8000=reliabilities.get('8000', 0),
            calibration_data=CALIBRATION_VALUES,

            diagnosis=diagnosis,
            recommendations=get_recommendations(diagnosis)
        )
        test_result.save()

        return Response({
            'status': 'success',
            'test_id': test_result.id,
            'thresholds': thresholds,
            'reliabilities': reliabilities,
            'diagnosis': diagnosis,
            'recommendations': test_result.recommendations
        })
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)})


def generate_diagnosis(thresholds):
    norm_thresholds = {
        '500': 20,
        '1000': 15,
        '2000': 10,
        '4000': 5,
        '8000': 0
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
        data = {
            'test_date': test.test_date,
            'patient_last_name': test.patient_last_name,
            'patient_first_name': test.patient_first_name,
            'patient_middle_name': test.patient_middle_name,
            'patient_birth_date': test.patient_birth_date,
            'patient_gender': test.patient_gender,
            'diagnosis': test.diagnosis,
            'recommendations': test.recommendations,
            'thresholds': {
                '500': test.threshold_500,
                '1000': test.threshold_1000,
                '2000': test.threshold_2000,
                '4000': test.threshold_4000,
                '8000': test.threshold_8000,
            },
            'reliabilities': {
                '500': test.reliability_500,
                '1000': test.reliability_1000,
                '2000': test.reliability_2000,
                '4000': test.reliability_4000,
                '8000': test.reliability_8000,
            }
        }
        return Response(data)
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


CALIBRATION_VALUES = {
    '500': {'factor': 1.02, 'max_db': 110},
    '1000': {'factor': 0.98, 'max_db': 115},
    '2000': {'factor': 1.05, 'max_db': 120},
    '4000': {'factor': 0.95, 'max_db': 115},
    '8000': {'factor': 1.1, 'max_db': 105}
}


@api_view(['GET'])
def get_calibration(request):
    """Возвращает калибровочные коэффициенты для оборудования"""
    return Response({
        'status': 'success',
        'calibration': CALIBRATION_VALUES,
        'timestamp': timezone.now()
    })
