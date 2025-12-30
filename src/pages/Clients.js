import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UsersIcon = ({ color = "#6366f1" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const CheckCircleIcon = ({ color = "#10b981" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const BuildingIcon = ({ color = "#f59e0b" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
    <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
    <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

const ShoppingBagIcon = ({ color = "#8b5cf6" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

const XCircleIcon = ({ color = "#ef4444" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, companies: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      setStats({
        total: clients.length,
        active: clients.filter(c => c.is_active).length,
        inactive: clients.filter(c => !c.is_active).length,
        companies: clients.filter(c => c.company_name).length
      });
    }
  }, [clients]);

  const fetchData = async () => {
    try {
      const [clientsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/clients/`),
        axios.get(`${API_URL}/orders/`)
      ]);
      setClients(clientsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientOrderCount = (clientId) => {
    return orders.filter(o => o.client === clientId).length;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === 'active') return matchesSearch && client.is_active;
    if (filter === 'inactive') return matchesSearch && !client.is_active;
    if (filter === 'companies') return matchesSearch && client.company_name;
    return matchesSearch;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarGradient = (id) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    return gradients[id % gradients.length];
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Клиенты</h1>
          <p style={styles.subtitle}>Управление клиентской базой</p>
        </div>
        <button
          onClick={() => navigate('/clients/add')}
          style={styles.addButton}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <PlusIcon />
          Добавить клиента
        </button>
      </div>

      {/* Stats Bar - Horizontal like in the design */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <div style={{...styles.statIconBox, backgroundColor: '#eef2ff'}}>
            <UsersIcon color="#6366f1" />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.total}</span>
            <span style={styles.statLabel}>Всего клиентов</span>
          </div>
        </div>

        <div style={styles.statDivider} />

        <div style={styles.statItem}>
          <div style={{...styles.statIconBox, backgroundColor: '#ecfdf5'}}>
            <CheckCircleIcon color="#10b981" />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.active}</span>
            <span style={styles.statLabel}>Активных</span>
          </div>
        </div>

        <div style={styles.statDivider} />

        <div style={styles.statItem}>
          <div style={{...styles.statIconBox, backgroundColor: '#fef2f2'}}>
            <XCircleIcon color="#ef4444" />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.inactive}</span>
            <span style={styles.statLabel}>Неактивных</span>
          </div>
        </div>

        <div style={styles.statDivider} />

        <div style={styles.statItem}>
          <div style={{...styles.statIconBox, backgroundColor: '#fffbeb'}}>
            <BuildingIcon color="#f59e0b" />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{stats.companies}</span>
            <span style={styles.statLabel}>С компанией</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, логину или компании..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterButtons}>
          {[
            { key: 'all', label: 'Все', count: stats.total },
            { key: 'active', label: 'Активные', count: stats.active },
            { key: 'inactive', label: 'Неактивные', count: stats.inactive },
            { key: 'companies', label: 'Компании', count: stats.companies }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                ...styles.filterBtn,
                ...(filter === f.key ? styles.filterBtnActive : {})
              }}
            >
              {f.label}
              <span style={{
                ...styles.filterCount,
                backgroundColor: filter === f.key ? '#6366f1' : '#e5e7eb',
                color: filter === f.key ? 'white' : '#6b7280'
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Список клиентов</h3>
          <span style={styles.resultCount}>
            Показано {filteredClients.length} из {clients.length}
          </span>
        </div>

        {filteredClients.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <UsersIcon color="#9ca3af" />
            </div>
            <p style={styles.emptyTitle}>Клиенты не найдены</p>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Клиент</th>
                <th style={styles.th}>Контакты</th>
                <th style={styles.th}>Компания</th>
                <th style={styles.th}>Город</th>
                <th style={{...styles.th, textAlign: 'center'}}>Заказов</th>
                <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
                <th style={{...styles.th, width: '40px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  style={styles.tr}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.querySelector('.chevron').style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.querySelector('.chevron').style.opacity = '0';
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.clientCell}>
                      <div style={{
                        ...styles.avatar,
                        background: getAvatarGradient(client.id)
                      }}>
                        {getInitials(client.full_name)}
                      </div>
                      <div style={styles.clientInfo}>
                        <span style={styles.clientName}>{client.full_name}</span>
                        <span style={styles.usernameBadge}>{client.username}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.contactInfo}>
                      <div style={styles.contactRow}>
                        <PhoneIcon />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div style={styles.contactRow}>
                          <MailIcon />
                          <span style={styles.emailText}>{client.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {client.company_name ? (
                      <div style={styles.companyBadge}>
                        <BuildingIcon color="#f59e0b" />
                        <span>{client.company_name}</span>
                      </div>
                    ) : (
                      <span style={styles.noData}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {client.city ? (
                      <div style={styles.cityBadge}>
                        <MapPinIcon />
                        <span>{client.city}</span>
                      </div>
                    ) : (
                      <span style={styles.noData}>—</span>
                    )}
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <div style={styles.ordersBadge}>
                      <ShoppingBagIcon color="#8b5cf6" />
                      <span>{getClientOrderCount(client.id)}</span>
                    </div>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: client.is_active ? '#ecfdf5' : '#fef2f2',
                      color: client.is_active ? '#059669' : '#dc2626'
                    }}>
                      <span style={{
                        ...styles.statusDot,
                        backgroundColor: client.is_active ? '#10b981' : '#ef4444'
                      }} />
                      {client.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span className="chevron" style={styles.chevron}>
                      <ChevronRightIcon />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 40px',
    maxWidth: '1400px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },

  // Stats Bar - Horizontal
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px 32px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  statIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e2e8f0',
    margin: '0 24px',
  },

  // Filters
  filtersCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    transition: 'border-color 0.2s ease',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    backgroundColor: '#eef2ff',
    color: '#6366f1',
  },
  filterCount: {
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },

  // Table
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  resultCount: {
    fontSize: '13px',
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#475569',
  },
  clientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    flexShrink: 0,
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  clientName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '14px',
  },
  usernameBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#f1f5f9',
    color: '#6366f1',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    width: 'fit-content',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569',
  },
  emailText: {
    color: '#64748b',
    fontSize: '12px',
  },
  companyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#b45309',
    fontWeight: '500',
  },
  cityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#64748b',
  },
  ordersBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#f5f3ff',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#7c3aed',
    fontWeight: '600',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  noData: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  chevron: {
    opacity: 0,
    transition: 'opacity 0.15s ease',
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    padding: '80px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
};

export default Clients;
