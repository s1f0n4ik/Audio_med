import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/results/${testId}/`);
        setTestData(response.data);
        renderAudiogram(response.data);
      } catch (err) {
        setError('Не удалось загрузить данные теста');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  const renderAudiogram = (data) => {
    if (!chartRef.current || !data) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const normThresholds = {
      '500': 0.1,
      '1000': 0.08,
      '2000': 0.05,
      '4000': 0.03,
      '8000': 0.02
    };

    const labels = ['500', '1000', '2000', '4000', '8000'].map(f => `${f} Гц`);
    const userData = [
      data.threshold_500,
      data.threshold_1000,
      data.threshold_2000,
      data.threshold_4000,
      data.threshold_8000
    ];
    const normData = labels.map(label => normThresholds[label.split(' ')[0]] || 0);

    try {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Слух пациента',
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