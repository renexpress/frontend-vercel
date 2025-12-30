import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
  </svg>
);

const PackageIcon = ({ color = '#6B7280', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const TruckIcon = ({ color = '#6B7280', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ClockIcon = ({ color = '#6B7280', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const CheckCircleIcon = ({ color = '#10B981', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const DollarIcon = ({ color = '#6B7280', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CancelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// Status configurations - new flow after payment confirmation
const ORDER_STATUS_CONFIG = {
  awaiting_payment: { label: 'Ожидает оплаты', color: '#F59E0B', bg: '#FEF3C7' },
  accepted: { label: 'Принято', color: '#10B981', bg: '#D1FAE5' },
  warehouse: { label: 'На складе', color: '#3B82F6', bg: '#DBEAFE' },
  in_transit: { label: 'В дороге', color: '#8B5CF6', bg: '#EDE9FE' },
  moscow: { label: 'Москва', color: '#06B6D4', bg: '#CFFAFE' },
  istanbul: { label: 'Стамбул', color: '#FF6B35', bg: '#FFF4F0' },
  delivered: { label: 'Доставлен', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Отменён', color: '#EF4444', bg: '#FEE2E2' },
};

const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Ожидает', color: '#F59E0B', bg: '#FEF3C7' },
  paid: { label: 'Оплачен', color: '#10B981', bg: '#D1FAE5' },
  failed: { label: 'Ошибка', color: '#EF4444', bg: '#FEE2E2' },
  refunded: { label: 'Возврат', color: '#6B7280', bg: '#F3F4F6' },
};

const DELIVERY_TYPE_CONFIG = {
  pickup: { label: 'Самовывоз', color: '#6B7280' },
  courier: { label: 'Курьер', color: '#3B82F6' },
  postal: { label: 'Почта', color: '#8B5CF6' },
};

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const actionsMenuRef = useRef(null);

  // Filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/`);
      const data = await response.json();
      setOrders(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(o => o.status === 'awaiting_payment' || o.status === 'new').length;
    const completed = data.filter(o => o.status === 'delivered').length;
    const cancelled = data.filter(o => o.status === 'cancelled').length;
    const inProgress = data.filter(o =>
      ['processing', 'istanbul_warehouse', 'to_moscow', 'moscow_warehouse', 'packed', 'shipped', 'to_address'].includes(o.status)
    ).length;
    const revenue = data.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    setStats({ total: data.length, pending, completed, inProgress, cancelled, revenue });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  const getOrderStatusInfo = (status) => {
    return ORDER_STATUS_CONFIG[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
  };

  const getPaymentStatusInfo = (isPaid) => {
    return isPaid ? PAYMENT_STATUS_CONFIG.paid : PAYMENT_STATUS_CONFIG.pending;
  };

  // Smart search - detects if input is numeric (Order ID or phone) or text (name/email)
  const smartSearch = (order, query) => {
    if (!query) return true;
    const q = query.toLowerCase().trim();

    // Check order number
    if (order.order_number?.toLowerCase().includes(q)) return true;

    // Check client name
    if (order.client_name?.toLowerCase().includes(q)) return true;

    // Check client username (RE123 format)
    if (order.client_username?.toLowerCase().includes(q)) return true;

    // Check phone (if numeric input)
    if (/^\d+$/.test(q)) {
      if (order.client_phone?.includes(q)) return true;
      // Also check order_number for numeric search
      if (order.order_number?.includes(q)) return true;
    }

    // Check email
    if (order.client_email?.toLowerCase().includes(q)) return true;

    // Check product name
    if (order.product_name?.toLowerCase().includes(q)) return true;

    return false;
  };

  // Date range filter logic
  const isInDateRange = (dateStr) => {
    if (dateRangeFilter === 'all') return true;

    const orderDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRangeFilter === 'today') {
      const orderDay = new Date(orderDate);
      orderDay.setHours(0, 0, 0, 0);
      return orderDay.getTime() === today.getTime();
    }

    if (dateRangeFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= weekAgo;
    }

    if (dateRangeFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return orderDate >= monthAgo;
    }

    if (dateRangeFilter === 'custom') {
      const from = customDateFrom ? new Date(customDateFrom) : null;
      const to = customDateTo ? new Date(customDateTo) : null;
      if (from && orderDate < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (orderDate > toEnd) return false;
      }
      return true;
    }

    return true;
  };

  const filteredOrders = orders.filter(order => {
    // Smart search
    if (!smartSearch(order, searchQuery)) return false;

    // Order status filter
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'paid' && !order.is_paid) return false;
      if (paymentStatusFilter === 'pending' && order.is_paid) return false;
    }

    // Customer type filter
    if (customerTypeFilter !== 'all') {
      if (customerTypeFilter === 'retail' && order.order_type !== 'roznica') return false;
      if (customerTypeFilter === 'wholesale' && order.order_type !== 'optom') return false;
    }

    // Date range filter
    if (!isInDateRange(order.created_at)) return false;

    // Amount filters
    const amount = parseFloat(order.total_amount) || 0;
    if (minAmount && amount < parseFloat(minAmount)) return false;
    if (maxAmount && amount > parseFloat(maxAmount)) return false;

    return true;
  });

  const resetFilters = () => {
    setOrderStatusFilter('all');
    setPaymentStatusFilter('all');
    setCustomerTypeFilter('all');
    setDateRangeFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
  };

  const hasActiveFilters = orderStatusFilter !== 'all' ||
    paymentStatusFilter !== 'all' ||
    customerTypeFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    minAmount || maxAmount;

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const exportToCSV = () => {
    const headers = ['№ Заказа', 'Дата', 'Клиент', 'Тип', 'Товар', 'Сумма', 'Статус оплаты', 'Статус заказа'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      formatDate(o.created_at),
      o.client_name,
      o.order_type === 'roznica' ? 'Розница' : 'Оптом',
      o.product_name,
      o.total_amount,
      o.is_paid ? 'Оплачен' : 'Ожидает',
      getOrderStatusInfo(o.status).label
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Заказы</h1>
          <p style={styles.pageSubtitle}>Управление заказами клиентов</p>
        </div>
        <button style={styles.exportBtn} onClick={exportToCSV}>
          <ExportIcon />
          Экспорт CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, backgroundColor: '#FEF3C7' }}>
              <ClockIcon color="#F59E0B" size={24} />
            </div>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Ожидают обработки</span>
            <span style={styles.statValue}>{stats.pending}</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, backgroundColor: '#FFF4F0' }}>
              <TruckIcon color="#FF6B35" size={24} />
            </div>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>В доставке</span>
            <span style={styles.statValue}>{stats.inProgress}</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, backgroundColor: '#D1FAE5' }}>
              <CheckCircleIcon color="#10B981" size={24} />
            </div>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Выполнено</span>
            <span style={styles.statValue}>{stats.completed}</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, backgroundColor: '#DBEAFE' }}>
              <DollarIcon color="#3B82F6" size={24} />
            </div>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Общая выручка</span>
            <span style={styles.statValue}>{formatMoney(stats.revenue)}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.toolbarCard}>
        <div style={styles.toolbarRow}>
          {/* Search */}
          <div style={styles.searchBox}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Поиск по номеру, клиенту, телефону, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button style={styles.clearSearchBtn} onClick={() => setSearchQuery('')}>
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div style={styles.quickFilters}>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Все статусы</option>
              <option value="new">Новый</option>
              <option value="awaiting_payment">Ожидает оплаты</option>
              <option value="processing">Обрабатывается</option>
              <option value="istanbul_warehouse">Склад Стамбул</option>
              <option value="to_moscow">В пути до Москвы</option>
              <option value="moscow_warehouse">Склад Москва</option>
              <option value="shipped">Отправлен</option>
              <option value="to_address">Доставляется</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменён</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Оплата: все</option>
              <option value="paid">Оплачен</option>
              <option value="pending">Ожидает оплаты</option>
            </select>

            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Все клиенты</option>
              <option value="retail">Розница</option>
              <option value="wholesale">Оптом</option>
            </select>

            <button
              style={{
                ...styles.filterToggleBtn,
                backgroundColor: showFilters ? '#FF6B35' : '#FFFFFF',
                color: showFilters ? '#FFFFFF' : '#6B7280',
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon />
              Фильтры
              {hasActiveFilters && <span style={styles.filterBadge}></span>}
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div style={styles.extendedFilters}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Период</label>
              <div style={styles.dateFilters}>
                <button
                  style={{
                    ...styles.dateBtn,
                    ...(dateRangeFilter === 'today' ? styles.dateBtnActive : {})
                  }}
                  onClick={() => setDateRangeFilter('today')}
                >
                  Сегодня
                </button>
                <button
                  style={{
                    ...styles.dateBtn,
                    ...(dateRangeFilter === 'week' ? styles.dateBtnActive : {})
                  }}
                  onClick={() => setDateRangeFilter('week')}
                >
                  7 дней
                </button>
                <button
                  style={{
                    ...styles.dateBtn,
                    ...(dateRangeFilter === 'month' ? styles.dateBtnActive : {})
                  }}
                  onClick={() => setDateRangeFilter('month')}
                >
                  30 дней
                </button>
                <button
                  style={{
                    ...styles.dateBtn,
                    ...(dateRangeFilter === 'custom' ? styles.dateBtnActive : {})
                  }}
                  onClick={() => setDateRangeFilter('custom')}
                >
                  <CalendarIcon /> Период
                </button>
              </div>
              {dateRangeFilter === 'custom' && (
                <div style={styles.customDateInputs}>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    style={styles.dateInput}
                    placeholder="От"
                  />
                  <span style={styles.dateSeparator}>—</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    style={styles.dateInput}
                    placeholder="До"
                  />
                </div>
              )}
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Сумма заказа</label>
              <div style={styles.amountFilters}>
                <input
                  type="number"
                  placeholder="От"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  style={styles.amountInput}
                />
                <span style={styles.dateSeparator}>—</span>
                <input
                  type="number"
                  placeholder="До"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  style={styles.amountInput}
                />
                <span style={styles.amountCurrency}>₽</span>
              </div>
            </div>

            {hasActiveFilters && (
              <button style={styles.resetFiltersBtn} onClick={resetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Info & Bulk Actions */}
      <div style={styles.resultsBar}>
        <span style={styles.resultsText}>
          Найдено заказов: <strong>{filteredOrders.length}</strong>
          {searchQuery && ` по запросу "${searchQuery}"`}
        </span>

        {selectedOrders.length > 0 && (
          <div style={styles.bulkActions}>
            <span style={styles.selectedCount}>Выбрано: {selectedOrders.length}</span>
            <button style={styles.bulkActionBtn}>Изменить статус</button>
            <button style={{ ...styles.bulkActionBtn, ...styles.bulkActionBtnDanger }}>Отменить</button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div style={styles.tableCard}>
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <PackageIcon color="#9CA3AF" size={48} />
            <p style={styles.emptyTitle}>Заказы не найдены</p>
            <p style={styles.emptyText}>
              {hasActiveFilters || searchQuery
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'Заказы появятся здесь после их создания'
              }
            </p>
            {(hasActiveFilters || searchQuery) && (
              <button style={styles.resetBtn} onClick={resetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.th}>№ Заказа</th>
                  <th style={styles.th}>Дата и время</th>
                  <th style={styles.th}>Клиент</th>
                  <th style={styles.th}>Тип</th>
                  <th style={styles.th}>Товар</th>
                  <th style={styles.th}>Сумма</th>
                  <th style={styles.th}>Оплата</th>
                  <th style={styles.th}>Статус</th>
                  <th style={styles.th}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const orderStatus = getOrderStatusInfo(order.status);
                  const paymentStatus = getPaymentStatusInfo(order.is_paid);
                  const isSelected = selectedOrders.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      style={{
                        ...styles.tr,
                        backgroundColor: isSelected ? '#FFF4F0' : 'transparent',
                      }}
                    >
                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          style={styles.checkbox}
                        />
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={styles.orderId}>#{order.order_number}</span>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={styles.dateText}>{formatDateTime(order.created_at)}</span>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <div style={styles.customerCell}>
                          <div style={styles.customerAvatar}>
                            {(order.client_name || '?')[0].toUpperCase()}
                          </div>
                          <div style={styles.customerInfo}>
                            <span style={styles.customerName}>{order.client_name}</span>
                            <span style={styles.customerUsername}>{order.client_username}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={{
                          ...styles.typeBadge,
                          backgroundColor: order.order_type === 'roznica' ? '#DBEAFE' : '#EDE9FE',
                          color: order.order_type === 'roznica' ? '#1D4ED8' : '#6D28D9',
                        }}>
                          {order.order_type === 'roznica' ? 'Розница' : 'Оптом'}
                        </span>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <div style={styles.productCell}>
                          <span style={styles.productName}>
                            {order.product_name || 'Товар'}
                          </span>
                          <span style={styles.productQty}>x{order.quantity}</span>
                        </div>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={styles.amount}>{formatMoney(order.total_amount)}</span>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: paymentStatus.bg,
                          color: paymentStatus.color,
                        }}>
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td style={styles.td} onClick={() => navigate(`/orders/${order.id}`)}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: orderStatus.bg,
                          color: orderStatus.color,
                        }}>
                          {orderStatus.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell} ref={showActionsMenu === order.id ? actionsMenuRef : null}>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                            title="Просмотр"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActionsMenu(showActionsMenu === order.id ? null : order.id);
                            }}
                            title="Действия"
                          >
                            <ChevronDownIcon />
                          </button>

                          {showActionsMenu === order.id && (
                            <div style={styles.actionsMenu}>
                              <button
                                style={styles.menuItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}`);
                                }}
                              >
                                <EyeIcon /> Подробности
                              </button>
                              <button
                                style={styles.menuItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}?edit=status`);
                                }}
                              >
                                <EditIcon /> Изменить статус
                              </button>
                              {order.status !== 'cancelled' && (
                                <button
                                  style={{ ...styles.menuItem, color: '#EF4444' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Cancel logic would go here
                                  }}
                                >
                                  <CancelIcon /> Отменить заказ
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #F5F5F7',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#6B7280',
    fontSize: '14px',
  },

  // Page Header
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '4px 0 0 0',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  statHeader: {
    marginBottom: '16px',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Toolbar
  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    padding: '10px 16px',
    flex: 1,
    minWidth: '280px',
    maxWidth: '400px',
    border: '1px solid #E5E7EB',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1A1A1A',
  },
  clearSearchBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#6B7280',
  },
  quickFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    minWidth: '140px',
  },
  filterToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '10px',
    height: '10px',
    backgroundColor: '#FF6B35',
    borderRadius: '50%',
    border: '2px solid #FFFFFF',
  },

  // Extended Filters
  extendedFilters: {
    display: 'flex',
    gap: '24px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #E5E7EB',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
  },
  dateFilters: {
    display: 'flex',
    gap: '8px',
  },
  dateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dateBtnActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    color: '#FFFFFF',
  },
  customDateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#374151',
  },
  dateSeparator: {
    color: '#9CA3AF',
  },
  amountFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  amountInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#374151',
    width: '100px',
  },
  amountCurrency: {
    color: '#6B7280',
    fontSize: '14px',
  },
  resetFiltersBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#EF4444',
    cursor: 'pointer',
    marginLeft: 'auto',
  },

  // Results Bar
  resultsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  resultsText: {
    fontSize: '14px',
    color: '#6B7280',
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  selectedCount: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#FF6B35',
  },
  bulkActionBtn: {
    padding: '8px 16px',
    backgroundColor: '#FF6B35',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
    cursor: 'pointer',
  },
  bulkActionBtnDanger: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },

  // Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
    transition: 'background-color 0.15s ease',
    cursor: 'pointer',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#1A1A1A',
    whiteSpace: 'nowrap',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    cursor: 'pointer',
    accentColor: '#FF6B35',
  },
  orderId: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  dateText: {
    color: '#6B7280',
    fontSize: '13px',
  },
  customerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  customerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F65 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerName: {
    fontWeight: '500',
    color: '#1A1A1A',
    fontSize: '14px',
  },
  customerUsername: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  productName: {
    color: '#1A1A1A',
    fontSize: '14px',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productQty: {
    fontSize: '12px',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  amount: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    position: 'relative',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
    border: 'none',
    borderRadius: '6px',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  actionsMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    border: '1px solid #E5E7EB',
    zIndex: 100,
    minWidth: '180px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.1s ease',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: '16px 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    margin: 0,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default Orders;
