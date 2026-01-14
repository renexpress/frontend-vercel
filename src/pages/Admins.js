import React, { useState, useEffect, useRef } from 'react';
import API_URL from '../config/api';

function Admins() {
  const [admins, setAdmins] = useState([]);
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
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    is_active: true,
  });

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'inactive', label: 'Неактивные' },
  ];

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'name_asc', label: 'Имя А-Я' },
    { id: 'name_desc', label: 'Имя Я-А' },
  ];

  useEffect(() => {
    loadAdmins();
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

  const loadAdmins = async () => {
    try {
      const response = await fetch(`${API_URL}/admins/`);
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins || []);
      } else {
        setError('Ошибка загрузки администраторов');
      }
    } catch (error) {
      setError('Ошибка загрузки администраторов');
    } finally {
      setLoading(false);
    }
  };

  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'all': return admins.length;
      case 'active': return admins.filter(a => a.is_active).length;
      case 'inactive': return admins.filter(a => !a.is_active).length;
      default: return 0;
    }
  };

  const filteredAdmins = admins
    .filter(admin => {
      const matchesSearch =
        (admin.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.phone || '').includes(searchTerm) ||
        (admin.username || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (activeTab === 'active') return matchesSearch && admin.is_active;
      if (activeTab === 'inactive') return matchesSearch && !admin.is_active;
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

    if (!formData.username || !formData.full_name) {
      setError('Заполните обязательные поля');
      return;
    }

    if (!editingAdmin && !formData.password) {
      setError('Введите пароль');
      return;
    }

    try {
      const url = editingAdmin
        ? `${API_URL}/admins/${editingAdmin.id}/`
        : `${API_URL}/admins/create/`;
      const method = editingAdmin ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(editingAdmin ? 'Администратор обновлён' : 'Администратор создан');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowModal(false);
        resetForm();
        loadAdmins();
      } else {
        setError(data.message || 'Ошибка сохранения');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const handleDelete = async (adminId) => {
    try {
      const response = await fetch(`${API_URL}/admins/${adminId}/delete/`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Администратор удалён');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDeleteConfirm(null);
        loadAdmins();
      } else {
        setError(data.message || 'Ошибка удаления');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      full_name: admin.full_name,
      phone: admin.phone || '',
      is_active: admin.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      phone: '',
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
        <h1 style={styles.title}>Администраторы</h1>
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
          Добавить администратора
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
          {filteredAdmins.length} {filteredAdmins.length === 1 ? 'администратор' : 'администраторов'}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredAdmins.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#c9cccf">
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>
            </svg>
            <h3 style={styles.emptyTitle}>Администраторы не найдены</h3>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Администратор</th>
                <th style={styles.th}>Телефон</th>
                <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
                <th style={styles.th}>Дата создания</th>
                <th style={{...styles.th, textAlign: 'center'}}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === admin.id ? '#f6f6f7' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(admin.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <div style={styles.adminCell}>
                      <div style={styles.avatar}>
                        {getInitials(admin.full_name)}
                      </div>
                      <div style={styles.adminInfo}>
                        <span style={styles.adminName}>{admin.full_name || '—'}</span>
                        <span style={styles.username}>@{admin.username}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {admin.phone ? (
                      <div style={styles.phoneCell}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                        <span>{admin.phone}</span>
                      </div>
                    ) : (
                      <span style={styles.noData}>—</span>
                    )}
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: admin.is_active ? '#e3f4e8' : '#fef2f2',
                      color: admin.is_active ? '#1a7f37' : '#d72c0d',
                    }}>
                      <span style={{
                        ...styles.statusDot,
                        backgroundColor: admin.is_active ? '#1a7f37' : '#d72c0d',
                      }}/>
                      {admin.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>{formatDate(admin.created_at)}</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <div style={styles.actionButtons}>
                      <button
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: hoveredBtn === `edit-${admin.id}` ? '#e8e8e8' : '#f6f6f7',
                        }}
                        onClick={() => openEditModal(admin)}
                        onMouseEnter={() => setHoveredBtn(`edit-${admin.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        title="Редактировать"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </button>
                      <button
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: hoveredBtn === `delete-${admin.id}` ? '#fee2e2' : '#f6f6f7',
                        }}
                        onClick={() => setShowDeleteConfirm(admin.id)}
                        onMouseEnter={() => setHoveredBtn(`delete-${admin.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        title="Удалить"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="#d72c0d">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Admin Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingAdmin ? 'Редактировать администратора' : 'Новый администратор'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Логин *</label>
                <input
                  style={{...styles.input, backgroundColor: editingAdmin ? '#f6f6f7' : '#fff'}}
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Логин для входа"
                  disabled={!!editingAdmin}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Пароль {editingAdmin ? '(оставьте пустым, чтобы не менять)' : '*'}
                </label>
                <input
                  style={styles.input}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingAdmin ? 'Новый пароль' : 'Пароль для входа'}
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
                  {editingAdmin ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIcon}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="#d72c0d">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 style={styles.deleteTitle}>Удалить администратора?</h3>
            <p style={styles.deleteText}>Это действие нельзя отменить</p>
            <div style={styles.deleteActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(null)}
              >
                Отмена
              </button>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(showDeleteConfirm)}
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
    transition: 'background-color 0.1s',
    borderBottom: '1px solid #f1f1f1',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#303030',
    verticalAlign: 'middle',
  },

  // Admin Cell
  adminCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#303030',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    flexShrink: 0,
  },
  adminInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  adminName: {
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

  // Action buttons
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
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

  // Delete Modal
  deleteModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '360px',
    margin: '20px',
    textAlign: 'center',
  },
  deleteIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  deleteTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1E293B',
    margin: '0 0 8px 0',
  },
  deleteText: {
    fontSize: '14px',
    color: '#6d7175',
    margin: '0 0 20px 0',
  },
  deleteActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  deleteButton: {
    padding: '12px 24px',
    backgroundColor: '#d72c0d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Admins;
