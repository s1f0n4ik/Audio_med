import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientTests = () => {
  const [searchParams, setSearchParams] = useState({
    lastName: '',
    firstName: '',
    birthDate: ''
  });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchTests = async () => {
    if (!searchParams.lastName || !searchParams.firstName || !searchParams.birthDate) {
      setError('Заполните все поля для поиска');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('http://localhost:8000/api/patient-tests/', {
        params: {
          last_name: searchParams.lastName,
          first_name: searchParams.firstName,
          birth_date: searchParams.birthDate
        }
      });
      setTests(response.data);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '30px' }}>История исследований</h2>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Поиск исследований</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Фамилия*</label>
            <input
              type="text"
              name="lastName"
              value={searchParams.lastName}
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Имя*</label>
            <input
              type="text"
              name="firstName"
              value={searchParams.firstName}
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Дата рождения*</label>
            <input
              type="date"
              name="birthDate"
              value={searchParams.birthDate}
              onChange={handleSearchChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <button
          onClick={searchTests}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Загрузка...' : 'Найти'}
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

        {error && <p style={{ color: '#e74c3c', marginTop: '10px' }}>{error}</p>}
      </div>

      {tests.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Дата теста</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Тип теста</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Заключение</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px' }}>{formatDate(test.test_date)}</td>
                  <td style={{ padding: '12px' }}>{test.test_type}</td>
                  <td style={{ padding: '12px' }}>{test.diagnosis}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => navigate(`/results/${test.id}`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Просмотр
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Исследования не найдены</p>
      )}
    </div>
  );
};

export default PatientTests;