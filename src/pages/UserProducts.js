import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

function UserProducts() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'all'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve', 'reject', 'receipt', 'details'
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let endpoint = '/products/';
      if (activeTab === 'pending') {
        endpoint = '/products/pending/';
      } else if (activeTab === 'approved') {
        endpoint = '/products/approved_waiting/';
      } else {
        // All user products
        endpoint = '/products/?has_owner=true';
      }

      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/products/${selectedProduct.id}/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Товар одобрен! Артикул: ${data.article}`);
        closeModal();
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось одобрить товар'}`);
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Ошибка при одобрении товара');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/products/${selectedProduct.id}/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        alert('Товар отклонён');
        closeModal();
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось отклонить товар'}`);
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Ошибка при отклонении товара');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/products/${selectedProduct.id}/confirm_receipt/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Товар получен и активирован!');
        closeModal();
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось подтвердить получение'}`);
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Ошибка при подтверждении получения');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setRejectReason('');
    setAdminNotes('');
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalType(null);
    setRejectReason('');
    setAdminNotes('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount || 0) + ' ₽';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_approval: { label: 'Ожидает одобрения', color: '#F59E0B', bg: '#FEF3C7' },
      approved: { label: 'Одобрен (ожидает товар)', color: '#3B82F6', bg: '#DBEAFE' },
      active: { label: 'Активный', color: '#10B981', bg: '#D1FAE5' },
      rejected: { label: 'Отклонён', color: '#EF4444', bg: '#FEE2E2' },
    };
    return statusMap[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    const nameMatch = product.name?.toLowerCase().includes(searchLower);
    const articleMatch = product.article?.toLowerCase().includes(searchLower);
    const ownerMatch = product.owner_username?.toLowerCase().includes(searchLower);
    const skuMatch = product.sku?.toLowerCase().includes(searchLower);

    return nameMatch || articleMatch || ownerMatch || skuMatch;
  });

  const tabs = [
    { id: 'pending', label: 'Ожидают одобрения', count: products.length },
    { id: 'approved', label: 'Ожидают товар', count: products.length },
    { id: 'all', label: 'Все товары пользователей', count: null },
  ];

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
          <h1 style={styles.pageTitle}>Товары пользователей</h1>
          <p style={styles.pageSubtitle}>Модерация и управление товарами от клиентов</p>
        </div>
        <button onClick={fetchProducts} style={styles.refreshButton}>
          <RefreshIcon />
          Обновить
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id !== 'all' && activeTab === tab.id && filteredProducts.length > 0 && (
              <span style={styles.tabBadge}>{filteredProducts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Поиск по названию, артикулу, владельцу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <PackageIcon color="#9CA3AF" />
          <h3 style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'Нет товаров на модерации' :
             activeTab === 'approved' ? 'Нет товаров, ожидающих получения' :
             'Нет товаров пользователей'}
          </h3>
          <p style={styles.emptyText}>
            {activeTab === 'pending' ? 'Все товары проверены' :
             activeTab === 'approved' ? 'Все одобренные товары уже получены' :
             'Пользователи ещё не добавили товары'}
          </p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Фото</th>
                <th style={styles.th}>Товар</th>
                <th style={styles.th}>Артикул</th>
                <th style={styles.th}>Владелец</th>
                <th style={styles.th}>Цены</th>
                <th style={styles.th}>Статус</th>
                <th style={styles.th}>Дата</th>
                <th style={styles.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStatusBadge(product.product_status);
                return (
                  <tr key={product.id} style={styles.tr}>
                    <td style={styles.td}>
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          <PackageIcon color="#9CA3AF" />
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productInfo}>
                        <span style={styles.productName}>{product.name}</span>
                        <span style={styles.productCategory}>{product.category_full_path || product.category_name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.articleCode}>{product.article || '-'}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.ownerInfo}>
                        <UserIcon />
                        <span>{product.owner_username || 'Не указан'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.pricesInfo}>
                        <div style={styles.priceRow}>
                          <span style={styles.priceLabel}>Розн:</span>
                          <span style={styles.priceValue}>{formatMoney(product.retail_price || product.price)}</span>
                        </div>
                        <div style={styles.priceRow}>
                          <span style={styles.priceLabel}>Опт:</span>
                          <span style={styles.priceValueWholesale}>{formatMoney(product.wholesale_price || product.price)}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>
                        {formatDate(product.submitted_at)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
                        <button
                          style={styles.detailsBtn}
                          onClick={() => openModal(product, 'details')}
                        >
                          Детали
                        </button>
                        {product.product_status === 'pending_approval' && (
                          <>
                            <button
                              style={styles.approveBtn}
                              onClick={() => openModal(product, 'approve')}
                            >
                              <CheckIcon />
                            </button>
                            <button
                              style={styles.rejectBtn}
                              onClick={() => openModal(product, 'reject')}
                            >
                              <XIcon />
                            </button>
                          </>
                        )}
                        {product.product_status === 'approved' && (
                          <button
                            style={styles.receiptBtn}
                            onClick={() => openModal(product, 'receipt')}
                          >
                            <TruckIcon />
                            Получен
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalType && selectedProduct && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalType === 'approve' && 'Одобрить товар'}
                {modalType === 'reject' && 'Отклонить товар'}
                {modalType === 'receipt' && 'Подтвердить получение'}
                {modalType === 'details' && 'Информация о товаре'}
              </h2>
              <button style={styles.modalCloseBtn} onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Product Preview */}
              <div style={styles.productPreview}>
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={selectedProduct.images[0].image_url}
                    alt={selectedProduct.name}
                    style={styles.previewImage}
                  />
                ) : (
                  <div style={styles.previewPlaceholder}>
                    <PackageIcon color="#9CA3AF" />
                  </div>
                )}
                <div style={styles.previewInfo}>
                  <h3 style={styles.previewName}>{selectedProduct.name}</h3>
                  <p style={styles.previewCategory}>{selectedProduct.category_full_path}</p>
                  {selectedProduct.article && (
                    <span style={styles.previewArticle}>Артикул: {selectedProduct.article}</span>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div style={styles.infoSection}>
                <h4 style={styles.infoTitle}>Владелец</h4>
                <div style={styles.infoRow}>
                  <UserIcon />
                  <span>{selectedProduct.owner_username || 'Не указан'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Отправлено:</span>
                  <span>{formatDate(selectedProduct.submitted_at)}</span>
                </div>
                {selectedProduct.approved_at && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Одобрено:</span>
                    <span>{formatDate(selectedProduct.approved_at)}</span>
                  </div>
                )}
              </div>

              {/* Prices */}
              <div style={styles.infoSection}>
                <h4 style={styles.infoTitle}>Цены</h4>
                <div style={styles.pricesGrid}>
                  <div style={styles.priceCard}>
                    <span style={styles.priceCardLabel}>Розничная</span>
                    <span style={styles.priceCardValue}>{formatMoney(selectedProduct.retail_price || selectedProduct.price)}</span>
                  </div>
                  <div style={styles.priceCard}>
                    <span style={styles.priceCardLabel}>Оптовая</span>
                    <span style={styles.priceCardValueWholesale}>{formatMoney(selectedProduct.wholesale_price || selectedProduct.price)}</span>
                  </div>
                </div>
              </div>

              {/* Colors & Sizes */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div style={styles.infoSection}>
                  <h4 style={styles.infoTitle}>Цвета</h4>
                  <div style={styles.colorsRow}>
                    {selectedProduct.colors.map((color, idx) => (
                      <div key={idx} style={styles.colorChip}>
                        <span
                          style={{
                            ...styles.colorDot,
                            backgroundColor: color.hex_code || '#ccc',
                          }}
                        />
                        <span>{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div style={styles.infoSection}>
                  <h4 style={styles.infoTitle}>Размеры</h4>
                  <div style={styles.sizesRow}>
                    {selectedProduct.sizes.map((size, idx) => (
                      <span key={idx} style={styles.sizeChip}>{size.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Specific Content */}
              {modalType === 'approve' && (
                <div style={styles.actionSection}>
                  <label style={styles.inputLabel}>Заметки администратора (необязательно)</label>
                  <textarea
                    style={styles.textarea}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Комментарий к товару..."
                    rows={3}
                  />
                  <p style={styles.actionHint}>
                    Товару будет присвоен уникальный артикул и он перейдёт в статус "Ожидает получения".
                    Клиент должен привезти товар на склад.
                  </p>
                </div>
              )}

              {modalType === 'reject' && (
                <div style={styles.actionSection}>
                  <label style={styles.inputLabel}>Причина отклонения *</label>
                  <textarea
                    style={styles.textarea}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Укажите причину отклонения товара..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {modalType === 'receipt' && (
                <div style={styles.actionSection}>
                  <p style={styles.receiptInfo}>
                    Подтвердите, что товар с артикулом <strong>{selectedProduct.article}</strong> получен на склад.
                    После подтверждения товар станет активным и будет доступен в каталоге.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {modalType !== 'details' && (
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={closeModal}>
                  Отмена
                </button>
                {modalType === 'approve' && (
                  <button
                    style={styles.confirmApproveBtn}
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Обработка...' : 'Одобрить товар'}
                  </button>
                )}
                {modalType === 'reject' && (
                  <button
                    style={styles.confirmRejectBtn}
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                  >
                    {actionLoading ? 'Обработка...' : 'Отклонить товар'}
                  </button>
                )}
                {modalType === 'receipt' && (
                  <button
                    style={styles.confirmReceiptBtn}
                    onClick={handleConfirmReceipt}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Обработка...' : 'Подтвердить получение'}
                  </button>
                )}
              </div>
            )}
          </div>
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

  // Header
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
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#F5F5F7',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Tabs
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF',
    padding: '8px',
    borderRadius: '12px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    marginBottom: '20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '12px 16px',
    maxWidth: '400px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1A1A1A',
  },
  clearBtn: {
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
  },

  // Table
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    borderBottom: '1px solid #E5E7EB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  },

  productImage: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    backgroundColor: '#F5F5F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  productName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  productCategory: {
    fontSize: '12px',
    color: '#9CA3AF',
  },

  articleCode: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: '4px 8px',
    borderRadius: '4px',
  },

  ownerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#374151',
  },

  pricesInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  priceRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
  },
  priceLabel: {
    color: '#9CA3AF',
  },
  priceValue: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  priceValueWholesale: {
    fontWeight: '600',
    color: '#FF6B35',
  },

  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },

  dateText: {
    fontSize: '13px',
    color: '#6B7280',
  },

  actionsCell: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  detailsBtn: {
    padding: '6px 12px',
    backgroundColor: '#F5F5F7',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#D1FAE5',
    color: '#10B981',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  rejectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  receiptBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#DBEAFE',
    color: '#3B82F6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Modal
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
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: 0,
  },
  modalCloseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#F5F5F7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  modalBody: {
    padding: '24px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E5E7EB',
  },

  // Product Preview
  productPreview: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  previewImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  previewPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: '0 0 4px 0',
  },
  previewCategory: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 8px 0',
  },
  previewArticle: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#E5E7EB',
    padding: '4px 8px',
    borderRadius: '4px',
  },

  // Info Sections
  infoSection: {
    marginBottom: '20px',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '8px',
  },
  infoLabel: {
    color: '#9CA3AF',
  },

  pricesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  priceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  priceCardLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  priceCardValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceCardValueWholesale: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FF6B35',
  },

  colorsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  colorChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#374151',
  },
  colorDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
  },

  sizesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sizeChip: {
    padding: '6px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    fontWeight: '500',
  },

  // Action Section
  actionSection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  actionHint: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '12px',
    lineHeight: '1.5',
  },
  receiptInfo: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
  },

  // Buttons
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#F5F5F7',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmApproveBtn: {
    padding: '10px 20px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmRejectBtn: {
    padding: '10px 20px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmReceiptBtn: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default UserProducts;
