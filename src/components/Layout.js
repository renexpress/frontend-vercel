import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Salestics Flame Logo
const SalesticsLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 2C16 2 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 2 16 2Z" fill="#FF6B35"/>
    <path d="M16 8C16 8 12 13 12 17C12 19.2091 13.7909 21 16 21C18.2091 21 20 19.2091 20 17C20 13 16 8 16 8Z" fill="#FFB299"/>
  </svg>
);

// SVG Icons
const DashboardIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ScheduleIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ProductsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const OrdersIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const InvoicesIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const MessagesIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ShipmentsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const CampaignsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);

const EmployeesIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const ClientsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const StatisticsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PoshivIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#6B7280'} strokeWidth="2">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const ChevronIcon = ({ direction = 'down' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="2"
    style={{
      transform: direction === 'up' ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    }}
  >
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

function Layout({ children, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Главная', icon: DashboardIcon },
    { path: '/schedule', label: 'Расписание', icon: ScheduleIcon },
    { path: '/products', label: 'Товары', icon: ProductsIcon },
    { path: '/orders', label: 'Заказы', icon: OrdersIcon },
    { path: '/invoices', label: 'Счета', icon: InvoicesIcon },
    { path: '/clients', label: 'Клиенты', icon: ClientsIcon },
    { path: '/support', label: 'Сообщения', icon: MessagesIcon, badge: 6 },
    { path: '/poshiv-orders', label: 'Пошив', icon: PoshivIcon },
    { path: '/campaigns', label: 'Кампании', icon: CampaignsIcon },
    { path: '/statistics', label: 'Аналитика', icon: StatisticsIcon },
    { path: '/employees', label: 'Сотрудники', icon: EmployeesIcon },
  ];

  const isActive = (path) => {
    if (path === '/products') return location.pathname.startsWith('/products');
    if (path === '/orders') return location.pathname.startsWith('/orders');
    if (path === '/support') return location.pathname.startsWith('/support');
    if (path === '/poshiv-orders') return location.pathname.startsWith('/poshiv-orders');
    if (path === '/clients') return location.pathname.startsWith('/clients');
    if (path === '/statistics') return location.pathname.startsWith('/statistics');
    if (path === '/employees') return location.pathname.startsWith('/employees');
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/products')) return 'Товары';
    if (path.startsWith('/orders')) return 'Заказы';
    if (path.startsWith('/support')) return 'Сообщения';
    if (path.startsWith('/poshiv-orders')) return 'Пошив';
    if (path === '/dashboard') return 'Главная';
    if (path === '/schedule') return 'Расписание';
    if (path === '/invoices') return 'Счета';
    if (path === '/campaigns') return 'Кампании';
    if (path === '/clients') return 'Клиенты';
    if (path === '/statistics') return 'Статистика';
    return 'Главная';
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <SalesticsLogo />
          <span style={styles.logoText}>Salestics</span>
        </div>

        {/* Navigation */}
        <div style={styles.menuSection}>
          <ul style={styles.menuList}>
            {menuItems.map(item => {
              const active = isActive(item.path);
              const IconComponent = item.icon;
              return (
                <li key={item.path} style={styles.menuListItem}>
                  <button
                    onClick={() => navigate(item.path)}
                    style={{
                      ...styles.menuItem,
                      ...(active ? styles.menuItemActive : {})
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={styles.menuIcon}>
                      <IconComponent active={active} />
                    </span>
                    <span style={{
                      ...styles.menuText,
                      ...(active ? styles.menuTextActive : {})
                    }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={styles.menuBadge}>{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Discover New Features Card */}
        <div style={styles.promoCard}>
          <SalesticsLogo />
          <h4 style={styles.promoTitle}>Новые возможности!</h4>
          <p style={styles.promoText}>Откройте новые функции и выведите продажи на новый уровень</p>
          <button style={styles.promoBtn}>Улучшить план</button>
        </div>

        {/* Logout */}
        <div style={styles.logoutSection}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogoutIcon />
            <span>Выйти</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Top Header */}
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>{getPageTitle()}</h1>

          <div style={styles.headerRight}>
            {/* Search */}
            <div style={styles.searchBox}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Поиск..."
                style={styles.searchInput}
              />
            </div>

            {/* Notifications */}
            <button style={styles.iconButton}>
              <BellIcon />
              <span style={styles.notificationDot} />
            </button>

            {/* User Profile */}
            <div
              style={styles.userProfile}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                alt="User"
                style={styles.userAvatar}
              />
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.username || 'Rafael Williams'}</span>
                <span style={styles.userRole}>Admin</span>
              </div>
              <ChevronIcon direction={userMenuOpen ? 'up' : 'down'} />

              {userMenuOpen && (
                <div style={styles.userMenu}>
                  <button
                    onClick={handleLogout}
                    style={styles.userMenuItem}
                  >
                    <LogoutIcon />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    display: 'flex',
  },

  // Sidebar
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '260px',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #E8E8E8',
    zIndex: 100,
  },

  // Logo
  logoSection: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: '-0.5px',
  },

  // Menu
  menuSection: {
    flex: 1,
    padding: '8px 16px',
    overflowY: 'auto',
  },
  menuList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  menuListItem: {
    marginBottom: '4px',
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#FFF4F0',
    color: '#FF6B35',
  },
  menuIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuText: {
    flex: 1,
  },
  menuTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  menuBadge: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
  },

  // Promo Card
  promoCard: {
    margin: '16px',
    padding: '20px',
    backgroundColor: '#FFF4F0',
    borderRadius: '16px',
    textAlign: 'left',
  },
  promoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: '12px 0 8px 0',
  },
  promoText: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  promoBtn: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Logout
  logoutSection: {
    padding: '16px',
    borderTop: '1px solid #E8E8E8',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
  },

  // Main Content
  mainContent: {
    marginLeft: '260px',
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#FFFFFF',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E8E8E8',
    zIndex: 50,
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  // Search
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F5F5F7',
    borderRadius: '10px',
    padding: '10px 16px',
    width: '200px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1A1A1A',
    width: '100%',
  },

  // Icon Button
  iconButton: {
    position: 'relative',
    width: '40px',
    height: '40px',
    backgroundColor: '#F5F5F7',
    border: 'none',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  notificationDot: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '8px',
    height: '8px',
    backgroundColor: '#FF6B35',
    borderRadius: '50%',
    border: '2px solid #FFFFFF',
  },

  // User Profile
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userRole: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  userMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E8E8E8',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    minWidth: '150px',
    zIndex: 100,
  },
  userMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#EF4444',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Content
  content: {
    flex: 1,
    padding: '0',
    backgroundColor: '#F5F5F7',
  },
};

export default Layout;
