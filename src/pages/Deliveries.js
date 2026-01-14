import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const navigate = useNavigate();

  // Search & Filter state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    delivery_number: true,
    receiver: true,
    product: false,
  });

  // Sort state
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredSort, setHoveredSort] = useState(null);

  // Add delivery modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    receiver_username: '',
    sender_username: '',
    product_description: '',
    admin_notes: ''
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
  ];

  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSort(false);
      }
    };
    if (showSort) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSort]);

  const filterOptions = [
    { id: 'delivery_number', label: '№ Доставки' },
    { id: 'receiver', label: 'Получатель' },
    { id: 'product', label: 'Товар' },
  ];

  const toggleFilter = (filterId) => {
    setSearchFilters(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveries/`);
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const payload = {
        ...addForm,
        receiver_username: addForm.receiver_username ? `REN${addForm.receiver_username}` : '',
        sender_username: addForm.sender_username ? `REN${addForm.sender_username}` : '',
      };
      const res = await fetch(`${API_URL}/deliveries/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ receiver_username: '', sender_username: '', product_description: '', admin_notes: '' });
        fetchDeliveries();
      } else {
        const errorMsg = data.receiver_username?.[0] || data.sender_username?.[0] || data.error || JSON.stringify(data) || 'Ошибка создания доставки';
        setAddError(errorMsg);
      }
    } catch (error) {
      setAddError('Ошибка сети');
    } finally {
      setAddLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'prinyat', label: 'Принят' },
    { id: 'v_stambule', label: 'В Стамбуле' },
    { id: 'otpravlen', label: 'Отправлен' },
    { id: 'v_puti', label: 'В пути' },
    { id: 'v_moskve', label: 'В Москве' },
    { id: 'oplata', label: 'Оплата' },
    { id: 'dostavka', label: 'Доставка' },
    { id: 'vidan', label: 'Выдан' },
  ];

  const statusConfig = {
    prinyat: { label: 'Принят', bg: '#fef3c7', color: '#92400e' },
    v_stambule: { label: 'В Стамбуле', bg: '#fce7f3', color: '#9d174d' },
    otpravlen: { label: 'Отправлен', bg: '#dbeafe', color: '#1d4ed8' },
    v_puti: { label: 'В пути', bg: '#e0e7ff', color: '#3730a3' },
    v_moskve: { label: 'В Москве', bg: '#cffafe', color: '#0e7490' },
    oplata: { label: 'Оплата', bg: '#fef9c3', color: '#854d0e' },
    dostavka: { label: 'Доставка', bg: '#dcfce7', color: '#166534' },
    vidan: { label: 'Выдан', bg: '#d1fae5', color: '#065f46' },
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (activeTab !== 'all' && delivery.status !== activeTab) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      let matches = false;

      if (searchFilters.delivery_number && delivery.delivery_number?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.receiver) {
        if (delivery.receiver_username?.toLowerCase().includes(query) ||
            delivery.receiver_name?.toLowerCase().includes(query)) {
          matches = true;
        }
      }
      if (searchFilters.product && delivery.product_description?.toLowerCase().includes(query)) {
        matches = true;
      }

      if (!matches) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case 'created_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      default:
        return 0;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#303030">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <h1 style={styles.title}>Доставки RenCargo</h1>
        </div>
        <button
          style={{
            ...styles.btnPrimary,
            backgroundColor: hoveredBtn === 'add' ? '#1a1a1a' : '#303030',
          }}
          onMouseEnter={() => setHoveredBtn('add')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => setShowAddModal(true)}
        >
          + Добавить доставку
        </button>
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
                backgroundColor: showSearch ? '#e4e5e7' : hoveredBtn === 'search' ? '#f1f1f1' : '#fff',
                borderColor: showSearch ? '#8c9196' : '#c9cccf',
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
                  backgroundColor: showSort ? '#e4e5e7' : hoveredBtn === 'sort' ? '#f1f1f1' : '#fff',
                  borderColor: showSort ? '#8c9196' : '#c9cccf',
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
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#303030" style={{ marginRight: 8 }}>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск доставок..."
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={styles.searchClear}
                >
                  x
                </button>
              )}
            </div>
            <div style={styles.filterSection}>
              <span style={styles.filterLabel}>Искать по:</span>
              <div style={styles.filterOptions}>
                {filterOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleFilter(opt.id)}
                    style={{
                      ...styles.filterChip,
                      backgroundColor: searchFilters[opt.id] ? '#303030' : '#fff',
                      color: searchFilters[opt.id] ? '#fff' : '#303030',
                      borderColor: searchFilters[opt.id] ? '#303030' : '#c9cccf',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {searchQuery && (
              <div style={styles.searchResults}>
                Найдено: {filteredDeliveries.length} доставок
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>№ Доставки</th>
              <th style={styles.th}>Получатель</th>
              <th style={styles.th}>Товар</th>
              <th style={styles.th}>Тип доставки</th>
              <th style={styles.th}>Вес</th>
              <th style={styles.th}>Сумма</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.map((delivery, idx) => {
              const statusInfo = getStatusInfo(delivery.status);
              return (
                <tr
                  key={delivery.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === idx ? '#f6f6f7' : '#fff',
                  }}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => navigate(`/deliveries/${delivery.id}`)}
                >
                  <td style={styles.td}>
                    <span style={styles.deliveryNumber}>REN{delivery.receiver}-{delivery.sequential_number || 1}</span>
                    <div style={styles.deliveryNumberSmall}>{delivery.delivery_number}</div>
                  </td>
                  <td style={styles.td}>
                    <div>
                      <div style={styles.receiverUsername}>{delivery.receiver_username}</div>
                      <div style={styles.receiverName}>{delivery.receiver_name || '—'}</div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.productText}>{delivery.product_description?.substring(0, 30) || '—'}{delivery.product_description?.length > 30 ? '...' : ''}</span>
                  </td>
                  <td style={styles.td}>
                    {delivery.delivery_type_name || '—'}
                  </td>
                  <td style={styles.td}>
                    {delivery.weight_kg ? `${delivery.weight_kg} кг` : '—'}
                  </td>
                  <td style={styles.td}>
                    {delivery.total_price ? `${delivery.total_price}$` : '—'}
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
                  <td style={styles.td}>{formatDate(delivery.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDeliveries.length === 0 && (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#8c9196" style={{ marginBottom: 12 }}>
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
            </svg>
            <p style={styles.emptyTitle}>Доставки не найдены</p>
            <p style={styles.emptyText}>Добавьте новую доставку или измените фильтры</p>
          </div>
        )}
      </div>

      {/* Add Delivery Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Новая доставка</h2>
            <form onSubmit={handleAddDelivery}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Получатель *</label>
                <div style={styles.renInputWrapper}>
                  <span style={styles.renPrefix}>REN</span>
                  <input
                    type="text"
                    value={addForm.receiver_username}
                    onChange={e => setAddForm({ ...addForm, receiver_username: e.target.value.replace(/\D/g, '') })}
                    placeholder="123"
                    style={styles.renInput}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Отправитель *</label>
                <div style={styles.renInputWrapper}>
                  <span style={styles.renPrefix}>REN</span>
                  <input
                    type="text"
                    value={addForm.sender_username}
                    onChange={e => setAddForm({ ...addForm, sender_username: e.target.value.replace(/\D/g, '') })}
                    placeholder="456"
                    style={styles.renInput}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Описание товара</label>
                <textarea
                  value={addForm.product_description}
                  onChange={e => setAddForm({ ...addForm, product_description: e.target.value })}
                  placeholder="Одежда, текстиль и т.д."
                  style={styles.textarea}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Заметки</label>
                <textarea
                  value={addForm.admin_notes}
                  onChange={e => setAddForm({ ...addForm, admin_notes: e.target.value })}
                  placeholder="Дополнительная информация"
                  style={styles.textarea}
                  rows={2}
                />
              </div>
              {addError && <div style={styles.error}>{addError}</div>}
              <div style={styles.modalButtons}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowAddModal(false)}>
                  Отмена
                </button>
                <button type="submit" style={styles.btnPrimary} disabled={addLoading}>
                  {addLoading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    borderTopColor: '#333',
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
    color: '#303030',
    margin: 0,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#303030',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
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
    color: '#6d7175',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #303030',
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
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

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
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
  },

  deliveryNumber: {
    fontWeight: '600',
    color: '#2AABAB',
  },
  deliveryNumberSmall: {
    fontSize: '11px',
    color: '#8c9196',
    marginTop: '2px',
  },
  receiverUsername: {
    fontWeight: '600',
    color: '#303030',
  },
  receiverName: {
    fontSize: '12px',
    color: '#6d7175',
  },
  productText: {
    color: '#6d7175',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
  },

  empty: {
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 4px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6d7175',
    margin: 0,
  },

  // Search Panel styles
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
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '12px',
    color: '#6d7175',
    fontWeight: '500',
  },
  filterOptions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterChip: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #c9cccf',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  searchResults: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#6d7175',
  },

  // Sort dropdown styles
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

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 20px 0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  renInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  renPrefix: {
    padding: '10px 12px',
    backgroundColor: '#f6f6f7',
    color: '#202223',
    fontWeight: '600',
    fontSize: '14px',
    borderRight: '1px solid #c9cccf',
  },
  renInput: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  error: {
    color: '#d72c0d',
    fontSize: '13px',
    marginBottom: '12px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  btnSecondary: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },
};

export default Deliveries;
