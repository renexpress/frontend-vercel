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
  const [showSearch, setShowSearch] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const sortRef = useRef(null);

  const togglePasswordVisibility = (adminId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

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
    position: '',
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
      position: admin.position || '',
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
      position: '',
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
          style={styles.addBtn}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
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

      {/* Card container */}
      <div style={styles.card}>
        {/* Tabs */}
        <div style={styles.tabsRow}>
          <div style={styles.tabsLeft}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? styles.tabActive : styles.tab}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={styles.tabsRight}>
            <button
              style={{
                ...styles.iconBtn,
                backgroundColor: showSearch ? '#e8f7f7' : hoveredBtn === 'search' ? '#f1f1f1' : '#fff',
                borderColor: showSearch ? '#2AABAB' : '#c9cccf',
              }}
              onClick={() => setShowSearch(!showSearch)}
              onMouseEnter={() => setHoveredBtn('search')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M8 12a4 4 0 110-8 4 4 0 010 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0014 8 6 6 0 102 8a6 6 0 006 6 5.968 5.968 0 003.473-1.113l4.82 4.82a1 1 0 001.414-1.414z"/>
              </svg>
            </button>
            <div style={styles.sortWrapper} ref={sortRef}>
              <button
                style={{
                  ...styles.iconBtn,
                  backgroundColor: showSort ? '#e8f7f7' : hoveredBtn === 'sort' ? '#f1f1f1' : '#fff',
                  borderColor: showSort ? '#2AABAB' : '#c9cccf',
                }}
                onClick={() => setShowSort(!showSort)}
                onMouseEnter={() => setHoveredBtn('sort')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                  <path d="M17 8a1 1 0 01-.707-.293L13 4.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4A1 1 0 0117 8zM3 12a1 1 0 01.707.293L7 15.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4A1 1 0 013 12z"/>
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
                      {sortBy === option.id && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#2AABAB" style={{ marginRight: 8 }}>
                          <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/>
                        </svg>
                      )}
                      <span style={{ marginLeft: sortBy === option.id ? 0 : 22 }}>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Panel */}
        {showSearch && (
          <div style={styles.searchPanel}>
            <div style={styles.searchInputWrapper}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196" style={styles.searchIcon}>
                <path d="M8 12a4 4 0 110-8 4 4 0 010 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0014 8 6 6 0 102 8a6 6 0 006 6 5.968 5.968 0 003.473-1.113l4.82 4.82a1 1 0 001.414-1.414z"/>
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по имени, телефону, логину..."
                style={styles.searchInput}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={styles.searchClear}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div style={styles.tableWrapper}>
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
                <th style={styles.th}>Имя</th>
                <th style={styles.th}>Логин</th>
                <th style={styles.th}>Пароль</th>
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
                    backgroundColor: hoveredRow === admin.id ? '#f0fafa' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(admin.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <span style={styles.adminName}>{admin.full_name || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.textBlack}>{admin.username}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.passwordCell}>
                      <span style={styles.textBlack}>
                        {visiblePasswords[admin.id] ? (admin.password || '—') : '••••••'}
                      </span>
                      <button
                        style={styles.eyeBtn}
                        onClick={() => togglePasswordVisibility(admin.id)}
                        title={visiblePasswords[admin.id] ? 'Скрыть' : 'Показать'}
                      >
                        {visiblePasswords[admin.id] ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.textBlack}>{admin.phone || '—'}</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={styles.statusBadge}>
                      {admin.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.textBlack}>{formatDate(admin.created_at)}</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.editBtn}
                        onClick={() => openEditModal(admin)}
                        title="Редактировать"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#fff">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => setShowDeleteConfirm(admin.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
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
                  style={{...styles.input, opacity: editingAdmin ? 0.6 : 1}}
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Логин для входа"
                  disabled={!!editingAdmin}
                  autoComplete="off"
                  name="admin-username-new"
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
                  autoComplete="new-password"
                  name="admin-password-new"
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
                <label style={styles.label}>Должность</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Менеджер, Директор, и т.д."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel} onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                  <div style={{
                    ...styles.customCheckbox,
                    background: formData.is_active ? 'linear-gradient(to right, #2AABAB, #0a2535)' : '#fff',
                    borderColor: formData.is_active ? 'transparent' : '#c9cccf',
                  }}>
                    {formData.is_active && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="#fff">
                        <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/>
                      </svg>
                    )}
                  </div>
                  <span style={styles.checkboxText}>Активен</span>
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
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },

  // Tabs
  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 12px',
    borderBottom: '1px solid #e1e3e5',
    overflowX: 'auto',
    position: 'relative',
    zIndex: 10,
    backgroundColor: '#fff',
  },
  tabsLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  tabsRight: {
    display: 'flex',
    gap: '6px',
  },
  tab: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '13px',
    fontWeight: '500',
    color: '#000',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid',
    borderImage: 'linear-gradient(to right, #2AABAB, #0a2535) 1',
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // Sort
  sortWrapper: {
    position: 'relative',
  },
  sortDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    minWidth: '180px',
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    overflow: 'hidden',
  },
  sortOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#303030',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // Search Panel
  searchPanel: {
    padding: '12px 16px',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '8px 36px 8px 36px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchClear: {
    position: 'absolute',
    right: '10px',
    width: '20px',
    height: '20px',
    border: 'none',
    backgroundColor: '#8c9196',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Table
  tableWrapper: {
    overflowX: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#000',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    transition: 'background-color 0.1s',
    borderBottom: '1px solid #f1f1f1',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#303030',
    verticalAlign: 'middle',
  },

  // Admin Cell
  adminName: {
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  textBlack: {
    fontSize: '13px',
    color: '#303030',
  },
  passwordCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    padding: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
  },

  // Action buttons
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    alignItems: 'center',
  },
  editBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600',
    color: '#d72c0d',
    cursor: 'pointer',
    padding: '4px 8px',
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
    margin: '0 0 20px 0',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '6px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    width: 'fit-content',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #c9cccf',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    background: '#fff',
    color: '#303030',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  customCheckbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid #c9cccf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  checkboxText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '500',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '12px 24px',
    border: '2px solid transparent',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(to right, #2AABAB, #0a2535) border-box',
    color: '#2AABAB',
  },
  submitButton: {
    padding: '12px 24px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
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
