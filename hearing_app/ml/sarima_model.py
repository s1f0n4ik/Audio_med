import numpy as np
import librosa
from statsmodels.tsa.statespace.sarimax import SARIMAX


def simulate_audio_data():
    """
    Генерация тестовых данных для проверки пригодности SARIMA как модели для анализа
    норма (синус) vs паталогия (синус + шум)
    """
    t = np.linspace(0, 1, 1000)
    normal = np.sin(2 * np.pi * 440 * t)  # Предположим это нота "Ля"
    patology = normal + np.random.normal(0, 0.5, len(t))
    return normal, patology


def train_sarima(audio_data):
    model = SARIMAX(audio_data, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    results = model.fit(disp=False)
    return results


# Тестировка
if __name__ == "__main__":
    normal, pathology = simulate_audio_data()
    results_normal = train_sarima(normal)
    results_pathology = train_sarima(pathology)

    print("Норма:", results_normal.aic)  # AIC для сравнения моделей
    print("Патология:", results_pathology.aic)
