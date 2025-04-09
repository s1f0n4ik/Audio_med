# hearing_app/core/train_model.py
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

# Заглушка: генерируем тестовые данные
X = np.random.rand(100, 3) * 10000  # max_freq, mfcc_mean, rms
y = np.random.randint(0, 2, 100)    # 0=норма, 1=патология

model = RandomForestClassifier()
model.fit(X, y)
joblib.dump(model, 'hearing_model.pkl')
