import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart } from 'chart.js/auto';

const TestResult = () => {
  const { testId } = useParams();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartInstance = useRef(null);
  const chartRef = useRef(null);

  const renderAudiogram = useCallback((thresholds = {}, reliabilities = {}) => {
    console.log('Rendering audiogram with thresholds:', thresholds, 'reliabilities:', reliabilities);

    // Проверка на существование необходимых данных
    if (!thresholds || !reliabilities) {
      console.error('Missing thresholds or reliabilities');
      return;
    }

    // Ждем пока canvas станет доступен
    if (!chartRef.current) {
      console.error('Canvas ref not available - retrying in 100ms');
      setTimeout(() => renderAudiogram(thresholds, reliabilities), 100);
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
      '500': 20,
      '1000': 15,
      '2000': 10,
      '4000': 5,
      '8000': 0
    };

    // Подготовка данных с защитой от undefined
    const labels = ['500', '1000', '2000', '4000', '8000'].map(f => `${f} Гц`);
    const userData = labels.map(label => {
      const freq = label.split(' ')[0];
      return thresholds[freq] !== undefined ? thresholds[freq] : null;
    });

    const normData = labels.map(label => normThresholds[label.split(' ')[0]]);
    const reliabilityColors = labels.map(label => {
      const freq = label.split(' ')[0];
      const rel = reliabilities[freq] || 0; // Защита от undefined
      return rel >= 0.8 ? '#4bc0c0' : '#ff6384';
    });

    try {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ваш слух',
              data: userData,
              borderColor: reliabilityColors,
              backgroundColor: reliabilityColors.map(c => `${c}40`),
              borderWidth: 2,
              pointBackgroundColor: reliabilityColors,
              pointRadius: 6,
              pointHoverRadius: 8,
              showLine: true,
              spanGaps: true,
            },
            {
              label: 'Норма',
              data: normData,
              borderColor: '#ff6384',
              borderDash: [5, 5],
              pointRadius: 4,
              backgroundColor: 'rgba(255, 99, 132, 0.1)'
            }
          ]
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const freq = context.label.split(' ')[0];
                  const rel = reliabilities[freq] || 0;
                  const relText = rel >= 0.8 ? 'Высокая' : 'Низкая';
                  return [
                    `${context.dataset.label}: ${context.parsed.y} дБ`,
                    `Достоверность: ${relText} (${Math.round(rel * 100)}%)`
                  ];
                }
              }
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              title: { display: true, text: 'Громкость (дБ)' },
              reverse: false,
              min: 0,
              max: 120,
              ticks: {
                stepSize: 10
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
  }, []);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/results/${testId}/`);
        setTestData(response.data);

        // Добавляем небольшую задержку для гарантированной доступности canvas
        setTimeout(() => {
          renderAudiogram(response.data.thresholds || {}, response.data.reliabilities || {});
        }, 100);
      } catch (err) {
        setError('Не удалось загрузить данные теста');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, renderAudiogram]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#2c3e50', textAlign: 'center' }}>
        Результат теста от {formatDate(testData.test_date)}
      </h2>

      <div style={{ margin: '20px 0' }}>
        <h3 style={{ color: '#34495e' }}>Пациент:</h3>
        <p>
          {testData.patient_last_name} {testData.patient_first_name} {testData.patient_middle_name}
          <br />
          Дата рождения: {formatDate(testData.patient_birth_date)}
          <br />
          Пол: {testData.patient_gender === 'M' ? 'Мужской' : 'Женский'}
        </p>
      </div>

      <div style={{ margin: '30px 0', height: '300px' }}>
        <canvas ref={chartRef} style={{ width: '100%' }} />
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Заключение:</h3>
        <p style={{
          fontSize: '18px',
          color: '#2c3e50',
          padding: '10px',
          backgroundColor: '#ecf0f1',
          borderRadius: '4px'
        }}>
          {testData.diagnosis}
        </p>

        <h3 style={{ color: '#34495e', margin: '15px 0' }}>Рекомендации:</h3>
        <p style={{
          fontSize: '16px',
          color: '#2c3e50',
          padding: '10px',
          backgroundColor: '#ecf0f1',
          borderRadius: '4px'
        }}>
          {testData.recommendations}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => window.location.href = '/tests'}
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
          Вернуться к списку
        </button>
        <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Домашняя страница
        </button>
      </div>
    </div>
  );
};

export default TestResult;