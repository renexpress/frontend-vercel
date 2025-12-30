import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AddClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    company_name: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'ФИО обязательно для заполнения';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/clients/`, formData);
      navigate('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      if (error.response?.data?.phone) {
        setErrors({ phone: 'Клиент с таким телефоном уже существует' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    transition: 'all 0.2s',
    outline: 'none',
    backgroundColor: '#fff'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#475569',
    fontSize: '14px'
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '13px',
    marginTop: '6px'
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/clients')}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '15px',
            padding: 0
          }}
        >
          ← Назад к списку
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          Новый клиент
        </h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>
          Заполните информацию о новом клиенте
        </p>
      </div>

      {/* Form Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        maxWidth: '800px'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Basic Info Section */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              Основная информация
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>
                  ФИО клиента <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Иванов Иван Иванович"
                  style={{
                    ...inputStyle,
                    borderColor: errors.full_name ? '#dc2626' : '#e2e8f0'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = errors.full_name ? '#dc2626' : '#e2e8f0'}
                />
                {errors.full_name && <div style={errorStyle}>{errors.full_name}</div>}
              </div>

              <div>
                <label style={labelStyle}>
                  Телефон <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+7 (999) 123-45-67"
                  style={{
                    ...inputStyle,
                    borderColor: errors.phone ? '#dc2626' : '#e2e8f0'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = errors.phone ? '#dc2626' : '#e2e8f0'}
                />
                {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  Телефон будет использоваться как пароль для входа в мобильное приложение
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  style={{
                    ...inputStyle,
                    borderColor: errors.email ? '#dc2626' : '#e2e8f0'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = errors.email ? '#dc2626' : '#e2e8f0'}
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
              </div>

              <div>
                <label style={labelStyle}>Название компании</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="ООО Компания"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              Адрес доставки
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="ул. Примерная, д. 1, кв. 1"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Город</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Москва"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={labelStyle}>Почтовый индекс</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="123456"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              Дополнительно
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Заметки</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Дополнительная информация о клиенте..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '100px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: formData.is_active ? '#667eea' : '#e2e8f0',
                  background: formData.is_active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {formData.is_active && (
                    <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: '500', color: '#475569' }}>Активный клиент</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              style={{
                padding: '14px 28px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                color: '#64748b',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'white';
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 32px',
                border: 'none',
                borderRadius: '12px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              {loading ? 'Сохранение...' : 'Создать клиента'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginTop: '20px',
        maxWidth: '800px',
        border: '1px solid #667eea30'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Информация о входе в систему
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
              После создания клиента, ему будет присвоен логин вида <strong>RE + ID</strong> (например, RE125).
              В качестве пароля для входа в мобильное приложение будет использоваться номер телефона клиента.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddClient;
