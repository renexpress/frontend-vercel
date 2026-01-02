import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

// SVG Icons for statuses
const StatusIcons = {
  awaiting_payment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM4 0h16v2H4zm0 22h16v2H4zm8-10a2.5 2.5 0 000-5 2.5 2.5 0 000 5zm0 1c-1.65 0-5 .83-5 2.5V17h10v-1.5c0-1.67-3.35-2.5-5-2.5z"/>
    </svg>
  ),
  istanbul_warehouse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 21V7L12 1 2 7v14h5v-9h10v9h5zm-11-2H9v2h2v-2zm2-3h-2v2h2v-2zm2 3h-2v2h2v-2z"/>
    </svg>
  ),
  to_moscow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  ),
  moscow_warehouse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
    </svg>
  ),
  to_address: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  ),
  delivered: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
};

const STATUSES = [
  { key: 'awaiting_payment', label: 'Ожидает оплаты' },
  { key: 'istanbul_warehouse', label: 'На складе в Стамбуле' },
  { key: 'to_moscow', label: 'В дороге до Москвы' },
  { key: 'moscow_warehouse', label: 'На складе в Москве' },
  { key: 'to_address', label: 'В дороге до вашего адреса' },
  { key: 'delivered', label: 'Доставлен' },
];

const STATUS_LABELS = {
  awaiting_payment: 'Ожидает оплаты',
  istanbul_warehouse: 'На складе в Стамбуле',
  to_moscow: 'В дороге до Москвы',
  moscow_warehouse: 'На складе в Москве',
  to_address: 'В дороге до вашего адреса',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [history, setHistory] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (order) {
      loadOrderHistory();
    }
  }, [order]);

  const loadOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/`);
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Не удалось загрузить заказ');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/history/`);
      const data = await response.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const confirmPayment = async () => {
    setAdvancing(true);
    try {
      const response = await fetch(`${API_URL}/orders/${id}/confirm_payment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrder(data.order);
        setSuccessMessage('Оплата подтверждена!');
        loadOrderHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Ошибка');
      }
    } catch (error) {
      setError('Ошибка подтверждения оплаты');
    } finally {
      setAdvancing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError('Укажите причину отмены');
      return;
    }
    setAdvancing(true);
    try {
      const response = await fetch(`${API_URL}/orders/${id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrder(data.order);
      } else {
        setOrder(prev => ({ ...prev, status: 'cancelled', cancel_reason: cancelReason }));
      }
      setSuccessMessage('Заказ отменён');
      setShowCancelModal(false);
      setCancelReason('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setOrder(prev => ({ ...prev, status: 'cancelled', cancel_reason: cancelReason }));
      setSuccessMessage('Заказ отменён');
      setShowCancelModal(false);
      setCancelReason('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setAdvancing(false);
    }
  };

  const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (a) => {
    if (!a) return '—';
    return Number(a).toLocaleString('ru-RU') + ' ₽';
  };

  const getStatusIndex = (s) => STATUSES.findIndex(st => st.key === s);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/orders')}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
              <path d="M17 9H5.414l3.293-3.293a1 1 0 00-1.414-1.414l-5 5a1 1 0 000 1.414l5 5a1 1 0 001.414-1.414L5.414 11H17a1 1 0 100-2z"/>
            </svg>
            Назад к заказам
          </button>
        </div>
        <div style={styles.card}>
          <div style={styles.empty}>
            <p>Заказ не найден</p>
            {error && <p style={{ color: '#d72c0d' }}>{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = getStatusIndex(order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const unitPrice = Number(order.unit_price) || 0;
  const quantity = Number(order.quantity) || 1;
  const subtotal = unitPrice * quantity;
  const discount = Number(order.discount) || 0;
  const shipping = Number(order.shipping_cost) || 0;
  const total = Number(order.total_amount) || subtotal;

  // Get snapshot data (contains full product info at time of order)
  const snapshot = order.snapshot || order.product_snapshot || {};

  // Get product images - collect all available images from snapshot
  const productImages = [];
  // Add primary image from snapshot
  if (snapshot.primary_image) {
    productImages.push(snapshot.primary_image);
  }
  // Add variant image from snapshot if different
  if (snapshot.variant_image && !productImages.includes(snapshot.variant_image)) {
    productImages.push(snapshot.variant_image);
  }
  // Also check order-level images as fallback
  if (order.product_images && Array.isArray(order.product_images)) {
    order.product_images.forEach(img => {
      const url = img.image_url || img;
      if (!productImages.includes(url)) {
        productImages.push(url);
      }
    });
  }
  const hasImages = productImages.length > 0;

  // Get all variant attributes from snapshot (most reliable source)
  const variantAttributes = [];
  // First check snapshot variant_attributes (these are what user actually chose)
  if (snapshot.variant_attributes && Array.isArray(snapshot.variant_attributes)) {
    snapshot.variant_attributes.forEach(attr => {
      variantAttributes.push({
        name: attr.name,
        value: attr.value,
        hexCode: attr.hex_code || null,
      });
    });
  }
  // Also add regular product attributes from snapshot
  if (snapshot.attributes && Array.isArray(snapshot.attributes)) {
    snapshot.attributes.forEach(attr => {
      // Don't duplicate if already added from variant_attributes
      if (!variantAttributes.find(v => v.name === attr.name)) {
        variantAttributes.push({
          name: attr.name,
          value: attr.value,
          hexCode: null,
        });
      }
    });
  }
  // Fallback to individual order fields if no snapshot data
  if (variantAttributes.length === 0) {
    if (order.color_name) {
      variantAttributes.push({ name: 'Цвет', value: order.color_name, hexCode: order.color_hex });
    }
    if (order.size_name) {
      variantAttributes.push({ name: 'Размер', value: order.size_name, hexCode: null });
    }
    if (order.variant_name) {
      variantAttributes.push({ name: 'Вариант', value: order.variant_name, hexCode: null });
    }
  }

  // Get product ID from snapshot or order
  const productId = snapshot.product_id || order.product || order.product_id;

  // Image navigation handlers
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/orders')}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
            <path d="M17 9H5.414l3.293-3.293a1 1 0 00-1.414-1.414l-5 5a1 1 0 000 1.414l5 5a1 1 0 001.414-1.414L5.414 11H17a1 1 0 100-2z"/>
          </svg>
          Назад к заказам
        </button>
        <div style={styles.headerRight}>
          {!isCancelled && !isDelivered && (
            <button
              style={{
                ...styles.cancelBtn,
                backgroundColor: hoveredBtn === 'cancel' ? '#fecaca' : '#fee2e2',
              }}
              onMouseEnter={() => setHoveredBtn('cancel')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => setShowCancelModal(true)}
            >
              Отменить заказ
            </button>
          )}
        </div>
      </div>

      {/* Title Row */}
      <div style={styles.titleSection}>
        <div style={styles.titleLeft}>
          <h1 style={styles.title}>#{order.order_number}</h1>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: isCancelled ? '#fee2e2' : isDelivered ? '#d1fae5' : '#fef3c7',
            color: isCancelled ? '#991b1b' : isDelivered ? '#065f46' : '#92400e',
          }}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
          <span style={{
            ...styles.typeBadge,
            backgroundColor: order.order_type === 'roznica' ? '#dbeafe' : '#fef3c7',
            color: order.order_type === 'roznica' ? '#1d4ed8' : '#92400e',
          }}>
            {order.order_type === 'roznica' ? 'Розница' : 'Оптом'}
          </span>
        </div>
        <span style={styles.titleDate}>Создан: {formatDateTime(order.created_at)}</span>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button onClick={() => setError(null)} style={styles.bannerClose}>×</button>
        </div>
      )}
      {successMessage && (
        <div style={styles.successBanner}>
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.mainColumn}>
          {/* Order Status Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Статус заказа</h2>
            </div>
            <div style={styles.cardBody}>
              {isCancelled ? (
                <div style={styles.cancelledBanner}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#991b1b">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                  </svg>
                  <div>
                    <p style={styles.cancelledTitle}>Заказ отменён</p>
                    {order.cancel_reason && (
                      <p style={styles.cancelledReason}>Причина: {order.cancel_reason}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.statusTracker}>
                  {STATUSES.map((status, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                      <div key={status.key} style={styles.statusStep}>
                        <div style={{
                          ...styles.statusDot,
                          backgroundColor: isCompleted ? '#d1fae5' : isCurrent ? '#fef3c7' : '#f6f6f7',
                          borderColor: isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#e1e3e5',
                          color: isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#8c9196',
                        }}>
                          {StatusIcons[status.key]}
                        </div>
                        <div style={styles.statusLabel}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: isCurrent ? 600 : 400,
                            color: isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#8c9196',
                          }}>
                            {status.label}
                          </span>
                          {isCurrent && <span style={styles.currentLabel}>Текущий</span>}
                        </div>
                        {index < STATUSES.length - 1 && (
                          <div style={{
                            ...styles.statusLine,
                            backgroundColor: isCompleted ? '#10b981' : '#e1e3e5',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {isDelivered && (
                <div style={styles.deliveredBanner}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#065f46" style={{ marginRight: 8 }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Заказ успешно доставлен
                </div>
              )}
            </div>
          </div>

          {/* Product Details Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Товар в заказе</h2>
            </div>
            <div style={styles.cardBody}>
              {/* Product Card - Two Column Layout */}
              <div style={styles.productCardSplit}>
                {/* Left Side - Product Info (bigger) */}
                <div
                  style={styles.productInfoSide}
                  onClick={() => productId && navigate(`/products/${productId}`)}
                >
                  <h3 style={styles.productNameLarge}>{snapshot.name || order.product_name || 'Товар'}</h3>

                  {(snapshot.sku || snapshot.variant_sku || order.product_sku) && (
                    <div style={styles.skuRow}>
                      <span style={styles.skuLabel}>Артикул:</span>
                      <span style={styles.skuValue}>{snapshot.variant_sku || snapshot.sku || order.product_sku}</span>
                    </div>
                  )}

                  {/* Category and Brand */}
                  <div style={styles.metaRow}>
                    {snapshot.category && (
                      <span style={styles.metaItem}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196" style={{marginRight: 4}}>
                          <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-3.414-3.414A2 2 0 0010.586 2H6zm5 1.414L14.586 7H12a1 1 0 01-1-1V3.414z"/>
                        </svg>
                        {snapshot.category}
                      </span>
                    )}
                    {snapshot.brand && (
                      <span style={styles.metaItem}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196" style={{marginRight: 4}}>
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 15.66v-4.193l2.7 1.157a2 2 0 001.593 0l2.7-1.157v4.193a9.026 9.026 0 01-2.3.913 9.036 9.036 0 01-2.4 0zM15 10.12l1.69-.724a11.115 11.115 0 01.25 3.762 1 1 0 01-.89.89 8.97 8.97 0 00-1.05.174V10.12z"/>
                        </svg>
                        {snapshot.brand}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Variants Info */}
                  {variantAttributes.length > 0 && (
                    <div style={styles.variantsSectionNew}>
                      <div style={styles.variantsSectionTitle}>Выбранные параметры</div>
                      <div style={styles.variantsGrid}>
                        {variantAttributes.map((attr, idx) => (
                          <div key={idx} style={styles.variantCard}>
                            <span style={styles.variantCardLabel}>{attr.name}</span>
                            <div style={styles.variantCardValue}>
                              {attr.hexCode && (
                                <span style={{
                                  ...styles.colorDotLarge,
                                  backgroundColor: attr.hexCode,
                                }} />
                              )}
                              <span style={styles.variantCardText}>{attr.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div style={styles.orderInfoSection}>
                    <div style={styles.orderInfoRow}>
                      <div style={styles.orderInfoItem}>
                        <span style={styles.orderInfoLabel}>Количество</span>
                        <span style={styles.orderInfoValue}>{quantity} шт</span>
                      </div>
                      <div style={styles.orderInfoItem}>
                        <span style={styles.orderInfoLabel}>Цена за единицу</span>
                        <span style={styles.orderInfoValuePrice}>{formatMoney(unitPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Click hint */}
                  {productId && (
                    <div style={styles.clickHintNew}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="#2c6ecb">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                      </svg>
                      <span>Открыть страницу товара</span>
                    </div>
                  )}
                </div>

                {/* Right Side - Image Gallery (smaller) */}
                <div style={styles.productGallerySide}>
                  <div style={styles.galleryContainer}>
                    {hasImages ? (
                      <>
                        <img
                          src={productImages[currentImageIndex]}
                          alt={order.product_name}
                          style={styles.galleryImage}
                        />
                        {/* Navigation arrows - only show if multiple images */}
                        {productImages.length > 1 && (
                          <>
                            <button
                              style={styles.galleryArrowLeft}
                              onClick={prevImage}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.4)'}
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
                                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                              </svg>
                            </button>
                            <button
                              style={styles.galleryArrowRight}
                              onClick={nextImage}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.4)'}
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
                                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
                              </svg>
                            </button>
                            {/* Image counter */}
                            <div style={styles.imageCounter}>
                              {currentImageIndex + 1} / {productImages.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div style={styles.galleryPlaceholder}>
                        <svg width="48" height="48" viewBox="0 0 20 20" fill="#c9cccf">
                          <path d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zm3.25 3a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm9.75 3.5l-3-3-4.5 4.5-1.5-1.5-4 4V16h12a.5.5 0 00.5-.5v-4.5z"/>
                        </svg>
                        <span style={styles.galleryPlaceholderText}>Нет фото</span>
                      </div>
                    )}
                  </div>
                  {/* Thumbnail dots */}
                  {productImages.length > 1 && (
                    <div style={styles.thumbnailDots}>
                      {productImages.map((_, idx) => (
                        <button
                          key={idx}
                          style={{
                            ...styles.thumbnailDot,
                            backgroundColor: idx === currentImageIndex ? '#303030' : '#c9cccf',
                          }}
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div style={styles.pricingSection}>
                <div style={styles.pricingRow}>
                  <span>Подытог ({quantity} шт × {formatMoney(unitPrice)})</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ ...styles.pricingRow, color: '#10b981' }}>
                    <span>Скидка</span>
                    <span>- {formatMoney(discount)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div style={styles.pricingRow}>
                    <span>Доставка</span>
                    <span>{formatMoney(shipping)}</span>
                  </div>
                )}
                <div style={styles.pricingTotal}>
                  <span>Итого к оплате</span>
                  <span style={styles.totalAmount}>{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* History Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>История заказа</h2>
            </div>
            <div style={styles.cardBody}>
              {history.length > 0 ? (
                <div style={styles.historyList}>
                  {history.map((item, idx) => (
                    <div key={item.id || idx} style={styles.historyItem}>
                      <div style={styles.historyDot} />
                      <div style={styles.historyContent}>
                        <div style={styles.historyHeader}>
                          <span style={styles.historyTitle}>
                            {item.from_status_display || 'Создан'} → {item.to_status_display}
                          </span>
                          <span style={styles.historyTime}>{formatDateTime(item.created_at)}</span>
                        </div>
                        <span style={styles.historyUser}>
                          {item.changed_by_admin ? 'Администратор' : (item.employee_name || 'Сотрудник')}
                        </span>
                        {item.notes && <p style={styles.historyNotes}>{item.notes}</p>}
                      </div>
                      {idx < history.length - 1 && <div style={styles.historyLine} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>История пуста</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.sideColumn}>
          {/* Client Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Клиент</h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.clientRow}>
                <div style={styles.clientAvatar}>
                  {(order.client_name || '?')[0].toUpperCase()}
                </div>
                <div style={styles.clientInfo}>
                  <span style={styles.clientName}>{order.client_name || '—'}</span>
                  <span style={styles.clientUsername}>{order.client_username}</span>
                </div>
              </div>
              {order.client_phone && (
                <div style={styles.contactRow}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <span>{order.client_phone}</span>
                </div>
              )}
              {order.client_email && (
                <div style={styles.contactRow}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <span>{order.client_email}</span>
                </div>
              )}
              <button
                style={styles.viewClientBtn}
                onClick={() => navigate(`/clients/${order.client}`)}
              >
                Профиль клиента →
              </button>
            </div>
          </div>

          {/* Payment Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Оплата</h2>
            </div>
            <div style={styles.cardBody}>
              <div style={{
                ...styles.paymentStatus,
                backgroundColor: order.is_paid ? '#d1fae5' : '#fef3c7',
                color: order.is_paid ? '#065f46' : '#92400e',
              }}>
                {order.is_paid ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: 6 }}>
                      <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/>
                    </svg>
                    Оплачено
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: 6 }}>
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
                    </svg>
                    Ожидает оплаты
                  </>
                )}
              </div>
              {order.is_paid ? (
                <div style={styles.paymentDetails}>
                  <div style={styles.paymentRow}>
                    <span style={styles.paymentLabel}>Сумма</span>
                    <span style={styles.paymentValue}>{formatMoney(total)}</span>
                  </div>
                  {order.payment_method && (
                    <div style={styles.paymentRow}>
                      <span style={styles.paymentLabel}>Способ</span>
                      <span style={styles.paymentValue}>{order.payment_method}</span>
                    </div>
                  )}
                  {order.paid_at && (
                    <div style={styles.paymentRow}>
                      <span style={styles.paymentLabel}>Дата</span>
                      <span style={styles.paymentValue}>{formatDateTime(order.paid_at)}</span>
                    </div>
                  )}
                </div>
              ) : (
                !isCancelled && (
                  <button
                    style={{
                      ...styles.paymentBtn,
                      backgroundColor: hoveredBtn === 'pay' ? '#059669' : '#10b981',
                    }}
                    onMouseEnter={() => setHoveredBtn('pay')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={confirmPayment}
                    disabled={advancing}
                  >
                    {advancing ? 'Обработка...' : 'Подтвердить оплату'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Delivery Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Доставка</h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.addressBlock}>
                <div style={styles.addressItem}>
                  <span style={styles.addressLabel}>ОТКУДА</span>
                  <span style={styles.addressValue}>{order.address_from || 'Склад Стамбул'}</span>
                </div>
                <div style={styles.addressArrow}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
                    <path d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 14.586V4a1 1 0 011-1z"/>
                  </svg>
                </div>
                <div style={styles.addressItem}>
                  <span style={styles.addressLabel}>КУДА</span>
                  <span style={styles.addressValue}>{order.address_to || '—'}</span>
                </div>
              </div>
              {order.tracking_number && (
                <div style={styles.trackingRow}>
                  <span style={styles.trackingLabel}>Трек-номер</span>
                  <span style={styles.trackingValue}>{order.tracking_number}</span>
                </div>
              )}
              {order.estimated_delivery && (
                <div style={styles.trackingRow}>
                  <span style={styles.trackingLabel}>Ожидаемая доставка</span>
                  <span style={styles.trackingValue}>{formatDate(order.estimated_delivery)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          {order.notes && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Примечания</h2>
              </div>
              <div style={styles.cardBody}>
                <p style={styles.notesText}>{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Отмена заказа</h2>
            <p style={styles.modalSubtitle}>Укажите причину отмены заказа #{order.order_number}</p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Причина отмены (обязательно)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setShowCancelModal(false)}>
                Отмена
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleCancelOrder}
                disabled={advancing || !cancelReason.trim()}
              >
                {advancing ? 'Обработка...' : 'Отменить заказ'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
  },
  cancelBtn: {
    padding: '6px 12px',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#991b1b',
    cursor: 'pointer',
  },

  titleSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  titleDate: {
    fontSize: '13px',
    color: '#6d7175',
  },

  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  successBanner: {
    padding: '12px 16px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  bannerClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#991b1b',
  },

  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid #e1e3e5',
    backgroundColor: '#f6f6f7',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  cardBody: {
    padding: '16px',
  },

  // Status tracker
  statusTracker: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  statusStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative',
    paddingBottom: '16px',
  },
  statusDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  statusLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  currentLabel: {
    fontSize: '10px',
    color: '#f59e0b',
    fontWeight: '500',
  },
  statusLine: {
    position: 'absolute',
    left: '19px',
    top: '42px',
    width: '2px',
    height: '16px',
  },
  cancelledBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
  },
  cancelledTitle: {
    margin: 0,
    fontWeight: '600',
    color: '#991b1b',
    fontSize: '14px',
  },
  cancelledReason: {
    margin: '4px 0 0 0',
    color: '#991b1b',
    fontSize: '13px',
  },
  deliveredBanner: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product Card - Split Layout
  productCardSplit: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
  },
  productInfoSide: {
    flex: 1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  productGallerySide: {
    width: '200px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  productNameLarge: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    lineHeight: '1.3',
  },
  skuRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  skuLabel: {
    fontSize: '12px',
    color: '#8c9196',
  },
  skuValue: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#6d7175',
    backgroundColor: '#e4e5e7',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '4px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6d7175',
  },
  variantsSectionNew: {
    marginTop: '4px',
    paddingTop: '12px',
    borderTop: '1px solid #e1e3e5',
  },
  variantsSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#8c9196',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  },
  variantsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  variantCard: {
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    padding: '8px 12px',
    minWidth: '80px',
  },
  variantCardLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '500',
    color: '#8c9196',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  variantCardValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  variantCardText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  colorDotLarge: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  orderInfoSection: {
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #e1e3e5',
  },
  orderInfoRow: {
    display: 'flex',
    gap: '16px',
  },
  orderInfoItem: {
    flex: 1,
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  orderInfoLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#8c9196',
    marginBottom: '4px',
  },
  orderInfoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#303030',
  },
  orderInfoValuePrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c6ecb',
  },
  clickHintNew: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#2c6ecb',
    marginTop: '4px',
    paddingTop: '8px',
  },

  // Gallery
  galleryContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f7',
    gap: '8px',
  },
  galleryPlaceholderText: {
    fontSize: '12px',
    color: '#8c9196',
  },
  galleryArrowLeft: {
    position: 'absolute',
    left: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  galleryArrowRight: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  imageCounter: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '500',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  thumbnailDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  thumbnailDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  pricingSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e1e3e5',
  },
  pricingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6d7175',
    marginBottom: '8px',
  },
  pricingTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    paddingTop: '12px',
    marginTop: '8px',
    borderTop: '1px solid #e1e3e5',
  },
  totalAmount: {
    color: '#2c6ecb',
    fontSize: '18px',
  },

  // History
  historyList: {
    display: 'flex',
    flexDirection: 'column',
  },
  historyItem: {
    display: 'flex',
    gap: '12px',
    position: 'relative',
  },
  historyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#2c6ecb',
    marginTop: '4px',
    flexShrink: 0,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: '4px',
    top: '14px',
    width: '2px',
    height: 'calc(100% - 4px)',
    backgroundColor: '#e1e3e5',
  },
  historyContent: {
    flex: 1,
    paddingBottom: '16px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px',
  },
  historyTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
  },
  historyTime: {
    fontSize: '11px',
    color: '#8c9196',
  },
  historyUser: {
    fontSize: '12px',
    color: '#6d7175',
  },
  historyNotes: {
    margin: '6px 0 0 0',
    fontSize: '12px',
    color: '#6d7175',
    fontStyle: 'italic',
  },

  // Client
  clientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  clientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6d7175',
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  clientName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  clientUsername: {
    fontSize: '12px',
    color: '#8c9196',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '13px',
    color: '#303030',
    borderTop: '1px solid #f1f1f1',
  },
  viewClientBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },

  // Payment
  paymentStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  paymentDetails: {
    marginTop: '12px',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px',
  },
  paymentLabel: {
    color: '#6d7175',
  },
  paymentValue: {
    color: '#303030',
    fontWeight: '500',
  },
  paymentBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '10px 16px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },

  // Delivery
  addressBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  addressItem: {
    padding: '10px 12px',
    backgroundColor: '#f6f6f7',
    borderRadius: '8px',
  },
  addressLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    color: '#8c9196',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  addressValue: {
    fontSize: '13px',
    color: '#303030',
    fontWeight: '500',
  },
  addressArrow: {
    textAlign: 'center',
    padding: '4px 0',
  },
  trackingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    marginTop: '8px',
    borderTop: '1px solid #f1f1f1',
  },
  trackingLabel: {
    fontSize: '12px',
    color: '#6d7175',
  },
  trackingValue: {
    fontSize: '13px',
    color: '#303030',
    fontWeight: '500',
  },

  // Notes
  notesText: {
    margin: 0,
    fontSize: '13px',
    color: '#303030',
    lineHeight: '1.5',
  },

  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6d7175',
  },
  emptyText: {
    margin: 0,
    fontSize: '13px',
    color: '#8c9196',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    maxWidth: '440px',
    margin: '20px',
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
  },
  modalSubtitle: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6d7175',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
  modalCancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f6f6f7',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '8px 16px',
    backgroundColor: '#d72c0d',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default OrderDetail;
