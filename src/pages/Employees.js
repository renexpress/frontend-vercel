import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';

const ROLE_CONFIG = {
  warehouse_istanbul: { label: 'Склад Стамбул', color: '#3B82F6', bg: '#DBEAFE' },
  warehouse_moscow: { label: 'Склад Москва', color: '#8B5CF6', bg: '#EDE9FE' },
  courier: { label: 'Курьер', color: '#FF6B35', bg: '#FFF4F0' },
  manager: { label: 'Менеджер', color: '#10B981', bg: '#D1FAE5' },
};

const ROLES = [
  { value: 'warehouse_istanbul', label: 'Склад Стамбул' },
  { value: 'warehouse_moscow', label: 'Склад Москва' },
  { value: 'courier', label: 'Курьер' },
  { value: 'manager', label: 'Менеджер' },
];

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'warehouse_istanbul',
    is_active: true,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/`);
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      setError('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.full_name) {
      setError('Заполните обязательные поля');
      return;
    }

    if (!editingEmployee && !formData.password) {
      setError('Введите пароль для нового сотрудника');
      return;
    }

    try {
      const url = editingEmployee
        ? `${API_URL}/employees/${editingEmployee.id}/`
        : `${API_URL}/employees/`;

      const method = editingEmployee ? 'PATCH' : 'POST';
      const body = editingEmployee
        ? { full_name: formData.full_name, phone: formData.phone, role: formData.role, is_active: formData.is_active }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccessMessage(editingEmployee ? 'Сотрудник обновлён' : 'Сотрудник создан');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowModal(false);
        resetForm();
        loadEmployees();
      } else {
        const data = await response.json();
        setError(data.detail || data.username?.[0] || 'Ошибка сохранения');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(`${API_URL}/employees/${selectedEmployee.id}/reset_password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Новый пароль: ${data.password}`);
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedEmployee(null);
      } else {
        setError(data.message || 'Ошибка сброса пароля');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Удалить сотрудника ${employee.full_name}?`)) return;

    try {
      const response = await fetch(`${API_URL}/employees/${employee.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Сотрудник удалён');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadEmployees();
      }
    } catch (error) {
      setError('Ошибка удаления');
    }
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: '',
      full_name: employee.full_name,
      phone: employee.phone || '',
      role: employee.role,
      is_active: employee.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'warehouse_istanbul',
      is_active: true,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Сотрудники</h1>
          <p style={styles.subtitle}>Управление сотрудниками для Employee App</p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Добавить сотрудника
        </button>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorBanner}>{error}</div>}
      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      {/* Employees Grid */}
      <div style={styles.grid}>
        {employees.map((employee) => {
          const roleInfo = ROLE_CONFIG[employee.role] || { label: employee.role, color: '#6B7280', bg: '#F3F4F6' };

          return (
            <div key={employee.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {employee.full_name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.employeeName}>{employee.full_name}</h3>
                  <p style={styles.username}>@{employee.username}</p>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: employee.is_active ? '#D1FAE5' : '#FEE2E2',
                  color: employee.is_active ? '#059669' : '#DC2626',
                }}>
                  {employee.is_active ? 'Активен' : 'Неактивен'}
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Роль</span>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: roleInfo.bg,
                    color: roleInfo.color,
                  }}>
                    {roleInfo.label}
                  </span>
                </div>
                {employee.phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Телефон</span>
                    <span style={styles.infoValue}>{employee.phone}</span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Создан</span>
                  <span style={styles.infoValue}>{formatDate(employee.created_at)}</span>
                </div>
              </div>

              <div style={styles.cardActions}>
                <button
                  style={styles.actionButton}
                  onClick={() => openEditModal(employee)}
                >
                  Редактировать
                </button>
                <button
                  style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowPasswordModal(true);
                  }}
                >
                  Сбросить пароль
                </button>
                <button
                  style={{ ...styles.actionButton, ...styles.actionButtonDanger }}
                  onClick={() => handleDelete(employee)}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>👤</p>
            <p style={styles.emptyText}>Нет сотрудников</p>
            <p style={styles.emptySubtext}>Добавьте первого сотрудника для Employee App</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Логин *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingEmployee}
                  placeholder="Логин для входа"
                />
              </div>

              {!editingEmployee && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Пароль *</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Пароль для входа"
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>ФИО *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Полное имя"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Телефон</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 999 123 4567"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Роль</label>
                <select
                  style={styles.select}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Активен</span>
                </label>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingEmployee ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedEmployee && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Сброс пароля</h2>
            <p style={styles.modalSubtitle}>
              Сотрудник: {selectedEmployee.full_name} (@{selectedEmployee.username})
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Новый пароль (оставьте пустым для генерации)</label>
              <input
                style={styles.input}
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Введите новый пароль или оставьте пустым"
              />
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedEmployee(null);
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                style={styles.submitButton}
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
  container: {
    padding: '32px 40px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#64748B',
  },
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #E2E8F0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#FFF5F2',
    color: '#FF6B35',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
  },
  username: {
    fontSize: '13px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  infoValue: {
    fontSize: '13px',
    color: '#1E293B',
    fontWeight: '500',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  actionButton: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  actionButtonSecondary: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1E293B',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
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
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '440px',
    margin: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '0 0 20px 0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Employees;
