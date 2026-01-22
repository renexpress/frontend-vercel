import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Layout({ children, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if current user is main admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isMainAdmin = user.is_main_admin === true;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Check if any subpage is active for a menu item
  const isItemOrSubActive = (item) => {
    if (isActive(item.path)) return true;
    if (item.subs) {
      return item.subs.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const PRIMARY = '#2AABAB';
  const c = '#2AABAB';

  const icons = {
    home: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
      </svg>
    ),
    orders: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 9l-9 8z"/>
      </svg>
    ),
    products: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill={c}>
        <path fillRule="evenodd" d="M2.5 2a1.5 1.5 0 00-1.5 1.5v4.586a1.5 1.5 0 00.44 1.06l6.998 7a1.5 1.5 0 002.121 0l4.586-4.586a1.5 1.5 0 000-2.121l-7-6.999a1.5 1.5 0 00-1.06-.44H2.5zm3.25 5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"/>
      </svg>
    ),
    customers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>
      </svg>
    ),
    marketing: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>
      </svg>
    ),
    discounts: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M7.5 9.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.9 3.6l1.4 1.4 11.3-11.3-1.4-1.4-11.3 11.3z"/>
      </svg>
    ),
    content: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    ),
    markets: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 17.9c-3.9-.5-7-3.9-7-7.9 0-.6.1-1.2.2-1.8L9 15v1c0 1.1.9 2 2 2v1.9zm6.9-2.5c-.3-.8-1-1.4-1.9-1.4h-1v-3c0-.6-.4-1-1-1H8v-2h2c.6 0 1-.4 1-1V7h2c1.1 0 2-.9 2-2v-.4c2.9 1.2 5 4.1 5 7.4 0 2.1-.8 4-2.1 5.4z"/>
      </svg>
    ),
    analytics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
      </svg>
    ),
    support: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    ),
    store: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
      </svg>
    ),
    add: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M19.1 12.9a7 7 0 000-1.8l1.9-1.5c.2-.1.2-.4.1-.6l-1.8-3.1c-.1-.2-.4-.3-.6-.2l-2.2.9a7 7 0 00-1.6-.9l-.3-2.4c0-.2-.3-.4-.5-.4h-3.6c-.3 0-.5.2-.5.4l-.3 2.4c-.6.2-1.1.5-1.6.9l-2.2-.9c-.2-.1-.5 0-.6.2L3 9c-.1.2-.1.5.1.6l1.9 1.5a7 7 0 000 1.8l-1.9 1.5c-.2.1-.2.4-.1.6l1.8 3.1c.1.2.4.3.6.2l2.2-.9c.5.4 1 .7 1.6.9l.3 2.4c0 .2.3.4.5.4h3.6c.3 0 .5-.2.5-.4l.3-2.4c.6-.2 1.1-.5 1.6-.9l2.2.9c.2.1.5 0 .6-.2l1.8-3.1c.1-.2.1-.5-.1-.6l-1.9-1.5zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
      </svg>
    ),
    employees: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    deliveries: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    ),
    admins: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    ),
    kurs: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
        <path d="M12.89 11.1c-1.78-.59-2.64-.96-2.64-1.9 0-1.02 1.11-1.39 1.81-1.39 1.31 0 1.79.99 1.9 1.34l1.58-.67c-.15-.45-.82-1.92-2.54-2.24V5h-2v1.26c-2.48.56-2.49 2.86-2.49 2.96 0 2.27 2.25 2.91 3.35 3.31 1.58.56 2.28 1.07 2.28 2.03 0 1.13-1.05 1.61-1.98 1.61-1.82 0-2.34-1.87-2.4-2.09l-1.66.67c.63 2.19 2.28 2.78 2.9 2.96V19h2v-1.24c.4-.09 2.9-.59 2.9-3.22 0-1.39-.61-2.61-3.01-3.44zM3 21H1v-6h6v2H4.52c1.61 2.41 4.36 4 7.48 4 4.97 0 9-4.03 9-9h2c0 6.08-4.92 11-11 11-3.72 0-7.01-1.85-9-4.67V21zm-2-9C1 5.92 5.92 1 12 1c3.72 0 7.01 1.85 9 4.67V3h2v6h-6V7h2.48C17.87 4.59 15.12 3 12 3c-4.97 0-9 4.03-9 9H1z"/>
      </svg>
    ),
  };

  const items = [
    { id: 'home', path: '/', label: 'Главная', icon: 'home' },
    { id: 'deliveries', path: '/deliveries', label: 'Доставки', icon: 'deliveries' },
    { id: 'kurs', path: '/kurs', label: 'Курс', icon: 'kurs' },
    { id: 'customers', path: '/clients', label: 'Клиенты', icon: 'customers' },
    ...(isMainAdmin ? [{ id: 'admins', path: '/admins', label: 'Администраторы', icon: 'admins' }] : []),
    { id: 'support', path: '/support', label: 'Поддержка', icon: 'support' },
  ];

  const getSubIcon = (icon, active) => {
    const color = active ? '#fff' : '#000';
    const icons = {
      draft: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill={color}>
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
      ),
      users: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill={color}>
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      ),
      scissors: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      ),
    };
    return icons[icon] || null;
  };

  const NavItem = ({ id, path, label, icon, active }) => {
    // eslint-disable-next-line no-unused-vars
    const iconWithColor = icons[icon] ? React.cloneElement(icons[icon], {
      props: { ...icons[icon].props },
      children: React.Children.map(icons[icon].props.children, child =>
        child ? React.cloneElement(child, { fill: active ? '#fff' : PRIMARY }) : child
      )
    }) : null;

    return (
      <div
        onClick={() => navigate(path)}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 10px',
          margin: '1px 0',
          borderRadius: 8,
          cursor: 'pointer',
          background: active ? 'linear-gradient(to right, #2AABAB, #0a2535)' : hovered === id ? '#E0F5F5' : 'transparent',
          boxShadow: active ? '0 1px 3px rgba(42,171,171,0.3)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox={icons[icon]?.props?.viewBox || "0 0 24 24"} fill={active ? '#fff' : '#000'}>
          {icons[icon]?.props?.children}
        </svg>
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          ...(active ? { color: '#fff' } : {
            background: 'linear-gradient(to right, #2AABAB, #0a2535)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          })
        }}>{label}</span>
      </div>
    );
  };

  const SubItem = ({ label, path, icon, active }) => (
    <div
      onClick={(e) => { e.stopPropagation(); navigate(path); }}
      onMouseEnter={() => setHovered(`sub-${path}`)}
      onMouseLeave={() => setHovered(null)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px 5px 38px',
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 500 : 400,
        borderRadius: 6,
        background: active ? 'linear-gradient(to right, #2AABAB, #0a2535)' : hovered === `sub-${path}` ? '#E0F5F5' : 'transparent',
        boxShadow: active ? '0 1px 3px rgba(42,171,171,0.3)' : 'none',
        margin: '1px 0',
      }}
    >
      {icon && getSubIcon(icon, active)}
      <span style={{
        ...(active ? { color: '#fff' } : {
          background: 'linear-gradient(to right, #2AABAB, #0a2535)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        })
      }}>{label}</span>
    </div>
  );

  const SectionLabel = ({ label }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: '16px 10px 6px',
        fontSize: 12,
        color: PRIMARY,
        fontWeight: 400,
        cursor: 'pointer',
        opacity: 0.7,
      }}
    >
      <span>{label}</span>
      <svg width="8" height="8" viewBox="0 0 8 8">
        <path d="M2 1l4 3-4 3" fill="none" stroke={PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to right, #2AABAB, #2AABAB, #0a2535)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(to right, #2AABAB, #2AABAB, #0a2535)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="32" height="32">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2AABAB"/>
                <stop offset="100%" stopColor="#0a2535"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logoGradient)"/>
            <text x="16" y="16" fontFamily="Arial" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle" dominantBaseline="central">R</text>
          </svg>
          <span style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '-0.3px',
            background: 'linear-gradient(to right, #1a7a7a, #061215)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>RENCARGO CRM</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(to right, #2AABAB, #0a2535)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              transform: showUserMenu ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            REN
          </div>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                onClick={() => setShowUserMenu(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 200,
                backgroundColor: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid #e1e3e5',
                overflow: 'hidden',
                zIndex: 100,
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #e1e3e5',
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>{user.full_name || 'Администратор'}</div>
                  <div style={{ fontSize: 12, color: '#000', marginTop: 2 }}>{isMainAdmin ? 'Главный администратор' : 'Администратор'}</div>
                </div>
                <div
                  onClick={handleLogout}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f6f6f7'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DE3618" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#DE3618', fontWeight: 500 }}>Выйти</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#f6f6f7', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 240, height: '100%', background: '#f6f6f7', padding: '8px', paddingTop: '16px', display: 'flex', flexDirection: 'column', borderTopLeftRadius: 24 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.map(item => {
              const itemActive = isItemOrSubActive(item);
              const showSubs = item.subs && itemActive;
              return (
                <div key={item.id}>
                  <NavItem {...item} active={itemActive} />
                  {showSubs && item.subs.map((s, i) => (
                    <SubItem
                      key={i}
                      label={s.label || s}
                      path={s.path}
                      icon={s.icon}
                      active={s.path && isActive(s.path)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <NavItem id="settings" path="/settings" label="Настройки" icon="settings" active={isActive('/settings')} />
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: '8px 8px 8px 0', overflowY: 'auto', borderTopRightRadius: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
