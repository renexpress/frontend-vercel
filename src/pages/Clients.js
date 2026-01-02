import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const sortRef = useRef(null);

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'inactive', label: 'Неактивные' },
    { id: 'companies', label: 'Компании' },
  ];

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'name_asc', label: 'Имя А-Я' },
    { id: 'name_desc', label: 'Имя Я-А' },
    { id: 'orders_desc', label: 'Больше заказов' },
    { id: 'orders_asc', label: 'Меньше заказов' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'all': return clients.length;
      case 'active': return clients.filter(c => c.is_active).length;
      case 'inactive': return clients.filter(c => !c.is_active).length;
      case 'companies': return clients.filter(c => c.company_name).length;
      default: return 0;
    }
  };

  const filteredClients = clients
    .filter(client => {
      const matchesSearch =
        (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone || '').includes(searchTerm) ||
        (client.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (activeTab === 'active') return matchesSearch && client.is_active;
      if (activeTab === 'inactive') return matchesSearch && !client.is_active;
      if (activeTab === 'companies') return matchesSearch && client.company_name;
      return matchesSearch;
    })
    .sort((a, b) => {
      const aOrders = getClientOrderCount(a.id);
      const bOrders = getClientOrderCount(b.id);
      switch (sortBy) {
        case 'created_asc': return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc': return new Date(b.created_at) - new Date(a.created_at);
        case 'name_asc': return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name_desc': return (b.full_name || '').localeCompare(a.full_name || '');
        case 'orders_desc': return bOrders - aOrders;
        case 'orders_asc': return aOrders - bOrders;
        default: return 0;
      }
    });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
        <h1 style={styles.title}>Клиенты</h1>
        <button
          style={{
            ...styles.addBtn,
            backgroundColor: hoveredBtn === 'add' ? '#1a1a1a' : '#303030',
            transform: hoveredBtn === 'add' ? 'translateY(-1px)' : 'none',
          }}
          onClick={() => navigate('/clients/add')}
          onMouseEnter={() => setHoveredBtn('add')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          Добавить клиента
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

      {/* Search & Filters Panel */}
      <div style={styles.filtersPanel}>
        <div style={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Поиск по имени, телефону, логину..."
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

        <div style={styles.filterActions}>
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
      </div>

      {/* Results count */}
      <div style={styles.resultsRow}>
        <span style={styles.resultsText}>
          {filteredClients.length} {filteredClients.length === 1 ? 'клиент' : 'клиентов'}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredClients.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 20 20" fill="#c9cccf">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
            </svg>
            <h3 style={styles.emptyTitle}>Клиенты не найдены</h3>
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
                <th style={styles.th}>Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const orderCount = getClientOrderCount(client.id);
                return (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    style={{
                      ...styles.tr,
                      backgroundColor: hoveredRow === client.id ? '#f6f6f7' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRow(client.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>
                      <div style={styles.clientCell}>
                        <div style={styles.avatar}>
                          {getInitials(client.full_name)}
                        </div>
                        <div style={styles.clientInfo}>
                          <span style={styles.clientName}>{client.full_name || '—'}</span>
                          <span style={styles.username}>{client.username}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.contactInfo}>
                        <div style={styles.contactRow}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                          <span>{client.phone}</span>
                        </div>
                        {client.email && (
                          <div style={styles.contactRow}>
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            <span style={styles.emailText}>{client.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {client.company_name ? (
                        <span style={styles.companyBadge}>{client.company_name}</span>
                      ) : (
                        <span style={styles.noData}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {client.city ? (
                        <div style={styles.cityCell}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <span>{client.city}</span>
                        </div>
                      ) : (
                        <span style={styles.noData}>—</span>
                      )}
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <span style={{
                        ...styles.ordersBadge,
                        backgroundColor: orderCount > 0 ? '#e3f4e8' : '#f6f6f7',
                        color: orderCount > 0 ? '#1a7f37' : '#6d7175',
                      }}>
                        {orderCount}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: client.is_active ? '#e3f4e8' : '#fef2f2',
                        color: client.is_active ? '#1a7f37' : '#d72c0d',
                      }}>
                        <span style={{
                          ...styles.statusDot,
                          backgroundColor: client.is_active ? '#1a7f37' : '#d72c0d',
                        }}/>
                        {client.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formatDate(client.created_at)}</span>
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
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#303030',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'all 0.15s',
  },

  // Tabs
  tabsRow: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #e1e3e5',
    marginBottom: '16px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '-1px',
  },
  tabCount: {
    padding: '2px 8px',
    borderRadius: '10px',
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
  filterActions: {
    display: 'flex',
    gap: '8px',
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
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    borderBottom: '1px solid #f1f1f1',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#303030',
    verticalAlign: 'middle',
  },

  // Client Cell
  clientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  username: {
    fontSize: '12px',
    color: '#8c9196',
    fontFamily: 'monospace',
  },

  // Contact Info
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#303030',
  },
  emailText: {
    color: '#6d7175',
    fontSize: '12px',
  },

  // Badges
  companyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: '#fff8e6',
    border: '1px solid #f0d78c',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#b88c1a',
  },
  cityCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6d7175',
  },
  ordersBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '32px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  dateText: {
    fontSize: '12px',
    color: '#6d7175',
  },
  noData: {
    color: '#c9cccf',
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

export default Clients;
