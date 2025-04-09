import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';

const AudioTester = () => {
  const [responseData, setResponseData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(500);
  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [results, setResults] = useState([]);
  const [step, setStep] = useState(3); // Шаг изменения громкости

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const chartInstance = useRef(null);
  const chartRef = useRef(null);

  const frequencies = [500, 1000, 2000, 4000, 8000];
  const volumeSteps = [0.01, 0.02, 0.05, 0.1, 0.2];

  // Очистка аудио ресурсов
  const cleanupAudio = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const playTone = (freq, volume, duration = 1000) => {
    cleanupAudio(); // Очищаем предыдущие звуки

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const oscillator = audioCtx.createOscillator();
      oscillatorRef.current = oscillator;

      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = volume;

      oscillator.connect(gainNode).connect(audioCtx.destination);
      oscillator.start();

      setTimeout(() => {
        cleanupAudio();
      }, duration);
    } catch (error) {
      console.error("Audio error:", error);
    }
  };

  const startTest = () => {
    cleanupAudio();
    setIsRunning(true);
    setShowResults(false);
    setCurrentFrequency(frequencies[0]);
    setCurrentVolume(0.5);
    setResults([]);
    playTone(frequencies[0], 0.5);
  };

  const handleResponse = (heard) => {
    cleanupAudio(); // Останавливаем текущий звук перед обработкой

    const newResult = {
      frequency: currentFrequency,
      volume: currentVolume,
      heard,
      timestamp: new Date().toISOString()
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    // Адаптация громкости
    let newVolume = currentVolume;
    if (heard) {
      newVolume = Math.max(0.01, currentVolume - volumeSteps[step]);
    } else {
      newVolume = Math.min(1.0, currentVolume + volumeSteps[step]);
    }
    setCurrentVolume(newVolume);

    // Проверяем, сколько раз тестировали текущую частоту
    const freqTests = updatedResults.filter(r => r.frequency === currentFrequency).length;

    if (freqTests >= 3) {
      // Переход к следующей частоте
      const nextIndex = frequencies.indexOf(currentFrequency) + 1;
      if (nextIndex < frequencies.length) {
        setCurrentFrequency(frequencies[nextIndex]);
        setCurrentVolume(0.5); // Сброс громкости для новой частоты
        playTone(frequencies[nextIndex], 0.5);
      } else {
        endTest();
      }
    } else {
      // Повтор теста с новой громкостью
      setTimeout(() => playTone(currentFrequency, newVolume), 500);
    }
  };

  const endTest = () => {
    cleanupAudio();
    setIsRunning(false);
    sendResults(results);
  };

  const sendResults = async (data) => {
        try {
        const response = await axios.post('http://localhost:8000/api/save-results/', { data });
        console.log('Server response:', response.data);

        if (response.data.status === 'success' && response.data.thresholds) {
          setResponseData(response.data);
          renderAudiogram(response.data.thresholds);
          setShowResults(true);
        } else {
          console.error('Invalid response format', response.data);
        }
      } catch (error) {
        console.error("Ошибка сохранения:", error);
      }
    };

  const renderAudiogram = (thresholds) => {
      console.log('Rendering audiogram with thresholds:', thresholds);

      // Ждем пока canvas станет доступен
      if (!chartRef.current) {
        console.error('Canvas ref not available - retrying in 100ms');
        setTimeout(() => renderAudiogram(thresholds), 100);
        return;
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Удаляем предыдущий график
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Нормативные значения
      const normThresholds = {
        '500': 0.1,
        '1000': 0.08,
        '2000': 0.05,
        '4000': 0.03,
        '8000': 0.02
      };

      // Подготовка данных
      const labels = ['500', '1000', '2000', '4000', '8000'].map(f => `${f} Гц`);
      const userData = labels.map(label => thresholds[label.split(' ')[0]] || 1.0);
      const normData = labels.map(label => normThresholds[label.split(' ')[0]] || 0);

      try {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Ваш слух',
                data: userData,
                borderColor: '#4bc0c0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                pointRadius: 6
              },
              {
                label: 'Норма',
                data: normData,
                borderColor: '#ff6384',
                borderDash: [5, 5],
                pointRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: { display: true, text: 'Громкость' },
                reverse: true,
                min: 0,
                max: 1,
                ticks: {
                  stepSize: 0.1
                }
              },
              x: {
                title: { display: true, text: 'Частота (Гц)' }
              }
            }
          }
        });
      } catch (error) {
        console.error('Chart error:', error);
      }
    };

  // Очистка при размонтировании
  React.useEffect(() => {
        return () => {
        cleanupAudio();
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, []);
//    if (showResults) {
//        renderAudiogram({'500': 0.3, '1000': 0.4, '2000': 0.6, '4000': 0.8, '8000': 1.0});
//      }
//    }, [showResults]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      {!isRunning && !showResults ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#2c3e50' }}>Тест слуха</h2>
          <p style={{ marginBottom: '30px' }}>Используйте наушники для точных результатов</p>
          <button
            onClick={startTest}
            style={{
              padding: '12px 30px',
              fontSize: '18px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            Начать тест
          </button>
        </div>
      ) : isRunning ? (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#34495e' }}>Частота: {currentFrequency} Гц</h3>
          <p style={{ fontSize: '18px' }}>Громкость: {Math.round(currentVolume * 100)}%</p>

          <div style={{ margin: '40px 0' }}>
            <button
              onClick={() => handleResponse(true)}
              style={{
                padding: '12px 25px',
                marginRight: '20px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ✓ Слышу
            </button>
            <button
              onClick={() => handleResponse(false)}
              style={{
                padding: '12px 25px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ✗ Не слышу
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ color: '#2c3e50', textAlign: 'center' }}>Результаты теста</h2>

          <div style={{ margin: '30px 0', height: '300px' }}>
              <canvas
                ref={chartRef}
                style={{ display: showResults ? 'block' : 'none', width: '100%' }}
              />
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Заключение:</h3>
            <p style={{
              fontSize: '18px',
              color: '#2c3e50',
              padding: '10px',
              backgroundColor: '#ecf0f1',
              borderRadius: '4px'
            }}>
              {responseData?.diagnosis || 'Анализ завершён'}
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={() => {
                setShowResults(false);
                startTest();
              }}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Пройти тест снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTester;