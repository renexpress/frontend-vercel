import React, { useState, useEffect, useMemo } from 'react';
import API_URL from '../config/api';

// Status configuration
const STATUS_CONFIG = {
  awaiting_payment: { label: 'Ожидание оплаты', color: '#F59E0B' },
  accepted: { label: 'Принят', color: '#10B981' },
  istanbul_warehouse: { label: 'Склад Стамбул', color: '#3B82F6' },
  to_moscow: { label: 'В пути до Москвы', color: '#8B5CF6' },
  moscow_warehouse: { label: 'Склад Москва', color: '#06B6D4' },
  to_address: { label: 'Доставка', color: '#6366F1' },
  delivered: { label: 'Доставлен', color: '#10B981' },
  cancelled: { label: 'Отменён', color: '#EF4444' },
};

const CHART_COLORS = ['#5C6AC4', '#47C1BF', '#50B83C', '#EEC200', '#DE3618', '#9C6ADE', '#F49342', '#4799EB', '#00848E', '#BF0711'];

function Statistics() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [timeRange, setTimeRange] = useState('30days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chartGrouping, setChartGrouping] = useState('daily');
  const [comparePrevious, setComparePrevious] = useState(false);

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
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate = new Date(now);

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'custom':
        startDate = customDateFrom ? new Date(customDateFrom) : new Date(now.setMonth(now.getMonth() - 1));
        endDate = customDateTo ? new Date(customDateTo) : new Date();
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  };

  // Get previous period date range
  const getPreviousPeriodRange = () => {
    const { startDate, endDate } = getDateRange();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

    return { prevStartDate, prevEndDate };
  };

  // Filter orders based on date range and category
  const filteredOrders = useMemo(() => {
    const { startDate, endDate } = getDateRange();

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const inDateRange = orderDate >= startDate && orderDate <= endDate;
      const matchesCategory = categoryFilter === 'all' || order.category_id === parseInt(categoryFilter);
      return inDateRange && matchesCategory;
    });
  }, [orders, timeRange, customDateFrom, customDateTo, categoryFilter]);

  // Previous period orders
  const previousPeriodOrders = useMemo(() => {
    const { prevStartDate, prevEndDate } = getPreviousPeriodRange();

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= prevStartDate && orderDate <= prevEndDate;
    });
  }, [orders, timeRange, customDateFrom, customDateTo]);

  // =============================================
  // 1. KPI METRICS
  // =============================================
  const kpiMetrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const ordersCount = filteredOrders.length;
    const prevOrdersCount = previousPeriodOrders.length;

    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;
    const prevAvgOrderValue = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

    const activeUsers = new Set(filteredOrders.map(o => o.client)).size;
    const prevActiveUsers = new Set(previousPeriodOrders.map(o => o.client)).size;

    // Conversion rate (delivered / total)
    const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;
    const conversionRate = ordersCount > 0 ? (deliveredCount / ordersCount) * 100 : 0;
    const prevDeliveredCount = previousPeriodOrders.filter(o => o.status === 'delivered').length;
    const prevConversionRate = prevOrdersCount > 0 ? (prevDeliveredCount / prevOrdersCount) * 100 : 0;

    // Refund rate (cancelled / total)
    const refundCount = filteredOrders.filter(o => o.status === 'cancelled').length;
    const refundRate = ordersCount > 0 ? (refundCount / ordersCount) * 100 : 0;
    const prevRefundCount = previousPeriodOrders.filter(o => o.status === 'cancelled').length;
    const prevRefundRate = prevOrdersCount > 0 ? (prevRefundCount / prevOrdersCount) * 100 : 0;

    const calcChange = (current, prev) => prev > 0 ? ((current - prev) / prev) * 100 : 0;

    return [
      { label: 'Общая выручка', value: totalRevenue, format: 'money', change: calcChange(totalRevenue, prevRevenue) },
      { label: 'Кол-во заказов', value: ordersCount, format: 'number', change: calcChange(ordersCount, prevOrdersCount) },
      { label: 'Средний чек', value: avgOrderValue, format: 'money', change: calcChange(avgOrderValue, prevAvgOrderValue) },
      { label: 'Активных клиентов', value: activeUsers, format: 'number', change: calcChange(activeUsers, prevActiveUsers) },
      { label: 'Конверсия', value: conversionRate, format: 'percent', change: calcChange(conversionRate, prevConversionRate) },
      { label: 'Возвраты', value: refundRate, format: 'percent', change: calcChange(refundRate, prevRefundRate), negative: true },
    ];
  }, [filteredOrders, previousPeriodOrders]);

  // =============================================
  // 2. REVENUE OVER TIME
  // =============================================
  const revenueOverTime = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const data = [];
    const prevData = [];

    if (chartGrouping === 'daily') {
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayStr = current.toISOString().split('T')[0];
        const dayOrders = filteredOrders.filter(o => o.created_at?.startsWith(dayStr));
        const revenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

        data.push({
          label: current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
          value: revenue,
          orders: dayOrders.length,
        });

        current.setDate(current.getDate() + 1);
      }
    } else if (chartGrouping === 'weekly') {
      const current = new Date(startDate);
      let weekStart = new Date(current);
      let weekRevenue = 0;
      let weekOrders = 0;

      while (current <= endDate) {
        const dayStr = current.toISOString().split('T')[0];
        const dayOrders = filteredOrders.filter(o => o.created_at?.startsWith(dayStr));
        weekRevenue += dayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
        weekOrders += dayOrders.length;

        if (current.getDay() === 0 || current >= endDate) {
          data.push({
            label: `${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`,
            value: weekRevenue,
            orders: weekOrders,
          });
          weekRevenue = 0;
          weekOrders = 0;
          weekStart = new Date(current);
          weekStart.setDate(weekStart.getDate() + 1);
        }

        current.setDate(current.getDate() + 1);
      }
    } else {
      // Monthly
      const monthlyData = {};
      filteredOrders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, orders: 0, date };
        }
        monthlyData[monthKey].revenue += parseFloat(order.total_amount) || 0;
        monthlyData[monthKey].orders += 1;
      });

      Object.values(monthlyData)
        .sort((a, b) => a.date - b.date)
        .forEach(m => {
          data.push({
            label: m.date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
            value: m.revenue,
            orders: m.orders,
          });
        });
    }

    return data.slice(-14);
  }, [filteredOrders, chartGrouping, timeRange, customDateFrom, customDateTo]);

  // =============================================
  // 3. ORDERS OVER TIME
  // =============================================
  const ordersOverTime = useMemo(() => {
    return revenueOverTime.map(d => ({
      label: d.label,
      value: d.orders,
    }));
  }, [revenueOverTime]);

  // =============================================
  // 4. SALES BREAKDOWN
  // =============================================
  const salesByCategory = useMemo(() => {
    const categoryStats = {};
    filteredOrders.forEach(order => {
      const catId = order.category_id || 'uncategorized';
      if (!categoryStats[catId]) {
        const cat = categories.find(c => c.id === catId);
        categoryStats[catId] = {
          name: cat?.name || 'Без категории',
          value: 0,
        };
      }
      categoryStats[catId].value += parseFloat(order.total_amount) || 0;
    });

    return Object.values(categoryStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredOrders, categories]);

  const salesByOrderType = useMemo(() => {
    const retail = filteredOrders.filter(o => o.order_type === 'roznica');
    const wholesale = filteredOrders.filter(o => o.order_type === 'optom');

    return [
      { name: 'Розница', value: retail.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) },
      { name: 'Оптом', value: wholesale.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) },
    ];
  }, [filteredOrders]);

  const salesByPayment = useMemo(() => {
    const paid = filteredOrders.filter(o => o.is_paid);
    const unpaid = filteredOrders.filter(o => !o.is_paid && o.status !== 'cancelled');

    return [
      { name: 'Оплачено', value: paid.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) },
      { name: 'Ожидает оплаты', value: unpaid.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) },
    ];
  }, [filteredOrders]);

  // =============================================
  // 5. PRODUCT PERFORMANCE
  // =============================================
  const topProductsByRevenue = useMemo(() => {
    const productStats = {};
    filteredOrders.forEach(order => {
      if (order.product) {
        if (!productStats[order.product]) {
          productStats[order.product] = {
            name: order.product_name || `Товар #${order.product}`,
            revenue: 0,
            orders: 0,
            quantity: 0,
          };
        }
        productStats[order.product].revenue += parseFloat(order.total_amount) || 0;
        productStats[order.product].orders += 1;
        productStats[order.product].quantity += order.quantity || 1;
      }
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders]);

  const topProductsByOrders = useMemo(() => {
    return [...topProductsByRevenue].sort((a, b) => b.orders - a.orders).slice(0, 10);
  }, [topProductsByRevenue]);

  // =============================================
  // 6. CUSTOMER ANALYTICS
  // =============================================
  const customerAnalytics = useMemo(() => {
    const clientOrderCounts = {};
    orders.forEach(order => {
      if (order.client) {
        clientOrderCounts[order.client] = (clientOrderCounts[order.client] || 0) + 1;
      }
    });

    const newCustomers = filteredOrders.filter(order => {
      const allClientOrders = orders.filter(o => o.client === order.client);
      const firstOrder = allClientOrders.reduce((min, o) =>
        new Date(o.created_at) < new Date(min.created_at) ? o : min
      );
      return firstOrder.id === order.id;
    });

    const returningCustomers = filteredOrders.filter(order => {
      const previousOrders = orders.filter(o =>
        o.client === order.client &&
        new Date(o.created_at) < new Date(order.created_at)
      );
      return previousOrders.length > 0;
    });

    // Customer segments
    const segments = {
      new: new Set(newCustomers.map(o => o.client)).size,
      returning: new Set(returningCustomers.map(o => o.client)).size,
      vip: 0,
    };

    // VIP = clients with 5+ orders
    Object.entries(clientOrderCounts).forEach(([clientId, count]) => {
      if (count >= 5 && filteredOrders.some(o => o.client === parseInt(clientId))) {
        segments.vip += 1;
      }
    });

    return {
      newCount: new Set(newCustomers.map(o => o.client)).size,
      returningCount: new Set(returningCustomers.map(o => o.client)).size,
      segments: [
        { name: 'Новые', value: segments.new },
        { name: 'Повторные', value: segments.returning },
        { name: 'VIP (5+ заказов)', value: segments.vip },
      ],
    };
  }, [filteredOrders, orders]);

  // =============================================
  // 7. CONVERSION FUNNEL
  // =============================================
  const funnelData = useMemo(() => {
    const total = filteredOrders.length;
    const awaitingPayment = filteredOrders.filter(o => o.status === 'awaiting_payment').length;
    const accepted = filteredOrders.filter(o => ['accepted', 'istanbul_warehouse', 'to_moscow', 'moscow_warehouse', 'to_address', 'delivered'].includes(o.status)).length;
    const inTransit = filteredOrders.filter(o => ['to_moscow', 'moscow_warehouse', 'to_address', 'delivered'].includes(o.status)).length;
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length;

    return [
      { label: 'Все заказы', value: total, percent: 100 },
      { label: 'Оплачено', value: accepted, percent: total > 0 ? (accepted / total) * 100 : 0 },
      { label: 'В пути', value: inTransit, percent: total > 0 ? (inTransit / total) * 100 : 0 },
      { label: 'Доставлено', value: delivered, percent: total > 0 ? (delivered / total) * 100 : 0 },
    ];
  }, [filteredOrders]);

  // =============================================
  // 8. INVENTORY
  // =============================================
  const inventoryData = useMemo(() => {
    const lowStock = products.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0);
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);

    return {
      lowStock: lowStock.slice(0, 5).map(p => ({
        name: p.name,
        stock: p.stock_quantity || 0,
        status: p.stock_quantity < 5 ? 'critical' : 'low',
      })),
      outOfStock: outOfStock.length,
      healthyStock: products.filter(p => (p.stock_quantity || 0) >= 10).length,
    };
  }, [products]);

  // =============================================
  // 9. GEOGRAPHIC (by client region if available)
  // =============================================
  const geographicData = useMemo(() => {
    const regionStats = {};
    filteredOrders.forEach(order => {
      // Try to extract city from address
      const address = order.address_to || '';
      let region = 'Не указано';

      if (address.toLowerCase().includes('москва') || address.toLowerCase().includes('moscow')) {
        region = 'Москва';
      } else if (address.toLowerCase().includes('стамбул') || address.toLowerCase().includes('istanbul')) {
        region = 'Стамбул';
      } else if (address.toLowerCase().includes('санкт') || address.toLowerCase().includes('петербург')) {
        region = 'Санкт-Петербург';
      } else if (address.length > 0) {
        region = 'Другие регионы';
      }

      if (!regionStats[region]) {
        regionStats[region] = { name: region, orders: 0, revenue: 0 };
      }
      regionStats[region].orders += 1;
      regionStats[region].revenue += parseFloat(order.total_amount) || 0;
    });

    return Object.values(regionStats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // =============================================
  // 10. REFUNDS
  // =============================================
  const refundData = useMemo(() => {
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled');

    return {
      count: cancelled.length,
      value: cancelled.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
      rate: filteredOrders.length > 0 ? (cancelled.length / filteredOrders.length) * 100 : 0,
    };
  }, [filteredOrders]);

  // =============================================
  // 11. ORDERS TABLE
  // =============================================
  const ordersTableData = useMemo(() => {
    const dailyStats = {};

    filteredOrders.forEach(order => {
      const date = order.created_at?.split('T')[0] || 'unknown';
      if (!dailyStats[date]) {
        dailyStats[date] = { date, orders: 0, revenue: 0 };
      }
      dailyStats[date].orders += 1;
      dailyStats[date].revenue += parseFloat(order.total_amount) || 0;
    });

    return Object.values(dailyStats)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map(d => ({
        ...d,
        avgOrderValue: d.orders > 0 ? d.revenue / d.orders : 0,
      }));
  }, [filteredOrders]);

  // =============================================
  // HELPERS
  // =============================================
  const formatMoney = (amount) => new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ₽';
  const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(Math.round(num));
  const formatPercent = (num) => num.toFixed(1) + '%';
  const formatTime = (date) => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatValue = (value, format) => {
    switch (format) {
      case 'money': return formatMoney(value);
      case 'percent': return formatPercent(value);
      default: return formatNumber(value);
    }
  };

  // Donut Chart Component
  const DonutChart = ({ data, size = 160 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      return (
        <div style={{ ...styles.donutEmpty, width: size, height: size }}>
          Нет данных
        </div>
      );
    }

    let cumulativePercent = 0;
    const gradientStops = data.map((d, i) => {
      const start = cumulativePercent;
      const percent = (d.value / total) * 100;
      cumulativePercent += percent;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${cumulativePercent}%`;
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
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#303030' }}>{formatMoney(total)}</span>
        </div>
      </div>
    );
  };

  // Legend Component
  const ChartLegend = ({ data }) => (
    <div style={styles.legend}>
      {data.map((d, i) => (
        <div key={i} style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span style={styles.legendLabel}>{d.name}</span>
          <span style={styles.legendValue}>{formatMoney(d.value)}</span>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Загрузка аналитики...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueOverTime.map(d => d.value), 1);
  const maxOrders = Math.max(...ordersOverTime.map(d => d.value), 1);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="2">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
            <h1 style={styles.title}>Аналитика</h1>
          </div>
          <span style={styles.refreshTime}>Обновлено: {formatTime(lastRefreshed)}</span>
        </div>
        <button style={styles.refreshBtn} onClick={fetchAllData}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Global Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Период</span>
          <div style={styles.filterButtons}>
            {[
              { key: 'today', label: 'Сегодня' },
              { key: '7days', label: '7 дней' },
              { key: '30days', label: '30 дней' },
              { key: '90days', label: '90 дней' },
            ].map(f => (
              <button
                key={f.key}
                style={{ ...styles.filterBtn, ...(timeRange === f.key ? styles.filterBtnActive : {}) }}
                onClick={() => setTimeRange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Категория</span>
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

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Группировка</span>
          <div style={styles.filterButtons}>
            {[
              { key: 'daily', label: 'День' },
              { key: 'weekly', label: 'Неделя' },
              { key: 'monthly', label: 'Месяц' },
            ].map(f => (
              <button
                key={f.key}
                style={{ ...styles.filterBtnSmall, ...(chartGrouping === f.key ? styles.filterBtnActive : {}) }}
                onClick={() => setChartGrouping(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div style={styles.kpiGrid}>
        {kpiMetrics.map((kpi, idx) => (
          <div key={idx} style={styles.kpiCard}>
            <div style={styles.kpiLabel}>{kpi.label}</div>
            <div style={styles.kpiValue}>{formatValue(kpi.value, kpi.format)}</div>
            <div style={{
              ...styles.kpiChange,
              color: kpi.negative
                ? (kpi.change > 0 ? '#DE3618' : '#50B83C')
                : (kpi.change >= 0 ? '#50B83C' : '#DE3618')
            }}>
              {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* 2. Revenue Over Time */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Выручка за период</h3>
        </div>
        <div style={styles.lineChartContainer}>
          <div style={styles.chartYAxis}>
            <span>{formatMoney(maxRevenue)}</span>
            <span>{formatMoney(maxRevenue / 2)}</span>
            <span>0 ₽</span>
          </div>
          <div style={styles.chartAreaWrapper}>
            <svg style={styles.chartSvg} viewBox={`0 0 ${revenueOverTime.length * 50} 200`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5C6AC4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5C6AC4" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area */}
              <path
                d={`M0,${200 - (revenueOverTime[0]?.value / maxRevenue) * 180} ${revenueOverTime.map((d, i) =>
                  `L${i * 50},${200 - (d.value / maxRevenue) * 180}`
                ).join(' ')} L${(revenueOverTime.length - 1) * 50},200 L0,200 Z`}
                fill="url(#revenueGradient)"
              />
              {/* Line */}
              <path
                d={`M0,${200 - (revenueOverTime[0]?.value / maxRevenue) * 180} ${revenueOverTime.map((d, i) =>
                  `L${i * 50},${200 - (d.value / maxRevenue) * 180}`
                ).join(' ')}`}
                fill="none"
                stroke="#5C6AC4"
                strokeWidth="2.5"
              />
              {/* Dots */}
              {revenueOverTime.map((d, i) => (
                <circle key={i} cx={i * 50} cy={200 - (d.value / maxRevenue) * 180} r="4" fill="#5C6AC4" />
              ))}
            </svg>
            <div style={styles.chartXAxis}>
              {revenueOverTime.map((d, i) => (
                <span key={i} style={styles.xAxisLabel}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Orders Over Time */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Заказы за период</h3>
        </div>
        <div style={styles.barChartContainer}>
          {ordersOverTime.map((d, i) => (
            <div key={i} style={styles.barWrapper}>
              <div
                style={{
                  ...styles.bar,
                  height: `${(d.value / maxOrders) * 150}px`,
                  backgroundColor: '#47C1BF',
                }}
              />
              <span style={styles.barLabel}>{d.label}</span>
              <span style={styles.barValue}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sales Breakdown */}
      <div style={styles.row}>
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>Выручка по категориям</h3>
          <div style={styles.donutContainer}>
            <DonutChart data={salesByCategory} />
            <ChartLegend data={salesByCategory} />
          </div>
        </div>

        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>Тип заказов</h3>
          <div style={styles.donutContainer}>
            <DonutChart data={salesByOrderType} size={140} />
            <ChartLegend data={salesByOrderType} />
          </div>
        </div>

        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>Статус оплаты</h3>
          <div style={styles.donutContainer}>
            <DonutChart data={salesByPayment} size={140} />
            <ChartLegend data={salesByPayment} />
          </div>
        </div>
      </div>

      {/* 5. Product Performance */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Топ товаров по выручке</h3>
        <div style={styles.horizontalBarList}>
          {topProductsByRevenue.map((p, i) => (
            <div key={i} style={styles.horizontalBarItem}>
              <span style={styles.hBarRank}>#{i + 1}</span>
              <span style={styles.hBarName}>{p.name}</span>
              <div style={styles.hBarWrapper}>
                <div
                  style={{
                    ...styles.hBar,
                    width: `${(p.revenue / (topProductsByRevenue[0]?.revenue || 1)) * 100}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
              <span style={styles.hBarValue}>{formatMoney(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Customer Analytics */}
      <div style={styles.row}>
        <div style={styles.chartCardHalf}>
          <h3 style={styles.chartTitle}>Клиенты: новые vs повторные</h3>
          <div style={styles.customerBars}>
            <div style={styles.customerBar}>
              <div style={styles.customerBarLabel}>Новые клиенты</div>
              <div style={styles.customerBarContainer}>
                <div style={{ ...styles.customerBarFill, width: `${customerAnalytics.newCount > 0 ? 50 : 0}%`, backgroundColor: '#5C6AC4' }} />
              </div>
              <div style={styles.customerBarValue}>{customerAnalytics.newCount}</div>
            </div>
            <div style={styles.customerBar}>
              <div style={styles.customerBarLabel}>Повторные</div>
              <div style={styles.customerBarContainer}>
                <div style={{ ...styles.customerBarFill, width: `${customerAnalytics.returningCount > 0 ? 70 : 0}%`, backgroundColor: '#47C1BF' }} />
              </div>
              <div style={styles.customerBarValue}>{customerAnalytics.returningCount}</div>
            </div>
          </div>
        </div>

        <div style={styles.chartCardHalf}>
          <h3 style={styles.chartTitle}>Сегменты клиентов</h3>
          <div style={styles.donutContainer}>
            <DonutChart data={customerAnalytics.segments} size={120} />
            <div style={styles.legend}>
              {customerAnalytics.segments.map((s, i) => (
                <div key={i} style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: CHART_COLORS[i] }} />
                  <span style={styles.legendLabel}>{s.name}</span>
                  <span style={styles.legendValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Conversion Funnel */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Воронка заказов</h3>
        <div style={styles.funnel}>
          {funnelData.map((step, i) => (
            <div key={i} style={styles.funnelStep}>
              <div
                style={{
                  ...styles.funnelBar,
                  width: `${step.percent}%`,
                  backgroundColor: CHART_COLORS[i],
                }}
              >
                <span style={styles.funnelLabel}>{step.label}</span>
              </div>
              <div style={styles.funnelStats}>
                <span style={styles.funnelValue}>{step.value}</span>
                <span style={styles.funnelPercent}>{step.percent.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Inventory */}
      <div style={styles.row}>
        <div style={styles.chartCardHalf}>
          <h3 style={styles.chartTitle}>Низкий остаток</h3>
          {inventoryData.lowStock.length === 0 ? (
            <div style={styles.emptyState}>Все товары в наличии</div>
          ) : (
            <div style={styles.inventoryList}>
              {inventoryData.lowStock.map((p, i) => (
                <div key={i} style={styles.inventoryItem}>
                  <span style={styles.inventoryName}>{p.name}</span>
                  <span style={{
                    ...styles.inventoryBadge,
                    backgroundColor: p.status === 'critical' ? '#FED3D1' : '#FFEA8A',
                    color: p.status === 'critical' ? '#DE3618' : '#8A6116',
                  }}>
                    {p.stock} шт.
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={styles.inventorySummary}>
            <span>Нет в наличии: <strong>{inventoryData.outOfStock}</strong></span>
            <span>В норме: <strong>{inventoryData.healthyStock}</strong></span>
          </div>
        </div>

        {/* 9. Geographic */}
        <div style={styles.chartCardHalf}>
          <h3 style={styles.chartTitle}>Продажи по регионам</h3>
          <div style={styles.regionList}>
            {geographicData.slice(0, 5).map((r, i) => (
              <div key={i} style={styles.regionItem}>
                <span style={styles.regionName}>{r.name}</span>
                <div style={styles.regionBarWrapper}>
                  <div
                    style={{
                      ...styles.regionBar,
                      width: `${(r.revenue / (geographicData[0]?.revenue || 1)) * 100}%`,
                      backgroundColor: CHART_COLORS[i],
                    }}
                  />
                </div>
                <span style={styles.regionValue}>{formatMoney(r.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10. Refunds */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Возвраты и отмены</h3>
        <div style={styles.refundStats}>
          <div style={styles.refundStat}>
            <span style={styles.refundStatLabel}>Отменено заказов</span>
            <span style={styles.refundStatValue}>{refundData.count}</span>
          </div>
          <div style={styles.refundStat}>
            <span style={styles.refundStatLabel}>Сумма возвратов</span>
            <span style={styles.refundStatValue}>{formatMoney(refundData.value)}</span>
          </div>
          <div style={styles.refundStat}>
            <span style={styles.refundStatLabel}>Процент возвратов</span>
            <span style={{ ...styles.refundStatValue, color: refundData.rate > 10 ? '#DE3618' : '#303030' }}>
              {refundData.rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 11. Orders Table */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Сводка по дням</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Дата</th>
                <th style={styles.th}>Заказов</th>
                <th style={styles.th}>Выручка</th>
                <th style={styles.th}>Средний чек</th>
              </tr>
            </thead>
            <tbody>
              {ordersTableData.map((row, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                  <td style={styles.td}>{new Date(row.date).toLocaleDateString('ru-RU')}</td>
                  <td style={styles.td}>{row.orders}</td>
                  <td style={styles.td}>{formatMoney(row.revenue)}</td>
                  <td style={styles.td}>{formatMoney(row.avgOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Status Summary */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Статусы заказов</h3>
        <div style={styles.statusGrid}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = filteredOrders.filter(o => o.status === status).length;
            return (
              <div key={status} style={styles.statusCard}>
                <div style={{ ...styles.statusDot, backgroundColor: config.color }} />
                <div style={styles.statusInfo}>
                  <span style={styles.statusCount}>{count}</span>
                  <span style={styles.statusLabel}>{config.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f6f6f7',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f6f6f7',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e1e3e5',
    borderTopColor: '#303030',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#6d7175',
    fontSize: '14px',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',
    color: '#303030',
  },
  refreshTime: {
    fontSize: '13px',
    color: '#6d7175',
  },
  refreshBtn: {
    width: '40px',
    height: '40px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6d7175',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
  },

  // Filters
  filtersBar: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    textTransform: 'uppercase',
  },
  filterButtons: {
    display: 'flex',
    gap: '4px',
  },
  filterBtn: {
    padding: '8px 14px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },
  filterBtnSmall: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#303030',
    borderColor: '#303030',
    color: '#fff',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#fff',
    minWidth: '150px',
  },

  // KPI Cards
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#6d7175',
    marginBottom: '8px',
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#303030',
    marginBottom: '8px',
  },
  kpiChange: {
    fontSize: '13px',
    fontWeight: '600',
  },

  // Charts
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    marginBottom: '20px',
  },
  chartCardSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  chartCardHalf: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  chartHeader: {
    marginBottom: '20px',
  },
  chartTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },

  // Line Chart
  lineChartContainer: {
    display: 'flex',
    height: '220px',
  },
  chartYAxis: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: '16px',
    fontSize: '11px',
    color: '#8c9196',
    minWidth: '80px',
    textAlign: 'right',
  },
  chartAreaWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chartSvg: {
    width: '100%',
    height: '180px',
  },
  chartXAxis: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  xAxisLabel: {
    fontSize: '10px',
    color: '#8c9196',
  },

  // Bar Chart
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    height: '200px',
    paddingTop: '20px',
  },
  barWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: '40px',
    borderRadius: '4px 4px 0 0',
    minHeight: '4px',
  },
  barLabel: {
    fontSize: '10px',
    color: '#8c9196',
    marginTop: '8px',
  },
  barValue: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#303030',
    marginTop: '4px',
  },

  // Donut
  donutContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  donutEmpty: {
    borderRadius: '50%',
    backgroundColor: '#f6f6f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8c9196',
    fontSize: '12px',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '12px',
    color: '#6d7175',
    flex: 1,
    minWidth: '80px',
  },
  legendValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#303030',
  },

  // Horizontal Bars
  horizontalBarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  horizontalBarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  hBarRank: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#5C6AC4',
    width: '28px',
  },
  hBarName: {
    fontSize: '13px',
    color: '#303030',
    width: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hBarWrapper: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e1e3e5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  hBar: {
    height: '100%',
    borderRadius: '4px',
  },
  hBarValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    width: '100px',
    textAlign: 'right',
  },

  // Customer Bars
  customerBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  customerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  customerBarLabel: {
    fontSize: '13px',
    color: '#303030',
    width: '120px',
  },
  customerBarContainer: {
    flex: 1,
    height: '24px',
    backgroundColor: '#e1e3e5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  customerBarFill: {
    height: '100%',
    borderRadius: '4px',
  },
  customerBarValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
    width: '50px',
    textAlign: 'right',
  },

  // Funnel
  funnel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  funnelStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  funnelBar: {
    height: '40px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '16px',
    minWidth: '100px',
  },
  funnelLabel: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
  },
  funnelStats: {
    display: 'flex',
    gap: '12px',
  },
  funnelValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  funnelPercent: {
    fontSize: '13px',
    color: '#6d7175',
  },

  // Inventory
  inventoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  inventoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f6f6f7',
    borderRadius: '6px',
  },
  inventoryName: {
    fontSize: '13px',
    color: '#303030',
  },
  inventoryBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  inventorySummary: {
    display: 'flex',
    gap: '24px',
    fontSize: '13px',
    color: '#6d7175',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#8c9196',
    fontSize: '13px',
  },

  // Regions
  regionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  regionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  regionName: {
    fontSize: '13px',
    color: '#303030',
    width: '120px',
  },
  regionBarWrapper: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e1e3e5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  regionBar: {
    height: '100%',
    borderRadius: '4px',
  },
  regionValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    width: '90px',
    textAlign: 'right',
  },

  // Refunds
  refundStats: {
    display: 'flex',
    gap: '40px',
  },
  refundStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  refundStatLabel: {
    fontSize: '12px',
    color: '#6d7175',
  },
  refundStatValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#303030',
  },

  // Table
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e1e3e5',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #f1f1f1',
  },
  trEven: {
    backgroundColor: '#fafbfb',
  },

  // Status Grid
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fafbfb',
    borderRadius: '8px',
    border: '1px solid #e1e3e5',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusCount: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6d7175',
  },
};

export default Statistics;
