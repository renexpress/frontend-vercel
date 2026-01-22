import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredSort, setHoveredSort] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
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
    { id: 'orders_desc', label: 'Больше доставок' },
    { id: 'orders_asc', label: 'Меньше доставок' },
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
      const [clientsRes, deliveriesRes] = await Promise.all([
        axios.get(`${API_URL}/clients/`),
        axios.get(`${API_URL}/deliveries/`)
      ]);

      const clientsData = clientsRes.data;
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      } else if (clientsData.results) {
        setClients(clientsData.results);
      } else if (clientsData.clients) {
        setClients(clientsData.clients);
      } else {
        setClients([]);
      }

      const deliveriesData = deliveriesRes.data;
      if (Array.isArray(deliveriesData)) {
        setDeliveries(deliveriesData);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentCount = (username) => {
    return deliveries.filter(d => d.sender_username === username).length;
  };

  const getReceivedCount = (username) => {
    return deliveries.filter(d => d.receiver_username === username).length;
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
      const aDeliveries = getSentCount(a.username) + getReceivedCount(a.username);
      const bDeliveries = getSentCount(b.username) + getReceivedCount(b.username);
      switch (sortBy) {
        case 'created_asc': return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc': return new Date(b.created_at) - new Date(a.created_at);
        case 'name_asc': return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name_desc': return (b.full_name || '').localeCompare(a.full_name || '');
        case 'orders_desc': return bDeliveries - aDeliveries;
        case 'orders_asc': return aDeliveries - bDeliveries;
        default: return 0;
      }
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
            <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>
          </svg>
          <h1 style={styles.title}>Клиенты</h1>
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
                backgroundColor: showSearch ? '#e8f7f7' : hoveredBtn === 'search' ? '#f1f1f1' : '#fff',
                borderColor: showSearch ? '#2AABAB' : '#c9cccf',
              }}
              onClick={() => setShowSearch(!showSearch)}
              onMouseEnter={() => setHoveredBtn('search')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M8 12a4 4 0 110-8 4 4 0 010 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0014 8 6 6 0 102 8a6 6 0 006 6 5.968 5.968 0 003.473-1.113l4.82 4.82a1 1 0 001.414-1.414z"/>
              </svg>
            </button>
            <div ref={sortRef} style={styles.sortWrapper}>
              <button
                style={{
                  ...styles.iconBtn,
                  backgroundColor: showSort ? '#e8f7f7' : hoveredBtn === 'sort' ? '#f1f1f1' : '#fff',
                  borderColor: showSort ? '#2AABAB' : '#c9cccf',
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
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#2AABAB" style={{ marginRight: 8 }}>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по имени, телефону, логину..."
                style={styles.searchInput}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={styles.searchClear}
                >
                  x
                </button>
              )}
            </div>
            {searchTerm && (
              <div style={styles.searchResults}>
                Найдено: {filteredClients.length} клиентов
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Код</th>
              <th style={styles.th}>Имя</th>
              <th style={styles.th}>Контакты</th>
              <th style={styles.th}>Компания</th>
              <th style={styles.th}>Адрес</th>
              <th style={{...styles.th, textAlign: 'center'}}>Отправил</th>
              <th style={{...styles.th, textAlign: 'center'}}>Получил</th>
              <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
              <th style={styles.th}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const sentCount = getSentCount(client.username);
              const receivedCount = getReceivedCount(client.username);
              return (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  onMouseEnter={() => setHoveredRow(client.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === client.id ? '#f0fafa' : '#fff',
                  }}
                >
                  <td style={styles.td}>
                    <span style={styles.clientCode}>{client.username}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.clientName}>{client.full_name || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.phone}>{client.phone}</span>
                  </td>
                  <td style={styles.td}>
                    {client.company_name ? (
                      <span style={styles.companyBadge}>{client.company_name}</span>
                    ) : (
                      <span style={styles.noData}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.addressText}>{client.address || '—'}</span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.countBadge,
                      backgroundColor: sentCount > 0 ? '#e8f7f7' : '#f6f6f7',
                      color: sentCount > 0 ? '#2AABAB' : '#6d7175',
                    }}>
                      {sentCount}
                    </span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.countBadge,
                      backgroundColor: receivedCount > 0 ? '#e8f7f7' : '#f6f6f7',
                      color: receivedCount > 0 ? '#2AABAB' : '#6d7175',
                    }}>
                      {receivedCount}
                    </span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={client.is_active ? styles.statusActive : styles.statusInactive}>
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

        {filteredClients.length === 0 && (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#2AABAB" style={{ marginBottom: 12, opacity: 0.5 }}>
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>
            </svg>
            <p style={styles.emptyTitle}>Клиенты не найдены</p>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PRIMARY_COLOR = '#2AABAB';

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
    borderTopColor: PRIMARY_COLOR,
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
    margin: 0,
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    color: '#000',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid',
    borderImage: 'linear-gradient(to right, #2AABAB, #0a2535) 1',
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    transition: 'background-color 0.15s',
  },

  // Search Panel
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
  },
  searchResults: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#6d7175',
  },

  // Sort dropdown
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

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#000',
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
    verticalAlign: 'middle',
  },

  // Client columns
  clientCode: {
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  clientName: {
    fontSize: '13px',
    color: '#303030',
  },

  // Contact info
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  phone: {
    fontSize: '13px',
    color: '#303030',
  },
  email: {
    fontSize: '11px',
    color: '#6d7175',
  },

  // Badges
  companyBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: 'transparent',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    border: '1px solid #2AABAB',
  },
  cityText: {
    color: '#6d7175',
    fontSize: '13px',
  },
  addressText: {
    color: '#303030',
    fontSize: '13px',
  },
  countBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusActive: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
  },
  statusInactive: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#fef2f2',
    color: '#d72c0d',
  },
  dateText: {
    fontSize: '12px',
    color: '#6d7175',
  },
  noData: {
    color: '#c9cccf',
  },

  // Empty state
  empty: {
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: PRIMARY_COLOR,
    margin: '0 0 4px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6d7175',
    margin: 0,
  },
};

export default Clients;
