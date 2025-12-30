import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,6 15,12 9,18" />
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PackageIcon = ({ color = '#9CA3AF' }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function Products() {
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('extended'); // 'sku', 'name', 'extended'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const categoryDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/products/`).then(r => r.json()),
        fetch(`${API_URL}/categories/tree/`).then(r => r.json()).catch(() => [])
      ]);
      setProducts(productsRes);
      setCategoryTree(categoriesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all category IDs including children for filtering
  const getAllCategoryIds = (category) => {
    let ids = [category.id];
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        ids = [...ids, ...getAllCategoryIds(child)];
      });
    }
    return ids;
  };

  // Find category by ID in tree
  const findCategoryInTree = (tree, id) => {
    for (const cat of tree) {
      if (cat.id === id) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryInTree(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const filteredProducts = products.filter(product => {
    // Search filtering
    const searchLower = searchTerm.toLowerCase().trim();
    let matchesSearch = true;

    if (searchLower) {
      if (searchType === 'sku') {
        matchesSearch = product.sku && product.sku.toLowerCase().includes(searchLower);
      } else if (searchType === 'name') {
        matchesSearch = product.name && product.name.toLowerCase().includes(searchLower);
      } else {
        // Extended search - search across name, description, category, SKU
        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description && product.description.toLowerCase().includes(searchLower);
        const categoryMatch = product.category_name && product.category_name.toLowerCase().includes(searchLower);
        const categoryPathMatch = product.category_full_path && product.category_full_path.toLowerCase().includes(searchLower);
        const skuMatch = product.sku && product.sku.toLowerCase().includes(searchLower);
        matchesSearch = nameMatch || descMatch || categoryMatch || categoryPathMatch || skuMatch;
      }
    }

    // Category filtering
    let matchesCategory = true;
    if (selectedCategory) {
      const category = findCategoryInTree(categoryTree, selectedCategory);
      if (category) {
        const categoryIds = getAllCategoryIds(category);
        matchesCategory = categoryIds.includes(product.category);
      }
    }

    return matchesSearch && matchesCategory;
  });

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  const getStockStatus = (quantity) => {
    if (quantity > 10) return { label: 'В наличии', color: '#10B981', bg: '#D1FAE5' };
    if (quantity > 0) return { label: 'Мало', color: '#F59E0B', bg: '#FEF3C7' };
    return { label: 'Нет в наличии', color: '#EF4444', bg: '#FEE2E2' };
  };

  const toggleCategoryExpand = (categoryId, e) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const selectCategory = (category) => {
    setSelectedCategory(category.id);
    setCategoryDropdownOpen(false);
  };

  const clearCategory = () => {
    setSelectedCategory(null);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    const category = findCategoryInTree(categoryTree, selectedCategory);
    return category ? category.full_path || category.name : null;
  };

  // Render category tree recursively
  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories[category.id];
      const isSelected = selectedCategory === category.id;

      return (
        <div key={category.id}>
          <div
            style={{
              ...styles.categoryItem,
              paddingLeft: `${12 + level * 20}px`,
              backgroundColor: isSelected ? '#FFF4F0' : 'transparent',
            }}
            onClick={() => selectCategory(category)}
          >
            {hasChildren ? (
              <span
                style={styles.expandBtn}
                onClick={(e) => toggleCategoryExpand(category.id, e)}
              >
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            ) : (
              <span style={styles.expandBtnPlaceholder} />
            )}
            <FolderIcon />
            <span style={{
              ...styles.categoryItemText,
              fontWeight: isSelected ? '600' : '400',
              color: isSelected ? '#FF6B35' : '#374151',
            }}>
              {category.name}
            </span>
            {isSelected && <span style={styles.checkIcon}>✓</span>}
          </div>
          {hasChildren && isExpanded && (
            <div style={styles.categoryChildren}>
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const searchPlaceholders = {
    sku: 'Поиск по артикулу (SKU)...',
    name: 'Поиск по названию товара...',
    extended: 'Поиск по названию, категории, описанию...'
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
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Каталог товаров</h1>
          <p style={styles.pageSubtitle}>Управление товарами и ассортиментом</p>
        </div>
        <button onClick={() => navigate('/products/add')} style={styles.addButton}>
          <PlusIcon />
          Добавить товар
        </button>
      </div>

      {/* Search and Filters */}
      <div style={styles.toolbar}>
        {/* Search Type Tabs */}
        <div style={styles.searchTypeContainer}>
          <button
            style={{
              ...styles.searchTypeBtn,
              ...(searchType === 'extended' ? styles.searchTypeBtnActive : {})
            }}
            onClick={() => setSearchType('extended')}
          >
            Расширенный поиск
          </button>
          <button
            style={{
              ...styles.searchTypeBtn,
              ...(searchType === 'name' ? styles.searchTypeBtnActive : {})
            }}
            onClick={() => setSearchType('name')}
          >
            По названию
          </button>
          <button
            style={{
              ...styles.searchTypeBtn,
              ...(searchType === 'sku' ? styles.searchTypeBtnActive : {})
            }}
            onClick={() => setSearchType('sku')}
          >
            По артикулу
          </button>
        </div>

        {/* Search Input */}
        <div style={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder={searchPlaceholders[searchType]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              style={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <div style={styles.categoryFilterContainer} ref={categoryDropdownRef}>
          <button
            style={styles.categoryFilterBtn}
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
          >
            <FolderIcon />
            <span style={styles.categoryFilterText}>
              {selectedCategory ? getSelectedCategoryName() : 'Все категории'}
            </span>
            <ChevronDownIcon />
          </button>

          {categoryDropdownOpen && (
            <div style={styles.categoryDropdown}>
              <div style={styles.categoryDropdownHeader}>
                <span style={styles.categoryDropdownTitle}>Выберите категорию</span>
              </div>
              <div
                style={{
                  ...styles.categoryItem,
                  paddingLeft: '12px',
                  backgroundColor: !selectedCategory ? '#FFF4F0' : 'transparent',
                }}
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryDropdownOpen(false);
                }}
              >
                <span style={styles.expandBtnPlaceholder} />
                <FolderIcon />
                <span style={{
                  ...styles.categoryItemText,
                  fontWeight: !selectedCategory ? '600' : '400',
                  color: !selectedCategory ? '#FF6B35' : '#374151',
                }}>
                  Все категории
                </span>
                {!selectedCategory && <span style={styles.checkIcon}>✓</span>}
              </div>
              <div style={styles.categoryTreeContainer}>
                {renderCategoryTree(categoryTree)}
              </div>
            </div>
          )}
        </div>

        {/* Selected Category Chip */}
        {selectedCategory && (
          <div style={styles.selectedCategoryChip}>
            <span>{getSelectedCategoryName()}</span>
            <button style={styles.chipCloseBtn} onClick={clearCategory}>
              <CloseIcon />
            </button>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div style={styles.resultsInfo}>
        <span style={styles.resultsText}>
          Найдено товаров: <strong>{filteredProducts.length}</strong>
          {searchTerm && ` по запросу "${searchTerm}"`}
        </span>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <PackageIcon color="#9CA3AF" />
          <h3 style={styles.emptyTitle}>Товары не найдены</h3>
          <p style={styles.emptyText}>
            {searchTerm
              ? 'Попробуйте изменить поисковый запрос или выбрать другую категорию'
              : 'В выбранной категории нет товаров'
            }
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              style={styles.resetBtn}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div style={styles.productsGrid}>
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock_quantity);

            return (
              <div
                key={product.id}
                style={styles.productCard}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {/* Image */}
                <div style={styles.imageContainer}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name}
                      style={styles.productImage}
                    />
                  ) : (
                    <div style={styles.imagePlaceholder}>
                      <PackageIcon />
                    </div>
                  )}

                  {/* SKU Badge */}
                  {product.sku && (
                    <span style={styles.skuBadge}>{product.sku}</span>
                  )}

                  {/* Stock Badge */}
                  <span style={{
                    ...styles.stockBadge,
                    backgroundColor: stockStatus.bg,
                    color: stockStatus.color,
                  }}>
                    {stockStatus.label}
                  </span>
                </div>

                {/* Content */}
                <div style={styles.cardContent}>
                  {/* Category Path */}
                  {product.category_full_path && (
                    <span style={styles.categoryPath}>{product.category_full_path}</span>
                  )}

                  <h3 style={styles.productName}>{product.name}</h3>

                  {/* Prices */}
                  <div style={styles.pricesContainer}>
                    <div style={styles.priceRow}>
                      <span style={styles.priceLabel}>Розница:</span>
                      <span style={styles.price}>{formatMoney(product.retail_price || product.price || 0)}</span>
                    </div>
                    <div style={styles.priceRow}>
                      <span style={styles.priceLabel}>Оптом:</span>
                      <span style={styles.wholesalePrice}>{formatMoney(product.wholesale_price || product.price || 0)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={styles.cardActions}>
                    <button
                      style={styles.editBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product.id}`);
                      }}
                    >
                      <EditIcon />
                      Редактировать
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  // Page Header
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '4px 0 0 0',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Toolbar
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },

  // Search Type Tabs
  searchTypeContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '16px',
  },
  searchTypeBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  searchTypeBtnActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    color: '#FFFFFF',
  },

  // Search Box
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1A1A1A',
  },
  clearSearchBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#6B7280',
  },

  // Category Filter
  categoryFilterContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  categoryFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    minWidth: '200px',
  },
  categoryFilterText: {
    flex: 1,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    minWidth: '350px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    marginTop: '4px',
    overflow: 'hidden',
  },
  categoryDropdownHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  categoryDropdownTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTreeContainer: {
    maxHeight: '350px',
    overflowY: 'auto',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  },
  categoryItemText: {
    flex: 1,
    fontSize: '14px',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: '#9CA3AF',
    cursor: 'pointer',
  },
  expandBtnPlaceholder: {
    width: '20px',
    height: '20px',
  },
  checkIcon: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  categoryChildren: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },

  // Selected Category Chip
  selectedCategoryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFF4F0',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#FF6B35',
    fontWeight: '500',
  },
  chipCloseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    backgroundColor: '#FF6B35',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#FFFFFF',
  },

  // Results Info
  resultsInfo: {
    marginBottom: '16px',
  },
  resultsText: {
    fontSize: '14px',
    color: '#6B7280',
  },

  // Products Grid
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  imageContainer: {
    position: 'relative',
    height: '200px',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  skuBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  stockBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
  },

  // Card Content
  cardContent: {
    padding: '16px',
  },
  categoryPath: {
    display: 'block',
    fontSize: '11px',
    color: '#9CA3AF',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: '0 0 12px 0',
    lineHeight: '1.4',
  },
  pricesContainer: {
    marginBottom: '12px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  price: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  wholesalePrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF6B35',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#F5F5F7',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: '16px',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: '16px',
  },
  resetBtn: {
    padding: '10px 20px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default Products;
