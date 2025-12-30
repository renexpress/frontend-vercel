import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

// Icons
const DollarIcon = ({ color = '#6B7280' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const OrdersIcon = ({ color = '#6B7280' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const GrowthIcon = ({ color = '#6B7280' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" />
    <polyline points="17,18 23,18 23,12" />
  </svg>
);

const PackageIcon = ({ color = '#6B7280' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const TruckIcon = ({ color = '#6B7280' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const CheckIcon = ({ color = '#6B7280' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const UsersIcon = ({ color = '#6B7280' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

const STATUS_CONFIG = {
  awaiting_payment: { label: 'Ожидает оплаты', color: '#F59E0B', bg: '#FEF3C7' },
  istanbul_warehouse: { label: 'Склад Стамбул', color: '#3B82F6', bg: '#DBEAFE' },
  to_moscow: { label: 'В пути', color: '#8B5CF6', bg: '#EDE9FE' },
  moscow_warehouse: { label: 'Склад Москва', color: '#06B6D4', bg: '#CFFAFE' },
  to_address: { label: 'Доставляется', color: '#FF6B35', bg: '#FFF4F0' },
  delivered: { label: 'Доставлен', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Отменён', color: '#EF4444', bg: '#FEE2E2' },
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    totalClients: 0,
    newClients: 0,
    lowStockProducts: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, clientsRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/orders/`).then(r => r.json()),
        fetch(`${API_URL}/clients/`).then(r => r.json()),
        fetch(`${API_URL}/products/`).then(r => r.json()),
      ]);

      const pendingStatuses = ['awaiting_payment'];
      const processingStatuses = ['istanbul_warehouse', 'to_moscow', 'moscow_warehouse', 'to_address'];
      const deliveredStatuses = ['delivered'];

      const pendingOrders = ordersRes.filter(o => pendingStatuses.includes(o.status)).length;
      const processingOrders = ordersRes.filter(o => processingStatuses.includes(o.status)).length;
      const deliveredOrders = ordersRes.filter(o => deliveredStatuses.includes(o.status)).length;

      const totalRevenue = ordersRes.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevenue = ordersRes
        .filter(o => new Date(o.created_at) >= monthStart)
        .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const newClients = clientsRes.filter(c => new Date(c.created_at) >= monthStart).length;
      const lowStockProducts = productsRes.filter(p => (p.stock || 0) < 10).length;

      setStats({
        totalOrders: ordersRes.length,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalRevenue,
        monthRevenue,
        totalClients: clientsRes.length,
        newClients,
        lowStockProducts,
        totalProducts: productsRes.length,
      });

      const sortedOrders = [...ordersRes].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);
      setRecentOrders(sortedOrders);

      setTopProducts(productsRes.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getStatusInfo = (status) => {
    return STATUS_CONFIG[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
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
      {/* Stats Cards Row */}
      <div style={styles.statsGrid}>
        {/* Total Revenue */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.statIcon, backgroundColor: '#DBEAFE'}}>
              <DollarIcon color="#3B82F6" />
            </div>
            <span style={styles.statMore}>...</span>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Общий доход</span>
            <span style={styles.statValue}>{formatMoney(stats.totalRevenue)}</span>
          </div>
          <div style={styles.statTrend}>
            <TrendUpIcon />
            <span style={styles.trendUp}>+2.34%</span>
            <span style={styles.trendLabel}>за неделю</span>
          </div>
        </div>

        {/* Total Orders */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.statIcon, backgroundColor: '#FFF4F0'}}>
              <OrdersIcon color="#FF6B35" />
            </div>
            <span style={styles.statMore}>...</span>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Всего заказов</span>
            <span style={styles.statValue}>{formatNumber(stats.totalOrders)}</span>
          </div>
          <div style={styles.statTrend}>
            <TrendUpIcon />
            <span style={styles.trendUp}>+2.34%</span>
            <span style={styles.trendLabel}>за неделю</span>
          </div>
        </div>

        {/* Monthly Growth */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.statIcon, backgroundColor: '#D1FAE5'}}>
              <GrowthIcon color="#10B981" />
            </div>
            <span style={styles.statMore}>...</span>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Месячный рост</span>
            <span style={styles.statValue}>13%</span>
          </div>
          <div style={styles.statTrend}>
            <TrendDownIcon />
            <span style={styles.trendDown}>-4.05%</span>
            <span style={styles.trendLabel}>за неделю</span>
          </div>
        </div>

        {/* Clients */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.statIcon, backgroundColor: '#EDE9FE'}}>
              <UsersIcon color="#8B5CF6" />
            </div>
            <span style={styles.statMore}>...</span>
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>Всего клиентов</span>
            <span style={styles.statValue}>{formatNumber(stats.totalClients)}</span>
          </div>
          <div style={styles.statTrend}>
            <TrendUpIcon />
            <span style={styles.trendUp}>+{stats.newClients}</span>
            <span style={styles.trendLabel}>за месяц</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={styles.mainGrid}>
        {/* Sales Overview */}
        <div style={styles.salesOverview}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Обзор продаж</h3>
            <select style={styles.select}>
              <option>Последние 8 месяцев</option>
              <option>Последние 12 месяцев</option>
            </select>
          </div>

          {/* Earnings Summary */}
          <div style={styles.earningsRow}>
            <div>
              <span style={styles.earningsLabel}>Общий доход</span>
              <div style={styles.earningsValue}>
                <span style={styles.earningsAmount}>{formatMoney(stats.totalRevenue)}</span>
                <span style={styles.earningsChange}>+2.34%</span>
              </div>
            </div>
            <div>
              <span style={styles.earningsLabel}>За этот месяц</span>
              <div style={styles.earningsValue}>
                <span style={styles.earningsAmount}>{formatMoney(stats.monthRevenue)}</span>
              </div>
            </div>
            <div style={styles.legendRow}>
              <span style={styles.legendItem}><span style={{...styles.legendDot, backgroundColor: '#FF6B35'}}></span> Доход</span>
              <span style={styles.legendItem}><span style={{...styles.legendDot, backgroundColor: '#FFD4C4'}}></span> Расходы</span>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartBars}>
              {[40, 55, 45, 65, 80, 60, 45, 50].map((height, i) => (
                <div key={i} style={styles.barGroup}>
                  <div style={{...styles.bar, height: `${height}%`, backgroundColor: '#FF6B35'}}></div>
                  <div style={{...styles.bar, height: `${height * 0.6}%`, backgroundColor: '#FFD4C4'}}></div>
                </div>
              ))}
            </div>
            <div style={styles.chartLabels}>
              {['Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Cards */}
        <div style={styles.rightColumn}>
          {/* Sales Activity */}
          <div style={styles.activityCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Статус заказов</h3>
              <span style={styles.statMore}>...</span>
            </div>
            <div style={styles.activityGrid}>
              <div style={styles.activityItem}>
                <div style={{...styles.activityIcon, backgroundColor: '#DBEAFE'}}>
                  <PackageIcon color="#3B82F6" />
                </div>
                <div style={styles.activityInfo}>
                  <span style={styles.activityValue}>{stats.pendingOrders}</span>
                  <span style={styles.activityLabel}>Ожидают</span>
                </div>
              </div>
              <div style={styles.activityItem}>
                <div style={{...styles.activityIcon, backgroundColor: '#D1FAE5'}}>
                  <CheckIcon color="#10B981" />
                </div>
                <div style={styles.activityInfo}>
                  <span style={styles.activityValue}>{stats.deliveredOrders}</span>
                  <span style={styles.activityLabel}>Доставлено</span>
                </div>
              </div>
              <div style={styles.activityItem}>
                <div style={{...styles.activityIcon, backgroundColor: '#FEF3C7'}}>
                  <TruckIcon color="#F59E0B" />
                </div>
                <div style={styles.activityInfo}>
                  <span style={styles.activityValue}>{stats.processingOrders}</span>
                  <span style={styles.activityLabel}>В пути</span>
                </div>
              </div>
              <div style={styles.activityItem}>
                <div style={{...styles.activityIcon, backgroundColor: '#EDE9FE'}}>
                  <DollarIcon color="#8B5CF6" />
                </div>
                <div style={styles.activityInfo}>
                  <span style={styles.activityValue}>{stats.totalOrders}</span>
                  <span style={styles.activityLabel}>Всего</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Growth */}
          <div style={styles.growthCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Рост клиентов</h3>
              <span style={styles.statMore}>...</span>
            </div>
            <div style={styles.growthContent}>
              <div style={styles.growthPercent}>
                <span style={styles.growthValue}>83%</span>
                <span style={styles.growthChange}>+2%</span>
              </div>
              <span style={styles.growthLabel}>за прошлый месяц</span>
              <div style={styles.growthBar}>
                <div style={styles.growthProgress}></div>
              </div>
              <div style={styles.growthTotal}>
                <UsersIcon color="#6B7280" />
                <span>{formatNumber(stats.totalClients)} (+{stats.newClients} новых)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={styles.recentOrdersCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Последние заказы</h3>
          <button onClick={() => navigate('/orders')} style={styles.viewAllBtn}>
            Все заказы <ArrowRightIcon />
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>№ Заказа</th>
              <th style={styles.th}>Клиент</th>
              <th style={styles.th}>Дата</th>
              <th style={styles.th}>Сумма</th>
              <th style={styles.th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <tr
                  key={order.id}
                  style={styles.tr}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td style={styles.td}>
                    <span style={styles.orderId}>#{order.order_number}</span>
                  </td>
                  <td style={styles.td}>{order.client_name}</td>
                  <td style={styles.td}>
                    {new Date(order.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.amount}>{formatMoney(order.total_amount)}</span>
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
      </div>

      {/* Top Products */}
      <div style={styles.productsCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Популярные товары</h3>
          <button onClick={() => navigate('/products')} style={styles.viewAllBtn}>
            Все товары <ArrowRightIcon />
          </button>
        </div>
        <div style={styles.productsList}>
          {topProducts.map((product) => (
            <div
              key={product.id}
              style={styles.productItem}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div style={styles.productThumb}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0].image_url} alt={product.name} style={styles.productImg} />
                ) : (
                  <PackageIcon color="#9CA3AF" />
                )}
              </div>
              <div style={styles.productInfo}>
                <span style={styles.productName}>{product.name}</span>
                <span style={styles.productCategory}>{product.category_name || 'Без категории'}</span>
              </div>
              <span style={styles.productPrice}>{formatMoney(product.retail_price || product.price || 0)}</span>
            </div>
          ))}
        </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statMore: {
    color: '#9CA3AF',
    fontSize: '20px',
    cursor: 'pointer',
  },
  statBody: {
    marginBottom: '12px',
  },
  statLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  trendUp: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#10B981',
  },
  trendDown: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#EF4444',
  },
  trendLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
  },

  // Main Grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },

  // Sales Overview
  salesOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: 0,
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #E8E8E8',
    fontSize: '13px',
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  earningsRow: {
    display: 'flex',
    gap: '40px',
    marginBottom: '24px',
    alignItems: 'flex-end',
  },
  earningsLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  earningsValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  earningsAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  earningsChange: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    marginLeft: 'auto',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6B7280',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  // Chart
  chartPlaceholder: {
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
  },
  chartBars: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    padding: '0 20px',
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    gap: '4px',
    alignItems: 'flex-end',
  },
  bar: {
    flex: 1,
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '12px',
    borderTop: '1px solid #F5F5F7',
    fontSize: '12px',
    color: '#9CA3AF',
  },

  // Right Column
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  activityIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  activityValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  activityLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
  },

  // Growth Card
  growthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  growthContent: {
    textAlign: 'center',
  },
  growthPercent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  growthValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  growthChange: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  growthLabel: {
    fontSize: '13px',
    color: '#9CA3AF',
    marginBottom: '16px',
    display: 'block',
  },
  growthBar: {
    height: '8px',
    backgroundColor: '#F5F5F7',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  growthProgress: {
    height: '100%',
    width: '83%',
    backgroundColor: '#FF6B35',
    borderRadius: '4px',
  },
  growthTotal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#6B7280',
  },

  // Recent Orders
  recentOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '24px',
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#FF6B35',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
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
    color: '#9CA3AF',
    textTransform: 'uppercase',
    borderBottom: '1px solid #F5F5F7',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #F5F5F7',
    fontSize: '14px',
    color: '#1A1A1A',
  },
  orderId: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  amount: {
    fontWeight: '600',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },

  // Products
  productsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  productItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 0',
    borderBottom: '1px solid #F5F5F7',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  productThumb: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#F5F5F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  productName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1A1A1A',
  },
  productCategory: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  productPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF6B35',
  },
};

export default Dashboard;
