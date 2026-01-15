import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const sortRef = useRef(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'warehouse_istanbul',
    is_active: true,
  });

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'inactive', label: 'Неактивные' },
    { id: 'warehouse_istanbul', label: 'Склад Стамбул' },
    { id: 'warehouse_moscow', label: 'Склад Москва' },
    { id: 'courier', label: 'Курьеры' },
    { id: 'manager', label: 'Менеджеры' },
  ];

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'name_asc', label: 'Имя А-Я' },
    { id: 'name_desc', label: 'Имя Я-А' },
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'all': return employees.length;
      case 'active': return employees.filter(e => e.is_active).length;
      case 'inactive': return employees.filter(e => !e.is_active).length;
      case 'warehouse_istanbul': return employees.filter(e => e.role === 'warehouse_istanbul').length;
      case 'warehouse_moscow': return employees.filter(e => e.role === 'warehouse_moscow').length;
      case 'courier': return employees.filter(e => e.role === 'courier').length;
      case 'manager': return employees.filter(e => e.role === 'manager').length;
      default: return 0;
    }
  };

  const filteredEmployees = employees
    .filter(employee => {
      const matchesSearch =
        (employee.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.phone || '').includes(searchTerm) ||
        (employee.username || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (activeTab === 'active') return matchesSearch && employee.is_active;
      if (activeTab === 'inactive') return matchesSearch && !employee.is_active;
      if (['warehouse_istanbul', 'warehouse_moscow', 'courier', 'manager'].includes(activeTab)) {
        return matchesSearch && employee.role === activeTab;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_asc': return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc': return new Date(b.created_at) - new Date(a.created_at);
        case 'name_asc': return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name_desc': return (b.full_name || '').localeCompare(a.full_name || '');
        default: return 0;
      }
    });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.full_name || !formData.password) {
      setError('Заполните обязательные поля');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage('Сотрудник создан');
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

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'warehouse_istanbul',
      is_active: true,
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

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Сотрудники</h1>
        <button
          style={{
            ...styles.addBtn,
            backgroundColor: hoveredBtn === 'add' ? '#1a1a1a' : '#303030',
            transform: hoveredBtn === 'add' ? 'translateY(-1px)' : 'none',
          }}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          onMouseEnter={() => setHoveredBtn('add')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          Добавить сотрудника
        </button>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorBanner}>{error}</div>}
      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      {/* Tabs */}
      <div style={styles.tabsRow}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              borderBottomColor: activeTab === tab.id ? '#303030' : 'transparent',
              color: activeTab === tab.id ? '#303030' : '#6d7175',
              fontWeight: activeTab === tab.id ? '600' : '500',
            }}
          >
            {tab.label}
            <span style={{
              ...styles.tabCount,
              backgroundColor: activeTab === tab.id ? '#303030' : '#e4e5e7',
              color: activeTab === tab.id ? '#fff' : '#6d7175',
            }}>
              {getTabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters Panel */}
      <div style={styles.filtersPanel}>
        <div style={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Поиск по имени, телефону, логину..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearch} onClick={() => setSearchTerm('')}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>

        <div style={styles.filterActions}>
          {/* Sort Dropdown */}
          <div style={styles.sortWrapper} ref={sortRef}>
            <button
              style={{
                ...styles.sortBtn,
                backgroundColor: hoveredBtn === 'sort' || showSort ? '#f6f6f7' : '#fff',
              }}
              onClick={() => setShowSort(!showSort)}
              onMouseEnter={() => setHoveredBtn('sort')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h7a1 1 0 100-2H3zm0 4a1 1 0 100 2h4a1 1 0 100-2H3z"/>
              </svg>
              <span>{sortOptions.find(s => s.id === sortBy)?.label}</span>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {showSort && (
              <div style={styles.sortDropdown}>
                {sortOptions.map(option => (
                  <div
                    key={option.id}
                    style={{
                      ...styles.sortOption,
                      backgroundColor: sortBy === option.id ? '#f6f6f7' : 'transparent',
                    }}
                    onClick={() => { setSortBy(option.id); setShowSort(false); }}
                  >
                    {option.label}
                    {sortBy === option.id && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="#303030">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={styles.resultsRow}>
        <span style={styles.resultsText}>
          {filteredEmployees.length} {filteredEmployees.length === 1 ? 'сотрудник' : 'сотрудников'}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredEmployees.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#c9cccf">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <h3 style={styles.emptyTitle}>Сотрудники не найдены</h3>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Сотрудник</th>
                <th style={styles.th}>Телефон</th>
                <th style={styles.th}>Роль</th>
                <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
                <th style={styles.th}>Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const roleInfo = ROLE_CONFIG[employee.role] || { label: employee.role, color: '#6B7280', bg: '#F3F4F6' };
                return (
                  <tr
                    key={employee.id}
                    onClick={() => navigate(`/employees/${employee.id}`)}
                    style={{
                      ...styles.tr,
                      backgroundColor: hoveredRow === employee.id ? '#f6f6f7' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRow(employee.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>
                      <div style={styles.employeeCell}>
                        <div style={styles.avatar}>
                          {getInitials(employee.full_name)}
                        </div>
                        <div style={styles.employeeInfo}>
                          <span style={styles.employeeName}>{employee.full_name || '—'}</span>
                          <span style={styles.username}>@{employee.username}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {employee.phone ? (
                        <div style={styles.phoneCell}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                          <span>{employee.phone}</span>
                        </div>
                      ) : (
                        <span style={styles.noData}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: roleInfo.bg,
                        color: roleInfo.color,
                      }}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
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
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formatDate(employee.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Новый сотрудник</h2>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Логин *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Логин для входа"
                />
              </div>

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
                  Создать
                </button>
              </div>
            </form>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  addBtn: {
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
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'all 0.15s',
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

  // Tabs
  tabsRow: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #e1e3e5',
    marginBottom: '16px',
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '-1px',
    whiteSpace: 'nowrap',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
  },

  // Filters Panel
  filtersPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: '13px',
    color: '#303030',
    outline: 'none',
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  filterActions: {
    display: 'flex',
    gap: '8px',
  },
  sortWrapper: {
    position: 'relative',
  },
  sortBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#303030',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
    transition: 'all 0.15s',
  },
  sortDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '180px',
    zIndex: 100,
    overflow: 'hidden',
  },
  sortOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#303030',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },

  // Results
  resultsRow: {
    marginBottom: '12px',
  },
  resultsText: {
    fontSize: '13px',
    color: '#6d7175',
  },

  // Table
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    borderBottom: '1px solid #f1f1f1',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#303030',
    verticalAlign: 'middle',
  },

  // Employee Cell
  employeeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6d7175',
    flexShrink: 0,
  },
  employeeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  employeeName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  username: {
    fontSize: '12px',
    color: '#8c9196',
    fontFamily: 'monospace',
  },

  // Phone Cell
  phoneCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#303030',
  },

  // Badges
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  dateText: {
    fontSize: '12px',
    color: '#6d7175',
  },
  noData: {
    color: '#c9cccf',
  },

  // Empty State
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    margin: '16px 0 8px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
  },
  emptyText: {
    margin: 0,
    fontSize: '13px',
    color: '#6d7175',
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
    backgroundColor: '#303030',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Employees;
