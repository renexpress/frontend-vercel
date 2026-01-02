import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function PoshivOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const sortRef = useRef(null);

  const STATUS_CONFIG = {
    draft: { label: 'Черновик', bg: '#f6f6f7', color: '#6d7175' },
    awaiting_payment: { label: 'Ожидание оплаты', bg: '#fff8e6', color: '#b88c1a' },
    confirmed: { label: 'Подтверждён', bg: '#eef2ff', color: '#5c6ac4' },
    in_production: { label: 'В производстве', bg: '#fce7f3', color: '#9d174d' },
    ready: { label: 'Готов', bg: '#e0f5f5', color: '#00a0ac' },
    shipped: { label: 'Отправлен', bg: '#dbeafe', color: '#1d4ed8' },
    delivered: { label: 'Доставлен', bg: '#e3f4e8', color: '#1a7f37' },
    cancelled: { label: 'Отменён', bg: '#fef2f2', color: '#d72c0d' },
  };

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'awaiting_payment', label: 'Ожидание' },
    { id: 'confirmed', label: 'Подтверждён' },
    { id: 'in_production', label: 'В производстве' },
    { id: 'ready', label: 'Готов' },
    { id: 'shipped', label: 'Отправлен' },
    { id: 'delivered', label: 'Доставлен' },
    { id: 'cancelled', label: 'Отменён' },
  ];

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'price_desc', label: 'По цене (убыв.)' },
    { id: 'price_asc', label: 'По цене (возр.)' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/poshiv-orders/`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching poshiv orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTabCount = (tabId) => {
    if (tabId === 'all') return orders.length;
    return orders.filter(o => o.status === tabId).length;
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch =
        (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'all' || order.status === activeTab;

      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'created_desc':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'price_asc':
          return (parseFloat(a.final_price || a.estimated_price) || 0) - (parseFloat(b.final_price || b.estimated_price) || 0);
        case 'price_desc':
          return (parseFloat(b.final_price || b.estimated_price) || 0) - (parseFloat(a.final_price || a.estimated_price) || 0);
        default:
          return 0;
      }
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMoney = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
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
        <div style={styles.titleRow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <h1 style={styles.title}>Заказы пошива</h1>
          <span style={styles.count}>{orders.length}</span>
        </div>
        <button
          style={{
            ...styles.refreshBtn,
            backgroundColor: hoveredBtn === 'refresh' ? '#f6f6f7' : '#fff',
          }}
          onClick={fetchOrders}
          onMouseEnter={() => setHoveredBtn('refresh')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          Обновить
        </button>
      </div>

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

      {/* Search & Sort */}
      <div style={styles.filtersPanel}>
        <div style={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Поиск по номеру, клиенту, описанию..."
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

      {/* Results count */}
      <div style={styles.resultsRow}>
        <span style={styles.resultsText}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'заказ' : 'заказов'}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9cccf" strokeWidth="1.5">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            <h3 style={styles.emptyTitle}>Заказы не найдены</h3>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Изображение</th>
                <th style={styles.th}>Номер</th>
                <th style={styles.th}>Клиент</th>
                <th style={styles.th}>Описание</th>
                <th style={styles.th}>Детали</th>
                <th style={styles.th}>Статус</th>
                <th style={styles.th}>Оплата</th>
                <th style={styles.th}>Цена</th>
                <th style={styles.th}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
                return (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/poshiv-orders/${order.id}`)}
                    style={{
                      ...styles.tr,
                      backgroundColor: hoveredRow === order.id ? '#f6f6f7' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRow(order.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>
                      {order.image_url ? (
                        <img src={order.image_url} alt="" style={styles.orderImage} />
                      ) : (
                        <div style={styles.noImage}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="#8c9196">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.orderNumber}>{order.order_number}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clientCell}>
                        <div style={styles.clientAvatar}>
                          {(order.client_name || '?')[0].toUpperCase()}
                        </div>
                        <div style={styles.clientInfo}>
                          <span style={styles.clientName}>{order.client_name || '—'}</span>
                          <span style={styles.clientUsername}>{order.client_username}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.description}>
                        {order.description?.length > 50
                          ? order.description.substring(0, 50) + '...'
                          : order.description || '—'}
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
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.paymentBadge,
                        backgroundColor: order.is_paid ? '#e3f4e8' : '#fff8e6',
                        color: order.is_paid ? '#1a7f37' : '#b88c1a',
                      }}>
                        {order.is_paid ? 'Оплачен' : 'Ожидает'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.price}>
                        {formatMoney(order.final_price || order.estimated_price)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formatDate(order.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  count: {
    padding: '2px 10px',
    backgroundColor: '#f6f6f7',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6d7175',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#303030',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
    transition: 'background-color 0.15s',
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
    gap: '6px',
    padding: '12px 14px',
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
    padding: '2px 6px',
    borderRadius: '8px',
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
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    borderBottom: '1px solid #f1f1f1',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#303030',
    verticalAlign: 'middle',
  },

  // Order Image
  orderImage: {
    width: '48px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e1e3e5',
  },
  noImage: {
    width: '48px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f7',
    borderRadius: '8px',
    border: '1px solid #e1e3e5',
  },

  // Order Number
  orderNumber: {
    fontWeight: '600',
    color: '#2c6ecb',
    fontSize: '13px',
  },

  // Client Cell
  clientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clientAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    flexShrink: 0,
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  clientName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
  },
  clientUsername: {
    fontSize: '11px',
    color: '#8c9196',
  },

  // Description
  description: {
    fontSize: '12px',
    color: '#6d7175',
    lineHeight: '1.4',
  },

  // Details
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  detailTag: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#f6f6f7',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#6d7175',
  },

  // Badges
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  paymentBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },

  // Price & Date
  price: {
    fontWeight: '600',
    color: '#303030',
  },
  dateText: {
    fontSize: '12px',
    color: '#6d7175',
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
};

export default PoshivOrders;
