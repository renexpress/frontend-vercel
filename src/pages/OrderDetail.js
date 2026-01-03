import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const STATUS_LABELS = {
  awaiting_payment: 'Ожидает оплаты',
  istanbul_warehouse: 'На складе в Стамбуле',
  to_moscow: 'В дороге до Москвы',
  moscow_warehouse: 'На складе в Москве',
  to_address: 'В дороге до адреса',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUSES = [
  { key: 'awaiting_payment', label: 'Ожидает оплаты' },
  { key: 'istanbul_warehouse', label: 'Склад Стамбул' },
  { key: 'to_moscow', label: 'В пути до Москвы' },
  { key: 'moscow_warehouse', label: 'Склад Москва' },
  { key: 'to_address', label: 'Доставка' },
  { key: 'delivered', label: 'Доставлен' },
];

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => { loadOrder(); }, [id]);
  useEffect(() => { if (order) loadOrderHistory(); }, [order]);

  const loadOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/`);
      if (!response.ok) throw new Error('Order not found');
      setOrder(await response.json());
    } catch (err) {
      setError('Не удалось загрузить заказ');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/history/`);
      const data = await response.json();
      if (data.success) setHistory(data.history);
    } catch (err) {}
  };

  const confirmPayment = async () => {
    setAdvancing(true);
    try {
      const response = await fetch(`${API_URL}/orders/${id}/confirm_payment/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        setSuccessMessage('Оплата подтверждена');
        loadOrderHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Ошибка подтверждения');
    } finally {
      setAdvancing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { setError('Укажите причину'); return; }
    setAdvancing(true);
    try {
      await fetch(`${API_URL}/orders/${id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      setOrder(prev => ({ ...prev, status: 'cancelled', cancel_reason: cancelReason }));
      setSuccessMessage('Заказ отменён');
      setShowCancelModal(false);
      setCancelReason('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {} finally { setAdvancing(false); }
  };

  const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('ru-RU') : '—';
  const formatDateTime = (ds) => ds ? new Date(ds).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatMoney = (a) => a ? Number(a).toLocaleString('ru-RU') + ' ₽' : '—';
  const getStatusIndex = (s) => STATUSES.findIndex(st => st.key === s);

  if (loading) return <div style={styles.page}><div style={styles.loading}>Загрузка...</div></div>;
  if (!order) return <div style={styles.page}><div style={styles.card}><p>Заказ не найден</p></div></div>;

  const snapshot = order.snapshot || order.product_snapshot || {};
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const currentIndex = getStatusIndex(order.status);

  // Get variant attributes
  const variantAttributes = [];
  if (order.variant_info?.attributes?.length) {
    order.variant_info.attributes.forEach(attr => {
      variantAttributes.push({ name: attr.name, value: attr.value, hexCode: attr.hex_code });
    });
  } else if (order.notes?.includes('Варианты:')) {
    const match = order.notes.match(/Варианты:\s*([^\n]+)/);
    if (match?.[1]) {
      match[1].split(',').forEach(pair => {
        const [name, ...vals] = pair.split(':');
        if (name && vals.length) variantAttributes.push({ name: name.trim(), value: vals.join(':').trim() });
      });
    }
  }

  // Get delivery comment from notes
  const deliveryComment = order.notes?.match(/Комментарий:\s*(.+)/)?.[1] || null;

  const productImage = order.variant_info?.image || order.product_image || snapshot.primary_image;

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={() => navigate('/orders')}>← Заказы</span>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbCurrent}>#{order.order_number}</span>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorBanner}>{error} <button onClick={() => setError(null)} style={styles.bannerClose}>×</button></div>}
      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Order Header */}
          <div style={styles.card}>
            <div style={styles.orderHeader}>
              <div>
                <h1 style={styles.orderNumber}>#{order.order_number}</h1>
                <span style={styles.orderDate}>{formatDateTime(order.created_at)}</span>
              </div>
              <div style={styles.badges}>
                <span style={{...styles.badge, backgroundColor: isCancelled ? '#fee2e2' : isDelivered ? '#d1fae5' : '#fef3c7', color: isCancelled ? '#991b1b' : isDelivered ? '#065f46' : '#92400e'}}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span style={{...styles.badge, backgroundColor: order.order_type === 'roznica' ? '#dbeafe' : '#fef3c7', color: order.order_type === 'roznica' ? '#1d4ed8' : '#92400e'}}>
                  {order.order_type === 'roznica' ? 'Розница' : 'Оптом'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Tracker */}
          {!isCancelled && (
            <div style={styles.card}>
              <div style={styles.label}>Статус заказа</div>
              <div style={styles.statusTracker}>
                {STATUSES.map((status, idx) => {
                  const done = idx < currentIndex;
                  const current = idx === currentIndex;
                  return (
                    <div key={status.key} style={styles.statusStep}>
                      <div style={{...styles.statusDot, backgroundColor: done ? '#10b981' : current ? '#f59e0b' : '#e5e7eb'}} />
                      <span style={{...styles.statusLabel, color: done ? '#10b981' : current ? '#f59e0b' : '#9ca3af', fontWeight: current ? 600 : 400}}>{status.label}</span>
                      {idx < STATUSES.length - 1 && <div style={{...styles.statusLine, backgroundColor: done ? '#10b981' : '#e5e7eb'}} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div style={{...styles.card, backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
              <div style={{color: '#991b1b', fontWeight: 600}}>Заказ отменён</div>
              {order.cancel_reason && <div style={{color: '#991b1b', fontSize: 13, marginTop: 4}}>Причина: {order.cancel_reason}</div>}
            </div>
          )}

          {/* Product Info */}
          <div style={styles.card}>
            <div style={styles.label}>Товар</div>
            <div style={styles.productRow}>
              {productImage && (
                <img src={productImage} alt="" style={styles.productImage} />
              )}
              <div style={styles.productInfo}>
                <div style={styles.productName}>{snapshot.name || order.product_name}</div>
                {(snapshot.sku || order.product_sku) && (
                  <div style={styles.sku}>Артикул: {snapshot.variant_sku || snapshot.sku || order.product_sku}</div>
                )}
              </div>
            </div>

            {/* Variant Attributes */}
            {variantAttributes.length > 0 && (
              <div style={styles.section}>
                <div style={styles.labelSmall}>Параметры</div>
                <div style={styles.variantsGrid}>
                  {variantAttributes.map((attr, idx) => (
                    <div key={idx} style={styles.variantChip}>
                      <span style={styles.variantName}>{attr.name}:</span>
                      {attr.hexCode && <span style={{...styles.colorDot, backgroundColor: attr.hexCode}} />}
                      <span style={styles.variantValue}>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div style={styles.pricingGrid}>
              <div style={styles.pricingItem}>
                <span style={styles.pricingLabel}>Количество</span>
                <span style={styles.pricingValue}>{order.quantity} шт</span>
              </div>
              <div style={styles.pricingItem}>
                <span style={styles.pricingLabel}>Цена</span>
                <span style={styles.pricingValue}>{formatMoney(order.unit_price)}</span>
              </div>
              <div style={styles.pricingItem}>
                <span style={styles.pricingLabel}>Итого</span>
                <span style={{...styles.pricingValue, color: '#2563eb', fontWeight: 600}}>{formatMoney(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div style={styles.card}>
            <div style={styles.label}>Доставка</div>
            <div style={styles.addressRow}>
              <div style={styles.addressBlock}>
                <span style={styles.addressLabel}>Откуда</span>
                <span style={styles.addressValue}>{order.address_from || 'Склад Стамбул'}</span>
              </div>
              <span style={styles.arrow}>→</span>
              <div style={styles.addressBlock}>
                <span style={styles.addressLabel}>Куда</span>
                <span style={styles.addressValue}>{order.address_to || '—'}</span>
              </div>
            </div>
            {deliveryComment && (
              <div style={styles.commentBlock}>
                <span style={styles.labelSmall}>Комментарий к доставке</span>
                <span style={styles.commentText}>{deliveryComment}</span>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={styles.card}>
              <div style={styles.label}>История</div>
              <div style={styles.historyList}>
                {history.map((item, idx) => (
                  <div key={idx} style={styles.historyItem}>
                    <span style={styles.historyDot} />
                    <div style={styles.historyContent}>
                      <span style={styles.historyTitle}>{item.from_status_display || 'Создан'} → {item.to_status_display}</span>
                      <span style={styles.historyTime}>{formatDateTime(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Client */}
          <div style={styles.card}>
            <div style={styles.label}>Клиент</div>
            <div style={styles.clientInfo}>
              <div style={styles.clientAvatar}>{(order.client_name || '?')[0].toUpperCase()}</div>
              <div>
                <div style={styles.clientName}>{order.client_name || '—'}</div>
                <div style={styles.clientUsername}>{order.client_username}</div>
              </div>
            </div>
            {order.client_phone && <div style={styles.contactRow}>📞 {order.client_phone}</div>}
            <button style={styles.linkBtn} onClick={() => navigate(`/clients/${order.client}`)}>Профиль клиента →</button>
          </div>

          {/* Payment */}
          <div style={styles.card}>
            <div style={styles.label}>Оплата</div>
            <div style={{...styles.paymentStatus, backgroundColor: order.is_paid ? '#d1fae5' : '#fef3c7', color: order.is_paid ? '#065f46' : '#92400e'}}>
              {order.is_paid ? '✓ Оплачено' : '⏳ Ожидает оплаты'}
            </div>
            <div style={styles.paymentAmount}>{formatMoney(order.total_amount)}</div>
            {!order.is_paid && !isCancelled && (
              <button style={styles.confirmBtn} onClick={confirmPayment} disabled={advancing}>
                {advancing ? 'Обработка...' : 'Подтвердить оплату'}
              </button>
            )}
          </div>

          {/* Actions */}
          {!isCancelled && !isDelivered && (
            <div style={styles.card}>
              <button style={styles.cancelBtn} onClick={() => setShowCancelModal(true)}>Отменить заказ</button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Отмена заказа</h3>
            <textarea style={styles.textarea} placeholder="Причина отмены..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} />
            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setShowCancelModal(false)}>Отмена</button>
              <button style={styles.modalConfirmBtn} onClick={handleCancelOrder} disabled={advancing || !cancelReason.trim()}>
                {advancing ? '...' : 'Отменить заказ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '12px 16px', maxWidth: 1000, margin: '0 auto' },
  loading: { padding: 40, textAlign: 'center', color: '#6b7280' },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  breadcrumbLink: { fontSize: 13, color: '#2563eb', cursor: 'pointer' },
  breadcrumbSep: { color: '#9ca3af' },
  breadcrumbCurrent: { fontSize: 13, fontWeight: 600, color: '#111827' },

  errorBanner: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: 6, marginBottom: 12, fontSize: 13 },
  successBanner: { padding: '8px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 6, marginBottom: 12, fontSize: 13 },
  bannerClose: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#991b1b' },

  content: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  leftColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12 },
  rightColumn: { width: 280, display: 'flex', flexDirection: 'column', gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 },
  section: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' },

  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  labelSmall: { fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' },

  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' },
  orderDate: { fontSize: 12, color: '#6b7280' },
  badges: { display: 'flex', gap: 6 },
  badge: { padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },

  statusTracker: { display: 'flex', alignItems: 'center', gap: 0 },
  statusStep: { display: 'flex', alignItems: 'center', position: 'relative' },
  statusDot: { width: 10, height: 10, borderRadius: '50%' },
  statusLabel: { fontSize: 11, marginLeft: 4, whiteSpace: 'nowrap' },
  statusLine: { width: 24, height: 2, marginLeft: 4, marginRight: 4 },

  productRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  productImage: { width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid #e5e7eb' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 },
  sku: { fontSize: 12, color: '#6b7280' },

  variantsGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  variantChip: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: 4, fontSize: 12 },
  variantName: { color: '#6b7280' },
  variantValue: { fontWeight: 500, color: '#111827' },
  colorDot: { width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' },

  pricingGrid: { display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' },
  pricingItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  pricingLabel: { fontSize: 11, color: '#6b7280' },
  pricingValue: { fontSize: 14, fontWeight: 500, color: '#111827' },

  addressRow: { display: 'flex', alignItems: 'center', gap: 12 },
  addressBlock: { flex: 1, padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 6 },
  addressLabel: { display: 'block', fontSize: 10, color: '#6b7280', marginBottom: 2, textTransform: 'uppercase' },
  addressValue: { fontSize: 13, color: '#111827' },
  arrow: { color: '#9ca3af', fontSize: 16 },
  commentBlock: { marginTop: 12, padding: '8px 10px', backgroundColor: '#fffbeb', borderRadius: 6, border: '1px solid #fef3c7' },
  commentText: { fontSize: 13, color: '#92400e' },

  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  historyDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb', marginTop: 4 },
  historyContent: { flex: 1, display: 'flex', justifyContent: 'space-between' },
  historyTitle: { fontSize: 12, color: '#374151' },
  historyTime: { fontSize: 11, color: '#9ca3af' },

  clientInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  clientAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#6b7280' },
  clientName: { fontSize: 14, fontWeight: 600, color: '#111827' },
  clientUsername: { fontSize: 12, color: '#6b7280' },
  contactRow: { fontSize: 13, color: '#374151', padding: '6px 0', borderTop: '1px solid #f3f4f6' },
  linkBtn: { width: '100%', marginTop: 8, padding: '6px 10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' },

  paymentStatus: { padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 8 },
  paymentAmount: { fontSize: 18, fontWeight: 600, color: '#111827', textAlign: 'center', marginBottom: 8 },
  confirmBtn: { width: '100%', padding: '8px 12px', backgroundColor: '#10b981', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  cancelBtn: { width: '100%', padding: '8px 12px', backgroundColor: '#fee2e2', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#991b1b', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#111827' },
  textarea: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  modalCancelBtn: { padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
  modalConfirmBtn: { padding: '6px 12px', backgroundColor: '#dc2626', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
};

export default OrderDetail;
