import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Layout({ children, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Check if any subpage is active for a menu item
  const isItemOrSubActive = (item) => {
    if (isActive(item.path)) return true;
    if (item.subs) {
      return item.subs.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    }
    return false;
  };

  const c = '#303030';

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
  };

  const items = [
    { id: 'home', path: '/', label: 'Главная', icon: 'home' },
    { id: 'orders', path: '/orders', label: 'Заказы', icon: 'orders', subs: [{ label: 'Пошив заказы', path: '/poshiv-orders', icon: 'scissors' }] },
    { id: 'products', path: '/products', label: 'Товары', icon: 'products', subs: [{ label: 'Черновики', path: '/products/drafts', icon: 'draft' }, { label: 'Товары пользователей', path: '/user-products', icon: 'users' }] },
    { id: 'customers', path: '/clients', label: 'Клиенты', icon: 'customers' },
    { id: 'marketing', path: '/marketing', label: 'Маркетинг', icon: 'marketing' },
    { id: 'discounts', path: '/discounts', label: 'Скидки', icon: 'discounts' },
    { id: 'content', path: '/content', label: 'Контент', icon: 'content' },
    { id: 'markets', path: '/markets', label: 'Рынки', icon: 'markets' },
    { id: 'analytics', path: '/statistics', label: 'Аналитика', icon: 'analytics' },
  ];

  const subIcons = {
    draft: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="#616161">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="#616161">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
      </svg>
    ),
    scissors: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#616161" strokeWidth="2">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  };

  const NavItem = ({ id, path, label, icon, active }) => (
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
        background: active ? '#fff' : hovered === id ? '#ebebeb' : 'transparent',
        boxShadow: active ? '0 1px 1px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {icons[icon]}
      <span style={{ fontSize: 14, color: '#303030', fontWeight: 500 }}>{label}</span>
    </div>
  );

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
        color: active ? '#303030' : '#616161',
        cursor: 'pointer',
        fontWeight: active ? 500 : 400,
        borderRadius: 6,
        backgroundColor: active ? '#fff' : hovered === `sub-${path}` ? '#ebebeb' : 'transparent',
        boxShadow: active ? '0 1px 1px rgba(0,0,0,0.06)' : 'none',
        margin: '1px 0',
      }}
    >
      {icon && subIcons[icon]}
      <span>{label}</span>
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
        color: '#616161',
        fontWeight: 400,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <svg width="8" height="8" viewBox="0 0 8 8">
        <path d="M2 1l4 3-4 3" fill="none" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="32" height="32">
            <rect width="32" height="32" rx="8" fill="#000"/>
            <text x="16" y="21" fontFamily="Arial" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">R</text>
          </svg>
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>renexpress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#303030', borderRadius: 8, padding: '8px 12px', width: 480 }}>
          <svg width="16" height="16" viewBox="0 0 20 20">
            <circle cx="9" cy="9" r="6" fill="none" stroke="#808080" strokeWidth="1.5"/>
            <path d="M13.5 13.5l4 4" stroke="#808080" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#808080', fontSize: 14, flex: 1 }}>Поиск</span>
          <span style={{ background: '#4a4a4a', color: '#909090', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>⌘</span>
          <span style={{ background: '#4a4a4a', color: '#909090', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>K</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#36b37e', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>RE</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#f6f6f7', borderTopLeftRadius: 16, borderTopRightRadius: 16, display: 'flex' }}>
        {/* Sidebar */}
        <div style={{ width: 240, height: '100%', background: '#f6f6f7', padding: '8px', display: 'flex', flexDirection: 'column' }}>
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
            <SectionLabel label="Каналы продаж" />
            <NavItem id="store" path="/store" label="Интернет-магазин" icon="store" active={isActive('/store')} />
            <SectionLabel label="Приложения" />
            <NavItem id="add" path="/add" label="Добавить" icon="add" active={false} />
          </div>
          <NavItem id="settings" path="/settings" label="Настройки" icon="settings" active={isActive('/settings')} />
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: '0 8px 8px 0', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
