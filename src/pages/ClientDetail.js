import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Tab states
  const [orderTab, setOrderTab] = useState('all');
  const [productTab, setProductTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${id}/`),
        axios.get(`${API_URL}/orders/?client_id=${id}`),
        axios.get(`${API_URL}/products/?owner=${id}&show_all=true`)  // Products ADDED by this client (all statuses)
      ]);
      setClient(clientRes.data);
      setFormData(clientRes.data);
      setOrders(ordersRes.data);

      // Handle different response formats for products
      const productsData = productsRes.data;
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else if (productsData.products) {
        setProducts(productsData.products);
      } else if (productsData.results) {
        setProducts(productsData.results);
      } else {
        setProducts([]);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount || 0);
  };

  // Order statistics
  const orderStats = {
    total: orders.length,
    active: orders.filter(o => !['delivered', 'cancelled', 'awaiting_payment'].includes(o.status)).length,
    awaiting: orders.filter(o => o.status === 'awaiting_payment').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalSpent: orders.filter(o => o.is_paid).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
    unpaid: orders.filter(o => !o.is_paid && o.status !== 'cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
  };

  // Products added by this client (from products state)
  const clientProducts = products;

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    if (orderTab === 'all') return true;
    if (orderTab === 'active') return !['delivered', 'cancelled', 'awaiting_payment'].includes(order.status);
    if (orderTab === 'awaiting') return order.status === 'awaiting_payment';
    if (orderTab === 'delivered') return order.status === 'delivered';
    if (orderTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  // Filter products by tab (products added by client)
  const filteredProducts = clientProducts.filter(product => {
    const productStatus = product.product_status || 'active';
    const stock = product.stock_quantity || 0;

    if (productTab === 'all') return true;
    if (productTab === 'pending') return productStatus === 'pending_approval';
    if (productTab === 'active') return productStatus === 'active' && stock > 0;
    if (productTab === 'soldout') return stock === 0 && productStatus !== 'rejected';
    if (productTab === 'rejected') return productStatus === 'rejected';
    return true;
  });

  const getStatusLabel = (status) => {
    const labels = {
      'awaiting_payment': 'Ожидание оплаты',
      'accepted': 'Принято',
      'istanbul_warehouse': 'Склад Стамбул',
      'warehouse': 'На складе',
      'to_moscow': 'В Москву',
      'in_transit': 'В пути',
      'moscow_warehouse': 'Склад Москва',
      'moscow': 'Москва',
      'istanbul': 'Стамбул',
      'to_address': 'Доставка',
      'delivered': 'Доставлен',
      'cancelled': 'Отменён',
    };
    return labels[status] || status;
  };

  const getStatusStyle = (status) => {
    if (status === 'delivered') return { bg: '#e3f4e8', color: '#1a7f37' };
    if (status === 'cancelled') return { bg: '#fef2f2', color: '#d72c0d' };
    if (status === 'awaiting_payment') return { bg: '#fff8e6', color: '#b88c1a' };
    return { bg: '#eef2ff', color: '#5c6ac4' };
  };

  const getProductStatusStyle = (productStatus, stock) => {
    if (productStatus === 'rejected') {
      return { bg: '#fef2f2', color: '#d72c0d', label: 'Отменён' };
    }
    if (productStatus === 'pending_approval') {
      return { bg: '#fff8e6', color: '#b88c1a', label: 'Ждёт подтверждения' };
    }
    if (stock === 0) {
      return { bg: '#f6f6f7', color: '#6d7175', label: 'Распродан' };
    }
    if (productStatus === 'active') {
      return { bg: '#e3f4e8', color: '#1a7f37', label: 'Активный' };
    }
    if (productStatus === 'approved') {
      return { bg: '#eef2ff', color: '#5c6ac4', label: 'Одобрен' };
    }
    return { bg: '#f6f6f7', color: '#6d7175', label: productStatus };
  };

  const orderTabs = [
    { id: 'all', label: 'Все', count: orderStats.total },
    { id: 'active', label: 'Активные', count: orderStats.active },
    { id: 'awaiting', label: 'Ожидание', count: orderStats.awaiting },
    { id: 'delivered', label: 'Доставлены', count: orderStats.delivered },
    { id: 'cancelled', label: 'Отменены', count: orderStats.cancelled },
  ];

  const productTabs = [
    { id: 'all', label: 'Все', count: clientProducts.length },
    { id: 'pending', label: 'Ждёт подтверждения', count: clientProducts.filter(p => p.product_status === 'pending_approval').length },
    { id: 'active', label: 'Активный', count: clientProducts.filter(p => p.product_status === 'active' && (p.stock_quantity || 0) > 0).length },
    { id: 'soldout', label: 'Распродан', count: clientProducts.filter(p => (p.stock_quantity || 0) === 0 && p.product_status !== 'rejected').length },
    { id: 'rejected', label: 'Отменён', count: clientProducts.filter(p => p.product_status === 'rejected').length },
  ];

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
        <h1 style={styles.title}>{client.full_name}</h1>
        <div style={styles.headerActions}>
          {!isEditing ? (
            <>
              <button
                style={{
                  ...styles.editBtn,
                  backgroundColor: hoveredBtn === 'edit' ? '#1a1a1a' : '#303030',
                  transform: hoveredBtn === 'edit' ? 'translateY(-1px)' : 'none',
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

      <div style={styles.mainGrid}>
        {/* Left Column - Client Info */}
        <div style={styles.leftColumn}>
          {/* Profile Card */}
          <div style={styles.card}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {getInitials(client.full_name)}
              </div>
              <div style={styles.profileInfo}>
                <div style={styles.profileName}>{client.full_name}</div>
                <div style={styles.profileMeta}>
                  <span style={styles.username}>{client.username}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: client.is_active ? '#e3f4e8' : '#fef2f2',
                    color: client.is_active ? '#1a7f37' : '#d72c0d',
                  }}>
                    <span style={{
                      ...styles.statusDot,
                      backgroundColor: client.is_active ? '#1a7f37' : '#d72c0d',
                    }}/>
                    {client.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Контакты</div>

              <div style={styles.field}>
                <label style={styles.label}>ФИО</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      borderColor: errors.full_name ? '#d72c0d' : '#c9cccf',
                    }}
                  />
                ) : (
                  <div style={styles.value}>{client.full_name}</div>
                )}
                {errors.full_name && <div style={styles.error}>{errors.full_name}</div>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Телефон</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      borderColor: errors.phone ? '#d72c0d' : '#c9cccf',
                    }}
                  />
                ) : (
                  <div style={styles.value}>{client.phone}</div>
                )}
                {errors.phone && <div style={styles.error}>{errors.phone}</div>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      borderColor: errors.email ? '#d72c0d' : '#c9cccf',
                    }}
                  />
                ) : (
                  <div style={styles.value}>{client.email || '—'}</div>
                )}
                {errors.email && <div style={styles.error}>{errors.email}</div>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Компания</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name || ''}
                    onChange={handleChange}
                    style={styles.input}
                  />
                ) : (
                  <div style={styles.value}>{client.company_name || '—'}</div>
                )}
              </div>
            </div>

            {/* Address */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Адрес доставки</div>

              <div style={styles.field}>
                <label style={styles.label}>Адрес</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    style={styles.input}
                  />
                ) : (
                  <div style={styles.value}>{client.address || '—'}</div>
                )}
              </div>

              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Город</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  ) : (
                    <div style={styles.value}>{client.city || '—'}</div>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Индекс</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code || ''}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  ) : (
                    <div style={styles.value}>{client.postal_code || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Заметки</div>
              <div style={styles.field}>
                {isEditing ? (
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
                  />
                ) : (
                  <div style={styles.value}>{client.notes || '—'}</div>
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
                  <span>Активный клиент</span>
                </label>
              </div>
            )}

            {/* Meta */}
            <div style={styles.metaSection}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Создан</span>
                <span style={styles.metaValue}>{formatDate(client.created_at)}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Обновлен</span>
                <span style={styles.metaValue}>{formatDate(client.updated_at)}</span>
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
              <div style={styles.loginTitle}>Данные для входа</div>
              <div style={styles.loginDetails}>
                <span>Логин: <strong>{client.username}</strong></span>
                <span>Пароль: <strong>{client.phone}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats, Orders, Products */}
        <div style={styles.rightColumn}>
          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#5c6ac4">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{orderStats.total}</div>
                <div style={styles.statLabel}>Всего заказов</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: '#e3f4e8'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#1a7f37">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{orderStats.delivered}</div>
                <div style={styles.statLabel}>Доставлено</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: '#fff8e6'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#b88c1a">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{orderStats.active}</div>
                <div style={styles.statLabel}>В работе</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: '#e0f5f5'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#00a0ac">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z"/>
                  <path fillRule="evenodd" d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm4 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{formatMoney(orderStats.totalSpent)} ₽</div>
                <div style={styles.statLabel}>Оплачено</div>
              </div>
            </div>
          </div>

          {/* Unpaid Alert */}
          {orderStats.unpaid > 0 && (
            <div style={styles.alertCard}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#b88c1a">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>Неоплаченных заказов на сумму: <strong>{formatMoney(orderStats.unpaid)} ₽</strong></span>
            </div>
          )}

          {/* Orders Section */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>История заказов</h2>
              <button
                style={{
                  ...styles.viewAllBtn,
                  backgroundColor: hoveredBtn === 'viewOrders' ? '#f6f6f7' : 'transparent',
                }}
                onClick={() => navigate(`/orders?client_id=${id}`)}
                onMouseEnter={() => setHoveredBtn('viewOrders')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Смотреть все
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            {/* Order Tabs */}
            <div style={styles.tabsRow}>
              {orderTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setOrderTab(tab.id)}
                  style={{
                    ...styles.tab,
                    borderBottomColor: orderTab === tab.id ? '#303030' : 'transparent',
                    color: orderTab === tab.id ? '#303030' : '#6d7175',
                    fontWeight: orderTab === tab.id ? '600' : '500',
                  }}
                >
                  {tab.label}
                  <span style={{
                    ...styles.tabCount,
                    backgroundColor: orderTab === tab.id ? '#303030' : '#e4e5e7',
                    color: orderTab === tab.id ? '#fff' : '#6d7175',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div style={styles.listContainer}>
              {filteredOrders.length === 0 ? (
                <div style={styles.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 20 20" fill="#c9cccf">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/>
                  </svg>
                  <p>Нет заказов</p>
                </div>
              ) : (
                filteredOrders.slice(0, 5).map(order => {
                  const snapshot = order.snapshot || order.product_snapshot || {};
                  const statusStyle = getStatusStyle(order.status);
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      style={{
                        ...styles.orderRow,
                        backgroundColor: hoveredRow === `order-${order.id}` ? '#f6f6f7' : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredRow(`order-${order.id}`)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div style={styles.orderImage}>
                        {snapshot.primary_image ? (
                          <img src={snapshot.primary_image} alt="" style={styles.orderImg} />
                        ) : (
                          <div style={styles.noImage}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#8c9196">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div style={styles.orderInfo}>
                        <div style={styles.orderNumber}>{order.order_number}</div>
                        <div style={styles.orderProduct}>{snapshot.product_name || 'Товар'}</div>
                      </div>
                      <div style={styles.orderMeta}>
                        <div style={styles.orderAmount}>{formatMoney(order.total_amount)} ₽</div>
                        <div style={styles.orderDate}>{formatDate(order.created_at)}</div>
                      </div>
                      <div style={{
                        ...styles.orderStatus,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {getStatusLabel(order.status)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Products Section - products added/submitted by this client */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Добавленные товары</h2>
            </div>

            {/* Product Tabs */}
            <div style={styles.tabsRow}>
              {productTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProductTab(tab.id)}
                  style={{
                    ...styles.tab,
                    borderBottomColor: productTab === tab.id ? '#303030' : 'transparent',
                    color: productTab === tab.id ? '#303030' : '#6d7175',
                    fontWeight: productTab === tab.id ? '600' : '500',
                  }}
                >
                  {tab.label}
                  <span style={{
                    ...styles.tabCount,
                    backgroundColor: productTab === tab.id ? '#303030' : '#e4e5e7',
                    color: productTab === tab.id ? '#fff' : '#6d7175',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Products List */}
            <div style={styles.listContainer}>
              {filteredProducts.length === 0 ? (
                <div style={styles.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 20 20" fill="#c9cccf">
                    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
                  </svg>
                  <p>Нет товаров</p>
                </div>
              ) : (
                filteredProducts.map(product => {
                  const productStatus = product.product_status || 'active';
                  const stock = product.stock_quantity || 0;
                  const statusStyle = getProductStatusStyle(productStatus, stock);
                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      style={{
                        ...styles.productRow,
                        backgroundColor: hoveredRow === `product-${product.id}` ? '#f6f6f7' : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredRow(`product-${product.id}`)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div style={styles.productImage}>
                        {product.primary_image ? (
                          <img src={product.primary_image} alt="" style={styles.productImg} />
                        ) : (
                          <div style={styles.noImage}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#8c9196">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div style={styles.productInfo}>
                        <div style={styles.productName}>{product.name}</div>
                        <div style={styles.productMeta}>
                          {product.article || 'Без артикула'} • {formatMoney(product.retail_price || product.price || 0)} ₽
                        </div>
                      </div>
                      <div style={styles.productStock}>
                        <div style={{
                          ...styles.stockBadge,
                          backgroundColor: stock > 0 ? '#e3f4e8' : '#fef2f2',
                          color: stock > 0 ? '#1a7f37' : '#d72c0d',
                        }}>
                          {stock > 0 ? `${stock} шт` : 'Нет в наличии'}
                        </div>
                      </div>
                      <div style={{
                        ...styles.productStatus,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {statusStyle.label}
                      </div>
                    </div>
                  );
                })
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
            <h3 style={styles.modalTitle}>Удалить клиента?</h3>
            <p style={styles.modalText}>
              Вы уверены, что хотите удалить клиента <strong>{client.full_name}</strong>?
              Это действие нельзя отменить.
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
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'all 0.15s',
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
    backgroundColor: '#1a7f37',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
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
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#5c5f62',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
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
    backgroundColor: '#303030',
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
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
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
    transition: 'border-color 0.15s',
  },
  error: {
    fontSize: '12px',
    color: '#d72c0d',
    marginTop: '4px',
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

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#303030',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6d7175',
    marginTop: '2px',
  },

  // Alert Card
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fff8e6',
    borderRadius: '10px',
    border: '1px solid #f0d78c',
    fontSize: '13px',
    color: '#785a00',
  },

  // Tabs
  tabsRow: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #e1e3e5',
    padding: '0 16px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 12px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '-1px',
  },
  tabCount: {
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },

  // List Container
  listContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
  },

  // Order Row
  orderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f1f1',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  orderImage: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
  },
  orderImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
  },
  orderProduct: {
    fontSize: '12px',
    color: '#6d7175',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  orderMeta: {
    textAlign: 'right',
  },
  orderAmount: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
  },
  orderDate: {
    fontSize: '11px',
    color: '#8c9196',
  },
  orderStatus: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },

  // Product Row
  productRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f1f1',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  productImage: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productMeta: {
    fontSize: '12px',
    color: '#6d7175',
  },
  productStock: {
    marginRight: '8px',
  },
  stockBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  productStatus: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },

  // Empty State
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#8c9196',
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
    transition: 'background-color 0.15s',
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
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
  },
};

export default ClientDetail;
