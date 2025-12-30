import React, { useState, useEffect, useMemo } from 'react';
import API_URL from '../config/api';

// Status configuration
const STATUS_CONFIG = {
  awaiting_payment: { label: 'Ожидание оплаты', color: '#F59E0B' },
  istanbul_warehouse: { label: 'Склад Стамбул', color: '#3B82F6' },
  to_moscow: { label: 'В пути до Москвы', color: '#8B5CF6' },
  moscow_warehouse: { label: 'Склад Москва', color: '#06B6D4' },
  to_address: { label: 'Доставка', color: '#6366F1' },
  delivered: { label: 'Доставлен', color: '#10B981' },
  cancelled: { label: 'Отменён', color: '#EF4444' },
};

const PAYMENT_STATUS_CONFIG = {
  paid: { label: 'Оплачено', color: '#10B981' },
  pending: { label: 'Ожидает', color: '#F59E0B' },
  failed: { label: 'Ошибка', color: '#EF4444' },
  refunded: { label: 'Возврат', color: '#8B5CF6' },
};

const CHART_COLORS = ['#FF6B35', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

function Statistics() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [timeRange, setTimeRange] = useState('30days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [ordersRes, productsRes, clientsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/orders/`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/products/`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/clients/`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/categories/`).then(r => r.json()).catch(() => []),
      ]);

      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate = now;
    let prevStartDate, prevEndDate;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(prevStartDate);
        prevEndDate.setHours(23, 59, 59, 999);
        break;
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 30);
        prevEndDate = new Date(startDate);
        break;
      case 'custom':
        startDate = customDateFrom ? new Date(customDateFrom) : new Date(now.setMonth(now.getMonth() - 1));
        endDate = customDateTo ? new Date(customDateTo) : new Date();
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
        prevEndDate = new Date(startDate);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 30);
        prevEndDate = new Date(startDate);
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
  };

  // Filter orders based on date range and filters
  const filteredOrders = useMemo(() => {
    const { startDate, endDate } = getDateRange();

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const inDateRange = orderDate >= startDate && orderDate <= endDate;

      const matchesType = orderTypeFilter === 'all' ||
        (orderTypeFilter === 'retail' && order.order_type === 'roznica') ||
        (orderTypeFilter === 'wholesale' && order.order_type === 'optom');

      const matchesCategory = categoryFilter === 'all' || order.category_id === parseInt(categoryFilter);

      return inDateRange && matchesType && matchesCategory;
    });
  }, [orders, timeRange, customDateFrom, customDateTo, orderTypeFilter, categoryFilter]);

  // Previous period orders for comparison
  const previousPeriodOrders = useMemo(() => {
    const { prevStartDate, prevEndDate } = getDateRange();

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= prevStartDate && orderDate <= prevEndDate;
    });
  }, [orders, timeRange, customDateFrom, customDateTo]);

  // Calculate stats
  const stats = useMemo(() => {
    const currentRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const currentOrders = filteredOrders.length;
    const prevOrders = previousPeriodOrders.length;
    const ordersChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const prevAvgOrderValue = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    const avgOrderChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

    const activeCustomers = new Set(filteredOrders.map(o => o.client)).size;
    const prevActiveCustomers = new Set(previousPeriodOrders.map(o => o.client)).size;
    const customersChange = prevActiveCustomers > 0 ? ((activeCustomers - prevActiveCustomers) / prevActiveCustomers) * 100 : 0;

    // Conversion rate (orders vs all clients)
    const conversionRate = clients.length > 0 ? (activeCustomers / clients.length) * 100 : 0;

    return {
      revenue: currentRevenue,
      revenueChange,
      orders: currentOrders,
      ordersChange,
      avgOrderValue,
      avgOrderChange,
      activeCustomers,
      customersChange,
      conversionRate,
    };
  }, [filteredOrders, previousPeriodOrders, clients]);

  // Daily revenue data for chart
  const dailyRevenueData = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStr = current.toISOString().split('T')[0];
      const dayOrders = filteredOrders.filter(o =>
        o.created_at?.startsWith(dayStr)
      );
      const revenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      days.push({
        date: new Date(current),
        label: current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        revenue,
        orders: dayOrders.length,
      });

      current.setDate(current.getDate() + 1);
    }

    // Limit to last 14 days for readability
    return days.slice(-14);
  }, [filteredOrders, timeRange, customDateFrom, customDateTo]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusCounts = {};
    Object.keys(STATUS_CONFIG).forEach(s => statusCounts[s] = 0);

    filteredOrders.forEach(order => {
      if (order.status && statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });

    return statusCounts;
  }, [filteredOrders]);

  // Payment status distribution
  const paymentDistribution = useMemo(() => {
    const paidCount = filteredOrders.filter(o => o.is_paid).length;
    const pendingCount = filteredOrders.filter(o => !o.is_paid && o.status !== 'cancelled').length;
    const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

    return {
      paid: paidCount,
      pending: pendingCount,
      failed: 0,
      refunded: cancelledCount,
    };
  }, [filteredOrders]);

  // Customer type distribution
  const customerTypeDistribution = useMemo(() => {
    const retail = filteredOrders.filter(o => o.order_type === 'roznica').length;
    const wholesale = filteredOrders.filter(o => o.order_type === 'optom').length;

    return { retail, wholesale };
  }, [filteredOrders]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productStats = {};

    filteredOrders.forEach(order => {
      if (order.product) {
        if (!productStats[order.product]) {
          productStats[order.product] = {
            id: order.product,
            name: order.product_name || `Товар #${order.product}`,
            units: 0,
            revenue: 0,
          };
        }
        productStats[order.product].units += (order.quantity || 1);
        productStats[order.product].revenue += parseFloat(order.total_amount) || 0;
      }
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    const categoryStats = {};

    filteredOrders.forEach(order => {
      const categoryId = order.category_id || 'uncategorized';
      if (!categoryStats[categoryId]) {
        const category = categories.find(c => c.id === categoryId);
        categoryStats[categoryId] = {
          id: categoryId,
          name: category?.name || 'Без категории',
          orders: 0,
          revenue: 0,
        };
      }
      categoryStats[categoryId].orders++;
      categoryStats[categoryId].revenue += parseFloat(order.total_amount) || 0;
    });

    return Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredOrders, categories]);

  // Top customers
  const topCustomers = useMemo(() => {
    const customerStats = {};

    filteredOrders.forEach(order => {
      if (order.client) {
        if (!customerStats[order.client]) {
          customerStats[order.client] = {
            id: order.client,
            name: order.client_name || `Клиент #${order.client}`,
            orders: 0,
            revenue: 0,
          };
        }
        customerStats[order.client].orders++;
        customerStats[order.client].revenue += parseFloat(order.total_amount) || 0;
      }
    });

    return Object.values(customerStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Operational metrics
  const operationalMetrics = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length;
    const fulfillmentRate = filteredOrders.length > 0 ? (delivered / filteredOrders.length) * 100 : 0;

    // Average processing time (mock calculation)
    const avgProcessingDays = 3.5;

    return {
      newOrders: ordersByStatus.awaiting_payment || 0,
      processing: (ordersByStatus.istanbul_warehouse || 0) + (ordersByStatus.to_moscow || 0) + (ordersByStatus.moscow_warehouse || 0),
      shipping: ordersByStatus.to_address || 0,
      delivered: ordersByStatus.delivered || 0,
      cancelled: ordersByStatus.cancelled || 0,
      fulfillmentRate,
      avgProcessingDays,
    };
  }, [filteredOrders, ordersByStatus]);

  // Generate insights
  const insights = useMemo(() => {
    const alerts = [];

    // Revenue trend
    if (stats.revenueChange < -10) {
      alerts.push({
        type: 'warning',
        icon: '📉',
        message: `Выручка снизилась на ${Math.abs(stats.revenueChange).toFixed(1)}% по сравнению с прошлым периодом`,
      });
    } else if (stats.revenueChange > 20) {
      alerts.push({
        type: 'success',
        icon: '📈',
        message: `Отличный рост! Выручка выросла на ${stats.revenueChange.toFixed(1)}%`,
      });
    }

    // Pending payments
    if (paymentDistribution.pending > filteredOrders.length * 0.3) {
      alerts.push({
        type: 'warning',
        icon: '💳',
        message: `Много неоплаченных заказов: ${paymentDistribution.pending} из ${filteredOrders.length}`,
      });
    }

    // Top category
    if (categoryPerformance.length > 0) {
      const topCategory = categoryPerformance[0];
      const categoryShare = (topCategory.revenue / stats.revenue) * 100;
      if (categoryShare > 40) {
        alerts.push({
          type: 'info',
          icon: '🏷️',
          message: `Категория "${topCategory.name}" приносит ${categoryShare.toFixed(0)}% выручки`,
        });
      }
    }

    // Low fulfillment rate
    if (operationalMetrics.fulfillmentRate < 50 && filteredOrders.length > 10) {
      alerts.push({
        type: 'warning',
        icon: '📦',
        message: `Низкий показатель выполнения заказов: ${operationalMetrics.fulfillmentRate.toFixed(0)}%`,
      });
    }

    // High customer activity
    if (stats.customersChange > 30) {
      alerts.push({
        type: 'success',
        icon: '👥',
        message: `Рост активных клиентов на ${stats.customersChange.toFixed(0)}%`,
      });
    }

    return alerts.slice(0, 4);
  }, [stats, paymentDistribution, categoryPerformance, operationalMetrics, filteredOrders]);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Номер заказа', 'Дата', 'Клиент', 'Товар', 'Сумма', 'Статус', 'Оплата'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString('ru-RU'),
      o.client_name || '',
      o.product_name || '',
      o.total_amount,
      STATUS_CONFIG[o.status]?.label || o.status,
      o.is_paid ? 'Оплачено' : 'Не оплачено',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportModal(false);
  };

  const exportToExcel = () => {
    // Simple CSV that Excel can open
    exportToCSV();
  };

  // Helpers
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  const formatChange = (change) => {
    const isPositive = change >= 0;
    return (
      <span style={{
        color: isPositive ? '#10B981' : '#EF4444',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
      }}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  // Mini bar chart component
  const MiniBarChart = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '40px' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${(d.value / max) * 100}%`,
              backgroundColor: color,
              borderRadius: '2px',
              minHeight: '2px',
            }}
          />
        ))}
      </div>
    );
  };

  // Donut chart component
  const DonutChart = ({ data, size = 120 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: '12px',
        }}>
          Нет данных
        </div>
      );
    }

    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = (d.value / total) * 100;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      return { ...d, percent, startAngle };
    });

    const gradientStops = segments.map((seg, i) => {
      const start = segments.slice(0, i).reduce((sum, s) => sum + s.percent, 0);
      const end = start + seg.percent;
      return `${seg.color} ${start}% ${end}%`;
    }).join(', ');

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `conic-gradient(${gradientStops})`,
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: '50%',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{total}</span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>всего</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Загрузка аналитики...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyRevenueData.map(d => d.revenue), 1);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Аналитика</h1>
          <p style={styles.subtitle}>Анализ продаж и бизнес-показателей</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.exportBtn} onClick={() => setShowExportModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Экспорт
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Период</label>
          <div style={styles.timeRangeTabs}>
            {[
              { key: 'today', label: 'Сегодня' },
              { key: '7days', label: '7 дней' },
              { key: '30days', label: '30 дней' },
              { key: 'custom', label: 'Выбрать' },
            ].map(tab => (
              <button
                key={tab.key}
                style={{
                  ...styles.timeRangeTab,
                  ...(timeRange === tab.key ? styles.timeRangeTabActive : {}),
                }}
                onClick={() => setTimeRange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {timeRange === 'custom' && (
            <div style={styles.customDateInputs}>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                style={styles.dateInput}
              />
              <span style={{ color: '#64748B' }}>—</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Тип заказа</label>
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Все типы</option>
            <option value="retail">Розница</option>
            <option value="wholesale">Оптом</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Категория</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div style={styles.insightsBar}>
          {insights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                ...styles.insightCard,
                backgroundColor: insight.type === 'warning' ? '#FEF3C7' :
                  insight.type === 'success' ? '#D1FAE5' : '#DBEAFE',
                borderColor: insight.type === 'warning' ? '#F59E0B' :
                  insight.type === 'success' ? '#10B981' : '#3B82F6',
              }}
            >
              <span style={styles.insightIcon}>{insight.icon}</span>
              <span style={styles.insightText}>{insight.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#FFF5F2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            {formatChange(stats.revenueChange)}
          </div>
          <div style={styles.metricValue}>{formatMoney(stats.revenue)}</div>
          <div style={styles.metricLabel}>Общая выручка</div>
          <MiniBarChart
            data={dailyRevenueData.slice(-7).map(d => ({ value: d.revenue }))}
            color="#FF6B35"
          />
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#D1FAE5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            {formatChange(stats.ordersChange)}
          </div>
          <div style={styles.metricValue}>{stats.orders}</div>
          <div style={styles.metricLabel}>Заказов</div>
          <MiniBarChart
            data={dailyRevenueData.slice(-7).map(d => ({ value: d.orders }))}
            color="#10B981"
          />
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#EDE9FE' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8l-4 4-4-4" />
              </svg>
            </div>
            {formatChange(stats.avgOrderChange)}
          </div>
          <div style={styles.metricValue}>{formatMoney(stats.avgOrderValue)}</div>
          <div style={styles.metricLabel}>Средний чек</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#DBEAFE' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            {formatChange(stats.customersChange)}
          </div>
          <div style={styles.metricValue}>{stats.activeCustomers}</div>
          <div style={styles.metricLabel}>Активных клиентов</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={{ ...styles.metricIcon, backgroundColor: '#FEF3C7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div style={styles.metricValue}>{stats.conversionRate.toFixed(1)}%</div>
          <div style={styles.metricLabel}>Конверсия</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Revenue Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Выручка по дням</h3>
          </div>
          <div style={styles.lineChart}>
            <div style={styles.chartYAxis}>
              <span>{formatMoney(maxRevenue)}</span>
              <span>{formatMoney(maxRevenue / 2)}</span>
              <span>0 ₽</span>
            </div>
            <div style={styles.chartArea}>
              {dailyRevenueData.map((d, idx) => (
                <div key={idx} style={styles.chartBarWrapper}>
                  <div
                    style={{
                      ...styles.chartBar,
                      height: `${(d.revenue / maxRevenue) * 100}%`,
                    }}
                    title={`${d.label}: ${formatMoney(d.revenue)}`}
                  >
                    <div style={styles.chartBarTooltip}>
                      {formatMoney(d.revenue)}
                    </div>
                  </div>
                  <span style={styles.chartBarLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Заказы по статусам</h3>
          </div>
          <div style={styles.statusList}>
            {Object.entries(ordersByStatus)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const config = STATUS_CONFIG[status];
                const percentage = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
                return (
                  <div key={status} style={styles.statusItem}>
                    <div style={styles.statusInfo}>
                      <span style={{ ...styles.statusDot, backgroundColor: config.color }} />
                      <span style={styles.statusLabel}>{config.label}</span>
                    </div>
                    <div style={styles.statusBarContainer}>
                      <div
                        style={{
                          ...styles.statusBar,
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                    <span style={styles.statusCount}>{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div style={styles.chartsRow}>
        {/* Payment Distribution */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Статус оплаты</h3>
          </div>
          <div style={styles.donutChartContainer}>
            <DonutChart
              data={[
                { value: paymentDistribution.paid, color: '#10B981', label: 'Оплачено' },
                { value: paymentDistribution.pending, color: '#F59E0B', label: 'Ожидает' },
                { value: paymentDistribution.refunded, color: '#8B5CF6', label: 'Отменено' },
              ]}
              size={140}
            />
            <div style={styles.donutLegend}>
              {Object.entries(paymentDistribution).map(([key, value]) => {
                const config = PAYMENT_STATUS_CONFIG[key];
                if (!config || value === 0) return null;
                return (
                  <div key={key} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: config.color }} />
                    <span style={styles.legendLabel}>{config.label}</span>
                    <span style={styles.legendValue}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer Type Distribution */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Типы клиентов</h3>
          </div>
          <div style={styles.donutChartContainer}>
            <DonutChart
              data={[
                { value: customerTypeDistribution.retail, color: '#FF6B35', label: 'Розница' },
                { value: customerTypeDistribution.wholesale, color: '#3B82F6', label: 'Оптом' },
              ]}
              size={140}
            />
            <div style={styles.donutLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#FF6B35' }} />
                <span style={styles.legendLabel}>Розница</span>
                <span style={styles.legendValue}>{customerTypeDistribution.retail}</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#3B82F6' }} />
                <span style={styles.legendLabel}>Оптом</span>
                <span style={styles.legendValue}>{customerTypeDistribution.wholesale}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product & Customer Analytics */}
      <div style={styles.chartsRow}>
        {/* Top Products */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Топ товаров по выручке</h3>
          </div>
          {topProducts.length === 0 ? (
            <div style={styles.emptyState}>Нет данных о заказах</div>
          ) : (
            <div style={styles.productList}>
              {topProducts.map((product, idx) => {
                const maxProductRevenue = topProducts[0]?.revenue || 1;
                return (
                  <div key={product.id} style={styles.productItem}>
                    <span style={styles.productRank}>#{idx + 1}</span>
                    <div style={styles.productInfo}>
                      <span style={styles.productName}>{product.name}</span>
                      <span style={styles.productMeta}>{product.units} шт.</span>
                    </div>
                    <div style={styles.productBarWrapper}>
                      <div
                        style={{
                          ...styles.productBar,
                          width: `${(product.revenue / maxProductRevenue) * 100}%`,
                        }}
                      />
                    </div>
                    <span style={styles.productRevenue}>{formatMoney(product.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Топ клиентов</h3>
          </div>
          {topCustomers.length === 0 ? (
            <div style={styles.emptyState}>Нет данных о клиентах</div>
          ) : (
            <div style={styles.customerList}>
              {topCustomers.map((customer, idx) => (
                <div key={customer.id} style={styles.customerItem}>
                  <div style={styles.customerAvatar}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.customerInfo}>
                    <span style={styles.customerName}>{customer.name}</span>
                    <span style={styles.customerMeta}>{customer.orders} заказов</span>
                  </div>
                  <span style={styles.customerRevenue}>{formatMoney(customer.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operational Metrics */}
      <div style={styles.operationalSection}>
        <h3 style={styles.sectionTitle}>Операционные показатели</h3>
        <div style={styles.operationalGrid}>
          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#FEF3C7' }}>
              <span style={{ fontSize: '20px' }}>🆕</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.newOrders}</div>
            <div style={styles.operationalLabel}>Новых заказов</div>
          </div>

          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#EDE9FE' }}>
              <span style={{ fontSize: '20px' }}>⚙️</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.processing}</div>
            <div style={styles.operationalLabel}>В обработке</div>
          </div>

          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#DBEAFE' }}>
              <span style={{ fontSize: '20px' }}>🚚</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.shipping}</div>
            <div style={styles.operationalLabel}>В доставке</div>
          </div>

          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#D1FAE5' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.delivered}</div>
            <div style={styles.operationalLabel}>Доставлено</div>
          </div>

          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#FEE2E2' }}>
              <span style={{ fontSize: '20px' }}>❌</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.cancelled}</div>
            <div style={styles.operationalLabel}>Отменено</div>
          </div>

          <div style={styles.operationalCard}>
            <div style={{ ...styles.operationalIcon, backgroundColor: '#FFF5F2' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
            </div>
            <div style={styles.operationalValue}>{operationalMetrics.fulfillmentRate.toFixed(0)}%</div>
            <div style={styles.operationalLabel}>Выполнение</div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      {categoryPerformance.length > 0 && (
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Выручка по категориям</h3>
          </div>
          <div style={styles.categoryGrid}>
            {categoryPerformance.map((cat, idx) => {
              const maxCatRevenue = categoryPerformance[0]?.revenue || 1;
              return (
                <div key={cat.id} style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <span style={{ ...styles.categoryColor, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span style={styles.categoryName}>{cat.name}</span>
                  </div>
                  <div style={styles.categoryBarWrapper}>
                    <div
                      style={{
                        ...styles.categoryBar,
                        width: `${(cat.revenue / maxCatRevenue) * 100}%`,
                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <div style={styles.categoryStats}>
                    <span style={styles.categoryRevenue}>{formatMoney(cat.revenue)}</span>
                    <span style={styles.categoryOrders}>{cat.orders} заказов</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Экспорт данных</h2>
            <p style={styles.modalSubtitle}>Выберите формат для экспорта аналитики</p>
            <div style={styles.exportOptions}>
              <button style={styles.exportOption} onClick={exportToCSV}>
                <span style={styles.exportIcon}>📄</span>
                <div>
                  <span style={styles.exportFormat}>CSV</span>
                  <span style={styles.exportDesc}>Для Excel, Google Sheets</span>
                </div>
              </button>
              <button style={styles.exportOption} onClick={exportToExcel}>
                <span style={styles.exportIcon}>📊</span>
                <div>
                  <span style={styles.exportFormat}>Excel</span>
                  <span style={styles.exportDesc}>Microsoft Excel</span>
                </div>
              </button>
            </div>
            <button style={styles.modalCancelBtn} onClick={() => setShowExportModal(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 24px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#64748B',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLeft: {},
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748B',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
    cursor: 'pointer',
  },
  // Filters
  filtersBar: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-end',
    marginBottom: '20px',
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  timeRangeTabs: {
    display: 'flex',
    gap: '4px',
  },
  timeRangeTab: {
    padding: '8px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748B',
    cursor: 'pointer',
  },
  timeRangeTabActive: {
    backgroundColor: '#FF6B35',
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
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
  },
  filterSelect: {
    padding: '8px 32px 8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    minWidth: '150px',
  },
  // Insights
  insightsBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  insightCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  insightIcon: {
    fontSize: '18px',
  },
  insightText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1E293B',
  },
  // Metrics
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #E2E8F0',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  metricIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
    marginBottom: '12px',
  },
  // Charts
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #E2E8F0',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  chartTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
  },
  lineChart: {
    display: 'flex',
    height: '200px',
  },
  chartYAxis: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: '12px',
    fontSize: '10px',
    color: '#9CA3AF',
    minWidth: '70px',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    borderLeft: '1px solid #E2E8F0',
    borderBottom: '1px solid #E2E8F0',
    paddingLeft: '8px',
    paddingBottom: '24px',
  },
  chartBarWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  chartBar: {
    width: '100%',
    maxWidth: '24px',
    backgroundColor: '#FF6B35',
    borderRadius: '4px 4px 0 0',
    minHeight: '2px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  chartBarTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: 'opacity 0.2s',
    pointerEvents: 'none',
  },
  chartBarLabel: {
    position: 'absolute',
    bottom: '-20px',
    fontSize: '9px',
    color: '#9CA3AF',
    whiteSpace: 'nowrap',
  },
  // Status List
  statusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '140px',
    flexShrink: 0,
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusLabel: {
    fontSize: '13px',
    color: '#374151',
  },
  statusBarContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  statusBar: {
    height: '100%',
    borderRadius: '4px',
  },
  statusCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    width: '40px',
    textAlign: 'right',
  },
  // Donut Chart
  donutChartContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: '13px',
    color: '#64748B',
    flex: 1,
  },
  legendValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
  },
  // Products
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  productItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productRank: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FF6B35',
    width: '28px',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1E293B',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productMeta: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  productBarWrapper: {
    width: '80px',
    height: '6px',
    backgroundColor: '#F3F4F6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  productBar: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: '3px',
  },
  productRevenue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    width: '90px',
    textAlign: 'right',
  },
  // Customers
  customerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  customerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
  },
  customerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
    display: 'block',
  },
  customerMeta: {
    fontSize: '12px',
    color: '#64748B',
  },
  customerRevenue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
  },
  // Operational
  operationalSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: '16px',
  },
  operationalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '16px',
  },
  operationalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E2E8F0',
    textAlign: 'center',
  },
  operationalIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  operationalValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
  },
  operationalLabel: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
  },
  // Categories
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  categoryItem: {
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  categoryColor: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  categoryName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
  },
  categoryBarWrapper: {
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  categoryBar: {
    height: '100%',
    borderRadius: '4px',
  },
  categoryStats: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  categoryRevenue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
  },
  categoryOrders: {
    fontSize: '12px',
    color: '#64748B',
  },
  // Empty
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '14px',
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
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#64748B',
  },
  exportOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  exportOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  exportIcon: {
    fontSize: '28px',
  },
  exportFormat: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
    display: 'block',
  },
  exportDesc: {
    fontSize: '12px',
    color: '#64748B',
  },
  modalCancelBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default Statistics;
