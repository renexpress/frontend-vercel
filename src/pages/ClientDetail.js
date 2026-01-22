import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const PRIMARY_COLOR = '#2AABAB';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const activeTab = searchParams.get('tab') || 'all';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, deliveriesRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${id}/`),
        axios.get(`${API_URL}/deliveries/`)
      ]);
      setClient(clientRes.data);
      setFormData(clientRes.data);

      const deliveriesData = deliveriesRes.data;
      if (Array.isArray(deliveriesData)) {
        setDeliveries(deliveriesData);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'ФИО обязательно';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Телефон обязателен';
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get deliveries for this client
  const clientDeliveriesSent = deliveries.filter(d => d.sender_username === client?.username);
  const clientDeliveriesReceived = deliveries.filter(d => d.receiver_username === client?.username);

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'sent', label: 'Отправил' },
    { id: 'received', label: 'Получил' },
  ];

  const filteredDeliveries = activeTab === 'all'
    ? [...clientDeliveriesSent, ...clientDeliveriesReceived]
    : activeTab === 'sent'
      ? clientDeliveriesSent
      : clientDeliveriesReceived;

  const statusLabels = {
    prinyat: 'Принят',
    v_stambule: 'В Стамбуле',
    otpravlen: 'Отправлен',
    v_puti: 'В пути',
    v_moskve: 'В Москве',
    oplata: 'Оплата',
    dostavka: 'Доставка',
    vidan: 'Выдан',
  };

  const getStatusLabel = (status) => {
    return statusLabels[status] || status;
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

  if (!client) return null;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate('/clients')}
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
          Клиенты
        </button>
        <h1 style={styles.title}>{client.username}</h1>
        <div style={styles.headerActions}>
          {!isEditing ? (
            <>
              <button
                style={{
                  ...styles.editBtn,
                  opacity: hoveredBtn === 'edit' ? 0.9 : 1,
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
                style={{...styles.saveBtn, opacity: saving ? 0.7 : 1}}
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

      <div style={styles.mainGrid}>
        {/* Left Column - Client Info */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.clientCode}>{client.username}</span>
              <span style={{
                ...styles.statusBadgeSmall,
                background: client.is_active ? 'linear-gradient(to right, #2AABAB, #0a2535)' : '#fef2f2',
                color: client.is_active ? '#fff' : '#d72c0d',
              }}>
                {client.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div style={styles.cardBody}>
              {isEditing ? (
                <>
                  <div style={styles.fieldGroup}>
                    <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} placeholder="ФИО" style={{...styles.input, borderColor: errors.full_name ? '#d72c0d' : '#e1e3e5'}} />
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Телефон" style={{...styles.input, borderColor: errors.phone ? '#d72c0d' : '#e1e3e5'}} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} placeholder="Компания" style={styles.input} />
                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="Город" style={styles.input} />
                  </div>
                  <input type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Адрес" style={styles.input} />
                  <label style={styles.checkboxLabel}>
                    <div style={{...styles.checkbox, backgroundColor: formData.is_active ? PRIMARY_COLOR : '#fff', borderColor: formData.is_active ? PRIMARY_COLOR : '#c9cccf'}}>
                      {formData.is_active && <svg width="10" height="10" viewBox="0 0 20 20" fill="#fff"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                    </div>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ display: 'none' }} />
                    <span>Активный клиент</span>
                  </label>
                </>
              ) : (
                <>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>ФИО</span>
                    <span style={styles.infoValue}>{client.full_name || '—'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Телефон</span>
                    <span style={styles.infoValue}>{client.phone}</span>
                  </div>
                  {client.company_name && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Компания</span>
                      <span style={styles.infoValue}>{client.company_name}</span>
                    </div>
                  )}
                  {client.city && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Город</span>
                      <span style={styles.infoValue}>{client.city}</span>
                    </div>
                  )}
                  {client.address && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Адрес</span>
                      <span style={styles.infoValue}>{client.address}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={styles.cardFooter}>
              <span style={styles.footerText}>Логин: <strong style={styles.gradientText}>{client.username}</strong></span>
              <span style={styles.footerText}>Пароль: <strong>{client.phone}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Deliveries */}
        <div style={styles.rightColumn}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{clientDeliveriesSent.length}</div>
              <div style={styles.statLabel}>Отправил</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{clientDeliveriesReceived.length}</div>
              <div style={styles.statLabel}>Получил</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{clientDeliveriesSent.length + clientDeliveriesReceived.length}</div>
              <div style={styles.statLabel}>Всего</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.tabsRow}>
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
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>№ Доставки</th>
                    <th style={styles.th}>Товар</th>
                    <th style={styles.th}>Статус</th>
                    <th style={styles.th}>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={styles.emptyState}>Нет доставок</td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((delivery, idx) => (
                      <tr
                        key={delivery.id}
                        style={{...styles.tr, backgroundColor: hoveredRow === idx ? '#f0fafa' : '#fff'}}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => navigate(`/deliveries/${delivery.id}`)}
                      >
                        <td style={styles.td}>
                          <span style={styles.deliveryNumber}>{delivery.delivery_number}</span>
                        </td>
                        <td style={styles.td}>{delivery.product_description || '—'}</td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge}>{getStatusLabel(delivery.status)}</span>
                        </td>
                        <td style={styles.td}>{formatDate(delivery.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
            <h3 style={styles.modalTitle}>Удалить клиента?</h3>
            <p style={styles.modalText}>
              Вы уверены, что хотите удалить клиента <strong>{client.full_name}</strong>?
            </p>
            <div style={styles.modalActions}>
              <button
                style={{
                  ...styles.modalCancelBtn,
                  backgroundColor: hoveredBtn === 'modalCancel' ? '#f6f6f7' : '#fff',
                }}
                onClick={() => setShowDeleteModal(false)}
                onMouseEnter={() => setHoveredBtn('modalCancel')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Отмена
              </button>
              <button style={styles.modalDeleteBtn} onClick={handleDelete}>
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
    borderTopColor: PRIMARY_COLOR,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

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
  },
  title: {
    flex: 1,
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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
  },
  saveBtn: {
    padding: '8px 14px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
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
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '16px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e1e3e5',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #e1e3e5',
  },
  clientCode: {
    fontSize: '18px',
    fontWeight: '700',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statusBadgeSmall: {
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  cardBody: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6d7175',
  },
  infoValue: {
    fontSize: '13px',
    color: '#303030',
    fontWeight: '500',
  },
  fieldGroup: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid #e1e3e5',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#303030',
    outline: 'none',
    boxSizing: 'border-box',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#303030',
    marginTop: '4px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '2px solid #c9cccf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    display: 'flex',
    gap: '16px',
    padding: '10px 16px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e1e3e5',
    fontSize: '12px',
    color: '#6d7175',
  },
  footerText: {
    fontSize: '12px',
    color: '#6d7175',
  },
  gradientText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statCard: {
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e1e3e5',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statLabel: {
    fontSize: '11px',
    color: '#6d7175',
    marginTop: '2px',
  },

  tabsRow: {
    display: 'flex',
    borderBottom: '1px solid #e1e3e5',
    padding: '0 12px',
  },
  tab: {
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6d7175',
    cursor: 'pointer',
  },
  tabActive: {
    padding: '12px 16px',
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
  },

  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #f1f1f1',
  },
  deliveryNumber: {
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#8c9196',
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
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
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
};

export default ClientDetail;
