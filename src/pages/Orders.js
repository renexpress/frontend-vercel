import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const navigate = useNavigate();

  // Search & Filter state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    order_number: true,
    client_name: true,
    phone: false,
    product: false,
  });

  // Sort state
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredSort, setHoveredSort] = useState(null);

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'amount_desc', label: 'По сумме (убыв.)' },
    { id: 'amount_asc', label: 'По сумме (возр.)' },
  ];

  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSort(false);
      }
    };
    if (showSort) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSort]);

  const filterOptions = [
    { id: 'order_number', label: '№ Заказа' },
    { id: 'client_name', label: 'Клиент' },
    { id: 'phone', label: 'Телефон' },
    { id: 'product', label: 'Товар' },
  ];

  const toggleFilter = (filterId) => {
    setSearchFilters(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data.results && Array.isArray(data.results)) {
        setOrders(data.results);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'awaiting_payment', label: 'Ожидает оплаты' },
    { id: 'istanbul_warehouse', label: 'На складе в Стамбуле' },
    { id: 'to_moscow', label: 'В дороге до Москвы' },
    { id: 'moscow_warehouse', label: 'На складе в Москве' },
    { id: 'to_address', label: 'В дороге до адреса' },
    { id: 'delivered', label: 'Доставлен' },
  ];

  const statusConfig = {
    awaiting_payment: { label: 'Ожидает оплаты', bg: '#fef3c7', color: '#92400e' },
    istanbul_warehouse: { label: 'На складе в Стамбуле', bg: '#fce7f3', color: '#9d174d' },
    to_moscow: { label: 'В дороге до Москвы', bg: '#dbeafe', color: '#1d4ed8' },
    moscow_warehouse: { label: 'На складе в Москве', bg: '#cffafe', color: '#0e7490' },
    to_address: { label: 'В дороге до вашего адреса', bg: '#e0e7ff', color: '#3730a3' },
    delivered: { label: 'Доставлен', bg: '#d1fae5', color: '#065f46' },
    cancelled: { label: 'Отменён', bg: '#fee2e2', color: '#991b1b' },
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  };

  const filteredOrders = orders.filter(order => {
    // Tab filter
    if (activeTab !== 'all') {
      if (order.status !== activeTab) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      let matches = false;

      if (searchFilters.order_number && order.order_number?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.client_name && order.client_name?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.phone && order.client_phone?.includes(query)) {
        matches = true;
      }
      if (searchFilters.product && order.product_name?.toLowerCase().includes(query)) {
        matches = true;
      }

      if (!matches) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case 'created_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'amount_asc':
        return (parseFloat(a.total_amount) || 0) - (parseFloat(b.total_amount) || 0);
      case 'amount_desc':
        return (parseFloat(b.total_amount) || 0) - (parseFloat(a.total_amount) || 0);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount) => {
    if (!amount) return '—';
    return Number(amount).toLocaleString('ru-RU') + ' ₽';
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#303030">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 9l-9 8z"/>
          </svg>
          <h1 style={styles.title}>Заказы</h1>
        </div>
      </div>

      {/* Card container */}
      <div style={styles.card}>
        {/* Tabs */}
        <div style={styles.tabsRow}>
          <div style={styles.tabsLeft}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={styles.tabsRight}>
            <button
              style={{
                ...styles.iconBtn,
                backgroundColor: showSearch ? '#e4e5e7' : hoveredBtn === 'search' ? '#f1f1f1' : '#fff',
                borderColor: showSearch ? '#8c9196' : '#c9cccf',
              }}
              onClick={() => setShowSearch(!showSearch)}
              onMouseEnter={() => setHoveredBtn('search')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M8 12a4 4 0 110-8 4 4 0 010 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0014 8 6 6 0 102 8a6 6 0 006 6 5.968 5.968 0 003.473-1.113l4.82 4.82a1 1 0 001.414-1.414z"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
              </svg>
            </button>
            <div ref={sortRef} style={styles.sortWrapper}>
              <button
                style={{
                  ...styles.iconBtn,
                  backgroundColor: showSort ? '#e4e5e7' : hoveredBtn === 'sort' ? '#f1f1f1' : '#fff',
                  borderColor: showSort ? '#8c9196' : '#c9cccf',
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
                  {sortOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                      onMouseEnter={() => setHoveredSort(opt.id)}
                      onMouseLeave={() => setHoveredSort(null)}
                      style={{
                        ...styles.sortOption,
                        backgroundColor: sortBy === opt.id ? '#f1f1f1' : hoveredSort === opt.id ? '#f6f6f7' : 'transparent',
                        fontWeight: sortBy === opt.id ? '600' : '400',
                      }}
                    >
                      {sortBy === opt.id && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#303030" style={{ marginRight: 8 }}>
                          <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/>
                        </svg>
                      )}
                      <span style={{ marginLeft: sortBy === opt.id ? 0 : 22 }}>{opt.label}</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск заказов..."
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={styles.searchClear}
                >
                  ×
                </button>
              )}
            </div>
            <div style={styles.filterSection}>
              <span style={styles.filterLabel}>Искать по:</span>
              <div style={styles.filterOptions}>
                {filterOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleFilter(opt.id)}
                    style={{
                      ...styles.filterChip,
                      backgroundColor: searchFilters[opt.id] ? '#303030' : '#fff',
                      color: searchFilters[opt.id] ? '#fff' : '#303030',
                      borderColor: searchFilters[opt.id] ? '#303030' : '#c9cccf',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {searchQuery && (
              <div style={styles.searchResults}>
                Найдено: {filteredOrders.length} заказов
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thCheck}>
                <input type="checkbox" style={styles.checkbox} />
              </th>
              <th style={styles.th}>№ Заказа</th>
              <th style={styles.th}>Дата</th>
              <th style={styles.th}>Клиент</th>
              <th style={styles.th}>Тип</th>
              <th style={styles.th}>Товар</th>
              <th style={styles.th}>Сумма</th>
              <th style={styles.th}>Оплата</th>
              <th style={styles.th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <tr
                  key={order.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === idx ? '#f6f6f7' : '#fff',
                  }}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td style={styles.tdCheck} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={styles.checkbox} />
                  </td>
                  <td style={styles.td}>
                    <span style={styles.orderNumber}>#{order.order_number}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>{formatDate(order.created_at)}</span>
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
                    <span style={{
                      ...styles.typeBadge,
                      backgroundColor: order.order_type === 'roznica' ? '#dbeafe' : '#fef3c7',
                      color: order.order_type === 'roznica' ? '#1d4ed8' : '#92400e',
                    }}>
                      {order.order_type === 'roznica' ? 'Розница' : 'Оптом'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.productCell}>
                      <span style={styles.productName}>{order.product_name || 'Товар'}</span>
                      <span style={styles.productQty}>×{order.quantity || 1}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.amount}>{formatMoney(order.total_amount)}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.paymentBadge,
                      backgroundColor: order.is_paid ? '#d1fae5' : '#fef3c7',
                      color: order.is_paid ? '#065f46' : '#92400e',
                    }}>
                      {order.is_paid ? 'Оплачен' : 'Ожидает'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#8c9196" style={{ marginBottom: 12 }}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 9l-9 8z"/>
            </svg>
            <p style={styles.emptyTitle}>Заказы не найдены</p>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '16px 20px',
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
    borderTopColor: '#333',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },

  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 12px',
    borderBottom: '1px solid #e1e3e5',
    overflowX: 'auto',
  },
  tabsLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  tab: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6d7175',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #303030',
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabsRight: {
    display: 'flex',
    gap: '6px',
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
    boxShadow: '0 1px 0 rgba(0,0,0,0.04), inset 0 -1px 0 rgba(0,0,0,0.1)',
    transition: 'background-color 0.15s',
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
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
    whiteSpace: 'nowrap',
  },
  thCheck: {
    padding: '8px 12px',
    width: '36px',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #e1e3e5',
  },
  tdCheck: {
    padding: '10px 12px',
    width: '36px',
    borderBottom: '1px solid #e1e3e5',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },

  orderNumber: {
    fontWeight: '600',
    color: '#2c6ecb',
  },
  dateText: {
    color: '#6d7175',
    fontSize: '12px',
  },
  clientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
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
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  productName: {
    fontSize: '13px',
    color: '#303030',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productQty: {
    fontSize: '11px',
    color: '#8c9196',
    backgroundColor: '#f6f6f7',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  amount: {
    fontWeight: '600',
    color: '#303030',
  },
  paymentBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
  },

  empty: {
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 4px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6d7175',
    margin: 0,
  },

  // Search Panel styles
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
    lineHeight: 1,
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '12px',
    color: '#6d7175',
    fontWeight: '500',
  },
  filterOptions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterChip: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #c9cccf',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  searchResults: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#6d7175',
  },

  // Sort dropdown styles
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
};

export default Orders;
