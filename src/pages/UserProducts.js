import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function UserProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredSort, setHoveredSort] = useState(null);
  const navigate = useNavigate();

  // Search & Filter state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    description: false,
    category: false,
    owner: true,
    sku: false,
  });

  // Sort state
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState('created_desc');

  const sortOptions = [
    { id: 'created_desc', label: 'Сначала новые' },
    { id: 'created_asc', label: 'Сначала старые' },
    { id: 'updated_desc', label: 'Недавно обновленные' },
    { id: 'updated_asc', label: 'Давно обновленные' },
    { id: 'category_asc', label: 'Категория А-Я' },
    { id: 'category_desc', label: 'Категория Я-А' },
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
    { id: 'name', label: 'Название' },
    { id: 'description', label: 'Описание' },
    { id: 'category', label: 'Категория' },
    { id: 'owner', label: 'Владелец' },
    { id: 'sku', label: 'Артикул' },
  ];

  const toggleFilter = (filterId) => {
    setSearchFilters(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/?is_user_product=true&show_all=true`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else if (data.results && Array.isArray(data.results)) {
        setProducts(data.results);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'pending_approval', label: 'Ожидают одобрения' },
    { id: 'approved', label: 'Одобрены' },
    { id: 'active', label: 'Активные' },
    { id: 'rejected', label: 'Отклонённые' },
  ];

  const statusConfig = {
    pending_approval: { label: 'Ожидает одобрения', bg: '#fef3c7', color: '#92400e' },
    approved: { label: 'Одобрен', bg: '#dbeafe', color: '#1d4ed8' },
    active: { label: 'Активен', bg: '#d1fae5', color: '#065f46' },
    rejected: { label: 'Отклонён', bg: '#fee2e2', color: '#991b1b' },
    draft: { label: 'Черновик', bg: '#e4e5e7', color: '#6d7175' },
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || { label: status || 'Неизвестно', bg: '#f3f4f6', color: '#374151' };
  };

  const filteredProducts = products.filter(product => {
    // Tab filter
    if (activeTab !== 'all' && product.product_status !== activeTab) return false;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      let matches = false;

      if (searchFilters.name && product.name?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.description && product.description?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.category) {
        const catName = product.category_name?.toLowerCase() || '';
        const catPath = product.category_full_path?.toLowerCase() || '';
        if (catName.includes(query) || catPath.includes(query)) {
          matches = true;
        }
      }
      if (searchFilters.owner && product.owner_username?.toLowerCase().includes(query)) {
        matches = true;
      }
      if (searchFilters.sku && product.sku?.toLowerCase().includes(query)) {
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
      case 'updated_asc':
        return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
      case 'updated_desc':
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      case 'category_asc':
        return (a.category_name || '').localeCompare(b.category_name || '', 'ru');
      case 'category_desc':
        return (b.category_name || '').localeCompare(a.category_name || '', 'ru');
      default:
        return 0;
    }
  });

  const getParentCategory = (product) => {
    if (product.category_full_path) {
      const parts = product.category_full_path.split(' > ');
      return parts[0];
    }
    return product.category_name || '—';
  };

  const getProductImage = (product) => {
    if (product.primary_image) return product.primary_image;
    if (product.images && product.images.length > 0) return product.images[0].image_url;
    return null;
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#303030">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          <h1 style={styles.title}>Товары пользователей</h1>
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
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
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
                placeholder="Поиск товаров пользователей..."
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={styles.searchClear}
                >
                  ×
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
                Найдено: {filteredProducts.length} товаров
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thCheck}>
                <input type="checkbox" style={styles.checkbox} />
              </th>
              <th style={styles.th}>Товар</th>
              <th style={styles.th}>Артикул</th>
              <th style={styles.th}>Владелец</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Категория</th>
              <th style={styles.th}>Цена</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, idx) => {
              const imageUrl = getProductImage(product);
              const statusInfo = getStatusInfo(product.product_status);
              return (
                <tr
                  key={product.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: hoveredRow === idx ? '#f6f6f7' : '#fff',
                  }}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <td style={styles.tdCheck} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={styles.checkbox} />
                  </td>
                  <td style={styles.td}>
                    <div style={styles.productCell}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} style={styles.productImage} />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
                            <path d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zm3.25 3a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm9.75 3.5l-3-3-4.5 4.5-1.5-1.5-4 4V16h12a.5.5 0 00.5-.5v-4.5z"/>
                          </svg>
                        </div>
                      )}
                      <span style={styles.productName}>{product.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.skuText}>{product.sku || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.ownerCell}>
                      <div style={styles.ownerAvatar}>
                        {(product.owner_username || '?')[0].toUpperCase()}
                      </div>
                      <span style={styles.ownerName}>{product.owner_username || '—'}</span>
                    </div>
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
                  <td style={styles.td}>{getParentCategory(product)}</td>
                  <td style={styles.td}>
                    {product.retail_price ? `${Number(product.retail_price).toLocaleString()} ₽` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 20 20" fill="#8c9196" style={{ marginBottom: 12 }}>
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <p style={styles.emptyTitle}>Товары не найдены</p>
            <p style={styles.emptyText}>Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        )}
      </div>
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
    boxShadow: '0 1px 0 rgba(0,0,0,0.04), inset 0 -1px 0 rgba(0,0,0,0.1)',
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
  thCheck: {
    padding: '8px 12px',
    width: '36px',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #e1e3e5',
  },
  tdCheck: {
    padding: '8px 12px',
    width: '36px',
    borderBottom: '1px solid #e1e3e5',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },

  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  productImage: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #e1e3e5',
  },
  imagePlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#f1f1f1',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
  },
  skuText: {
    fontSize: '12px',
    color: '#6d7175',
    fontFamily: 'monospace',
  },

  ownerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  ownerAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6d7175',
  },
  ownerName: {
    fontSize: '13px',
    color: '#303030',
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
    lineHeight: 1,
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
};

export default UserProducts;
