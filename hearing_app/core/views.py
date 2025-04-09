# core/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
import numpy as np


@api_view(['POST'])
def save_results(request):
    try:
        data = request.data.get('data', [])
        thresholds = {}

        # Проверяем, что данные пришли в правильном формате
        if not isinstance(data, list):
            return Response({'status': 'error', 'message': 'Invalid data format'})

        # Обрабатываем каждую частоту
        for freq in [500, 1000, 2000, 4000, 8000]:
            # Фильтруем результаты по текущей частоте
            freq_results = [r for r in data if r.get('frequency') == freq]

            if not freq_results:
                thresholds[str(freq)] = 1.0  # Если нет данных - считаем, что не слышно
                continue

            # Находим минимальную громкость, при которой слышно
            heard_volumes = [
                r['volume'] for r in freq_results
                if r.get('heard', False) and isinstance(r.get('volume'), (int, float))
            ]

            if heard_volumes:
                thresholds[str(freq)] = min(heard_volumes)
            else:
                thresholds[str(freq)] = 1.0  # Если ни разу не слышал

        # Генерируем диагноз
        diagnosis = generate_diagnosis(thresholds)

        return Response({
            'status': 'success',
            'thresholds': thresholds,
            'diagnosis': diagnosis,
            'tested_frequencies': list(thresholds.keys())  # Для отладки
        })
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)})


def generate_diagnosis(thresholds):
    # Нормативные значения громкости
    norm_thresholds = {
        '500': 0.1,
        '1000': 0.08,
        '2000': 0.05,
        '4000': 0.03,
        '8000': 0.02
    }

    deviations = []

    # Сравниваем с нормой для каждой частоты
    for freq, norm in norm_thresholds.items():
        user_threshold = thresholds.get(freq, 1.0)
        if isinstance(user_threshold, (int, float)):
            deviations.append(user_threshold - norm)

    # Рассчитываем среднее отклонение
    avg_deviation = np.mean(deviations) if deviations else 0

    # Формируем заключение
    if avg_deviation < 0.1:
        return "Ваш слух в пределах нормы"
    elif 0.1 <= avg_deviation < 0.3:
        return "Легкое снижение слуха"
    elif 0.3 <= avg_deviation < 0.6:
        return "Умеренное снижение слуха"
    else:
        return "Рекомендуется консультация специалиста"
