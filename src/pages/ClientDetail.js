import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}/`);
      setClient(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'ФИО обязательно для заполнения';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await axios.put(`${API_URL}/clients/${id}/`, formData);
      setClient(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
      if (error.response?.data?.phone) {
        setErrors({ phone: 'Клиент с таким телефоном уже существует' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/clients/${id}/`);
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleCancel = () => {
    setFormData(client);
    setIsEditing(false);
    setErrors({});
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (clientId) => {
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea'];
    return colors[clientId % colors.length];
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.2s',
    outline: 'none',
    backgroundColor: '#fff'
  };

  const viewStyle = {
    padding: '12px 0',
    fontSize: '15px',
    color: '#1e293b'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#64748b',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#667eea' }}>Загрузка...</div>
      </div>
    );
  }

  if (!client) return null;

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
      </div>

      {/* Main Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        maxWidth: '900px'
      }}>
        {/* Profile Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '700',
              backdropFilter: 'blur(10px)'
            }}>
              {getInitials(client.full_name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{client.full_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px', opacity: 0.9 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {client.username}
                </span>
                <span>{client.phone}</span>
                {client.company_name && <span>• {client.company_name}</span>}
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: client.is_active ? 'rgba(67, 233, 123, 0.3)' : 'rgba(220, 38, 38, 0.3)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {client.is_active ? 'Активен' : 'Неактивен'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '40px' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #fee2e2',
                    borderRadius: '10px',
                    background: '#fff5f5',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🗑️ Удалить
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '10px',
                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? 'Сохранение...' : '✓ Сохранить'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
              </>
            )}
          </div>

          {/* Info Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Left Column - Contact Info */}
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                Контактная информация
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>ФИО</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        borderColor: errors.full_name ? '#dc2626' : '#e2e8f0'
                      }}
                    />
                    {errors.full_name && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{errors.full_name}</div>}
                  </>
                ) : (
                  <div style={viewStyle}>{client.full_name}</div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Телефон (пароль)</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        borderColor: errors.phone ? '#dc2626' : '#e2e8f0'
                      }}
                    />
                    {errors.phone && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{errors.phone}</div>}
                  </>
                ) : (
                  <div style={viewStyle}>{client.phone}</div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        borderColor: errors.email ? '#dc2626' : '#e2e8f0'
                      }}
                    />
                    {errors.email && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{errors.email}</div>}
                  </>
                ) : (
                  <div style={viewStyle}>{client.email || '—'}</div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Компания</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                ) : (
                  <div style={viewStyle}>{client.company_name || '—'}</div>
                )}
              </div>
            </div>

            {/* Right Column - Address & Other */}
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                Адрес доставки
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Адрес</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                ) : (
                  <div style={viewStyle}>{client.address || '—'}</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Город</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  ) : (
                    <div style={viewStyle}>{client.city || '—'}</div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Индекс</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code || ''}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  ) : (
                    <div style={viewStyle}>{client.postal_code || '—'}</div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Заметки</label>
                {isEditing ? (
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                ) : (
                  <div style={viewStyle}>{client.notes || '—'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Статус</label>
                {isEditing ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: '2px solid',
                      borderColor: formData.is_active ? '#667eea' : '#e2e8f0',
                      background: formData.is_active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {formData.is_active && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                    </div>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span style={{ color: '#475569' }}>Активный клиент</span>
                  </label>
                ) : (
                  <div style={viewStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: client.is_active ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : '#fee2e2',
                      color: client.is_active ? 'white' : '#dc2626'
                    }}>
                      {client.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid #f1f5f9',
            display: 'flex',
            gap: '30px',
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ fontWeight: '600' }}>Создан:</span>{' '}
              {new Date(client.created_at).toLocaleString('ru-RU')}
            </div>
            <div>
              <span style={{ fontWeight: '600' }}>Обновлен:</span>{' '}
              {new Date(client.updated_at).toLocaleString('ru-RU')}
            </div>
          </div>
        </div>
      </div>

      {/* Login Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginTop: '20px',
        maxWidth: '900px',
        border: '1px solid #667eea30'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '24px' }}>🔐</span>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Данные для входа в мобильное приложение
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              Логин: <strong style={{ color: '#667eea' }}>{client.username}</strong> • Пароль: <strong style={{ color: '#667eea' }}>{client.phone}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px'
              }}>
                ⚠️
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>
                Удалить клиента?
              </h3>
              <p style={{ color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Вы уверены, что хотите удалить клиента <strong>{client.full_name}</strong>?
                Это действие нельзя отменить.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetail;
