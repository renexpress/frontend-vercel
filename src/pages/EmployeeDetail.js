import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const ROLE_CONFIG = {
  warehouse_istanbul: { label: 'Склад Стамбул', color: '#3B82F6', bg: '#DBEAFE' },
  warehouse_moscow: { label: 'Склад Москва', color: '#8B5CF6', bg: '#EDE9FE' },
  courier: { label: 'Курьер', color: '#2AABAB', bg: '#E0F5F5' },
  manager: { label: 'Менеджер', color: '#10B981', bg: '#D1FAE5' },
};

const ROLES = [
  { value: 'warehouse_istanbul', label: 'Склад Стамбул' },
  { value: 'warehouse_moscow', label: 'Склад Москва' },
  { value: 'courier', label: 'Курьер' },
  { value: 'manager', label: 'Менеджер' },
];

function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/${id}/`);
      setEmployee(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Error fetching employee:', err);
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.patch(`${API_URL}/employees/${id}/`, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
        is_active: formData.is_active,
      });
      setEmployee({ ...employee, ...formData });
      setIsEditing(false);
      setSuccessMessage('Сотрудник обновлён');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/employees/${id}/`);
      navigate('/employees');
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await axios.post(`${API_URL}/employees/${id}/reset_password/`, {
        password: newPassword || undefined,
      });
      if (response.data.success) {
        setSuccessMessage(`Новый пароль: ${response.data.password}`);
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        setError(response.data.message || 'Ошибка сброса пароля');
      }
    } catch (err) {
      setError('Ошибка сброса пароля');
    }
  };

  const handleCancel = () => {
    setFormData(employee);
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const roleInfo = ROLE_CONFIG[employee.role] || { label: employee.role, color: '#6B7280', bg: '#F3F4F6' };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate('/employees')}
          style={{
            ...styles.backBtn,
            backgroundColor: hoveredBtn === 'back' ? '#f6f6f7' : 'transparent',
          }}
          onMouseEnter={() => setHoveredBtn('back')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
          </svg>
          Сотрудники
        </button>
        <h1 style={styles.title}>{employee.full_name}</h1>
        <div style={styles.headerActions}>
          {!isEditing ? (
            <>
              <button
                style={{
                  ...styles.editBtn,
                  backgroundColor: hoveredBtn === 'edit' ? '#1a1a1a' : '#303030',
                }}
                onClick={() => setIsEditing(true)}
                onMouseEnter={() => setHoveredBtn('edit')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#fff">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
                Редактировать
              </button>
              <button
                style={{
                  ...styles.passwordBtn,
                  backgroundColor: hoveredBtn === 'password' ? '#FEF3C7' : '#fff',
                }}
                onClick={() => setShowPasswordModal(true)}
                onMouseEnter={() => setHoveredBtn('password')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#D97706">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                </svg>
              </button>
              <button
                style={{
                  ...styles.deleteBtn,
                  backgroundColor: hoveredBtn === 'delete' ? '#fef2f2' : '#fff',
                }}
                onClick={() => setShowDeleteModal(true)}
                onMouseEnter={() => setHoveredBtn('delete')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#d72c0d">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                style={{
                  ...styles.cancelBtn,
                  backgroundColor: hoveredBtn === 'cancel' ? '#f6f6f7' : '#fff',
                }}
                onClick={handleCancel}
                onMouseEnter={() => setHoveredBtn('cancel')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorBanner}>{error}</div>}
      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      <div style={styles.mainGrid}>
        {/* Left Column - Employee Info */}
        <div style={styles.leftColumn}>
          {/* Profile Card */}
          <div style={styles.card}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {getInitials(employee.full_name)}
              </div>
              <div style={styles.profileInfo}>
                <div style={styles.profileName}>{employee.full_name}</div>
                <div style={styles.profileMeta}>
                  <span style={styles.username}>@{employee.username}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: employee.is_active ? '#e3f4e8' : '#fef2f2',
                    color: employee.is_active ? '#2AABAB' : '#d72c0d',
                  }}>
                    <span style={{
                      ...styles.statusDot,
                      backgroundColor: employee.is_active ? '#2AABAB' : '#d72c0d',
                    }}/>
                    {employee.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Информация</div>

              <div style={styles.field}>
                <label style={styles.label}>ФИО</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    style={styles.input}
                  />
                ) : (
                  <div style={styles.value}>{employee.full_name}</div>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Телефон</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    style={styles.input}
                  />
                ) : (
                  <div style={styles.value}>{employee.phone || '—'}</div>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Роль</label>
                {isEditing ? (
                  <select
                    name="role"
                    value={formData.role || ''}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: roleInfo.bg,
                    color: roleInfo.color,
                  }}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
            </div>

            {/* Status Toggle */}
            {isEditing && (
              <div style={styles.section}>
                <label style={styles.checkboxLabel}>
                  <div style={{
                    ...styles.checkbox,
                    backgroundColor: formData.is_active ? '#303030' : '#fff',
                    borderColor: formData.is_active ? '#303030' : '#c9cccf',
                  }}>
                    {formData.is_active && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="#fff">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <span>Активный сотрудник</span>
                </label>
              </div>
            )}

            {/* Meta */}
            <div style={styles.metaSection}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Создан</span>
                <span style={styles.metaValue}>{formatDate(employee.created_at)}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Обновлен</span>
                <span style={styles.metaValue}>{formatDate(employee.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Login Info Card */}
          <div style={styles.loginCard}>
            <div style={styles.loginIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#303030">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div style={styles.loginContent}>
              <div style={styles.loginTitle}>Данные для входа в Employee App</div>
              <div style={styles.loginDetails}>
                <span>Логин: <strong>{employee.username}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div style={styles.rightColumn}>
          {/* Role Description Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>О роли</h2>
            </div>
            <div style={styles.cardBody}>
              {employee.role === 'warehouse_istanbul' && (
                <p style={styles.roleDescription}>
                  Сотрудник склада в Стамбуле. Принимает товары, сканирует заказы,
                  обновляет статусы заказов при поступлении на склад.
                </p>
              )}
              {employee.role === 'warehouse_moscow' && (
                <p style={styles.roleDescription}>
                  Сотрудник склада в Москве. Принимает товары из Стамбула,
                  сканирует заказы, готовит к выдаче или доставке.
                </p>
              )}
              {employee.role === 'courier' && (
                <p style={styles.roleDescription}>
                  Курьер для доставки заказов клиентам. Получает маршруты доставки,
                  обновляет статусы при вручении заказов.
                </p>
              )}
              {employee.role === 'manager' && (
                <p style={styles.roleDescription}>
                  Менеджер с расширенными правами. Может управлять заказами,
                  просматривать статистику и координировать работу.
                </p>
              )}
            </div>
          </div>

          {/* Permissions Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Доступ в приложении</h2>
            </div>
            <div style={styles.permissionsList}>
              <div style={styles.permissionItem}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#2AABAB">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Просмотр заказов</span>
              </div>
              <div style={styles.permissionItem}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#2AABAB">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Сканирование QR-кодов</span>
              </div>
              <div style={styles.permissionItem}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#2AABAB">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Обновление статусов заказов</span>
              </div>
              <div style={styles.permissionItem}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#2AABAB">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Добавление фото к заказам</span>
              </div>
              {(employee.role === 'manager' || employee.role === 'courier') && (
                <div style={styles.permissionItem}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#2AABAB">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Маршруты доставки</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="#d72c0d">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 style={styles.modalTitle}>Удалить сотрудника?</h3>
            <p style={styles.modalText}>
              Вы уверены, что хотите удалить сотрудника <strong>{employee.full_name}</strong>?
              Это действие нельзя отменить.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button
                style={styles.modalDeleteBtn}
                onClick={handleDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Сброс пароля</h3>
            <p style={styles.modalText}>
              Сотрудник: <strong>{employee.full_name}</strong> (@{employee.username})
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Новый пароль (оставьте пустым для генерации)</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Введите новый пароль или оставьте пустым"
                style={styles.input}
              />
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                Отмена
              </button>
              <button
                style={styles.modalSaveBtn}
                onClick={handleResetPassword}
              >
                Сбросить пароль
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '16px 20px',
    minHeight: '100vh',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e3e3e3',
    borderTopColor: '#303030',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#5c5f62',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  title: {
    flex: 1,
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#303030',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  passwordBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #D97706',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #d72c0d',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#2AABAB',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#303030',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // Messages
  errorBanner: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px',
  },

  // Main Grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e1e3e5',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  cardBody: {
    padding: '16px 20px',
  },

  // Profile Header
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '20px',
    borderBottom: '1px solid #e1e3e5',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: '#2AABAB',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#303030',
    marginBottom: '6px',
  },
  profileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  username: {
    fontSize: '12px',
    color: '#6d7175',
    fontFamily: 'monospace',
    backgroundColor: '#f6f6f7',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },

  // Section
  section: {
    padding: '16px 20px',
    borderBottom: '1px solid #e1e3e5',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '12px',
  },

  // Fields
  field: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
    marginBottom: '4px',
  },
  value: {
    fontSize: '14px',
    color: '#303030',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#303030',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#303030',
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#303030',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '2px solid #c9cccf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },

  // Meta
  metaSection: {
    padding: '16px 20px',
    display: 'flex',
    gap: '20px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#8c9196',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  metaValue: {
    fontSize: '13px',
    color: '#6d7175',
  },

  // Login Card
  loginCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    backgroundColor: '#f6f6f7',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
  },
  loginIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e1e3e5',
  },
  loginContent: {
    flex: 1,
  },
  loginTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    marginBottom: '4px',
  },
  loginDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6d7175',
  },

  // Role Description
  roleDescription: {
    fontSize: '14px',
    color: '#6d7175',
    lineHeight: '1.6',
    margin: 0,
  },

  // Permissions
  permissionsList: {
    padding: '16px 20px',
  },
  permissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    fontSize: '14px',
    color: '#303030',
    borderBottom: '1px solid #f1f1f1',
  },

  // Form Group
  formGroup: {
    marginBottom: '16px',
    textAlign: 'left',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 8px',
  },
  modalText: {
    fontSize: '14px',
    color: '#6d7175',
    margin: '0 0 20px',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
    cursor: 'pointer',
  },
  modalDeleteBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#d72c0d',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
  modalSaveBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#2AABAB',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default EmployeeDetail;
