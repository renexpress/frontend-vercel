import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

// Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ScissorsIcon = ({ size = 24, color = '#6b7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
  </svg>
);

const ImageIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
);

const STATUS_CONFIG = {
  draft: { label: 'Черновик', color: '#6b7280', bg: '#f3f4f6' },
  awaiting_payment: { label: 'Ожидание оплаты', color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: 'Подтверждён', color: '#3b82f6', bg: '#dbeafe' },
  in_production: { label: 'В производстве', color: '#8b5cf6', bg: '#ede9fe' },
  ready: { label: 'Готов', color: '#10b981', bg: '#d1fae5' },
  shipped: { label: 'Отправлен', color: '#06b6d4', bg: '#cffafe' },
  delivered: { label: 'Доставлен', color: '#22c55e', bg: '#dcfce7' },
  cancelled: { label: 'Отменён', color: '#ef4444', bg: '#fee2e2' },
};

function PoshivOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/poshiv-orders/`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching poshiv orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleIcon}>
            <ScissorsIcon size={24} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.title}>Заказы пошива</h1>
            <p style={styles.subtitle}>{orders.length} заказов</p>
          </div>
        </div>
        <button style={styles.refreshButton} onClick={fetchOrders}>
          <RefreshIcon /> Обновить
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <div style={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Поиск по номеру, клиенту или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.statusSelect}
        >
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Изображение</th>
              <th style={styles.th}>Номер заказа</th>
              <th style={styles.th}>Клиент</th>
              <th style={styles.th}>Описание</th>
              <th style={styles.th}>Детали</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Цена</th>
              <th style={styles.th}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.emptyCell}>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Заказы не найдены'
                    : 'Нет заказов пошива'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
                return (
                  <tr
                    key={order.id}
                    style={styles.tr}
                    onClick={() => navigate(`/poshiv-orders/${order.id}`)}
                  >
                    <td style={styles.td}>
                      {order.image_url ? (
                        <img
                          src={order.image_url}
                          alt="Изделие"
                          style={styles.orderImage}
                        />
                      ) : (
                        <div style={styles.noImage}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.orderNumber}>{order.order_number}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clientInfo}>
                        <span style={styles.clientName}>{order.client_name}</span>
                        <span style={styles.clientUsername}>{order.client_username}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.description}>
                        {order.description?.length > 60
                          ? order.description.substring(0, 60) + '...'
                          : order.description}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.details}>
                        {order.item_type && <span style={styles.detailTag}>{order.item_type}</span>}
                        {order.material && <span style={styles.detailTag}>{order.material}</span>}
                        {order.size && <span style={styles.detailTag}>{order.size}</span>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        color: statusConfig.color,
                        backgroundColor: statusConfig.bg,
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.price}>
                        {formatMoney(order.final_price || order.estimated_price)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>{formatDate(order.created_at)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  titleIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '2px',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  filtersRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '0 14px',
  },
  searchInput: {
    flex: 1,
    height: '44px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  statusSelect: {
    padding: '0 14px',
    height: '44px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    minWidth: '180px',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '60px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '15px',
  },
  orderImage: {
    width: '50px',
    height: '65px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  noImage: {
    width: '50px',
    height: '65px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    color: '#9ca3af',
  },
  orderNumber: {
    fontWeight: '600',
    color: '#6366f1',
    fontSize: '13px',
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  clientName: {
    fontWeight: '500',
    color: '#111827',
  },
  clientUsername: {
    fontSize: '12px',
    color: '#6b7280',
  },
  description: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  detailTag: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#4b5563',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  price: {
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: '13px',
    color: '#6b7280',
  },
};

export default PoshivOrders;
