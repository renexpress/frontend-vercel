import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function PoshivOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const STATUS_CONFIG = {
    draft: { label: 'Черновик', bg: '#f6f6f7', color: '#6d7175' },
    awaiting_payment: { label: 'Ожидание оплаты', bg: '#fff8e6', color: '#b88c1a' },
    confirmed: { label: 'Подтверждён', bg: '#eef2ff', color: '#5c6ac4' },
    in_production: { label: 'В производстве', bg: '#fce7f3', color: '#9d174d' },
    ready: { label: 'Готов', bg: '#e0f5f5', color: '#00a0ac' },
    shipped: { label: 'Отправлен', bg: '#dbeafe', color: '#1d4ed8' },
    delivered: { label: 'Доставлен', bg: '#e3f4e8', color: '#1a7f37' },
    cancelled: { label: 'Отменён', bg: '#fef2f2', color: '#d72c0d' },
  };

  const STATUS_FLOW = [
    'draft',
    'awaiting_payment',
    'confirmed',
    'in_production',
    'ready',
    'shipped',
    'delivered',
  ];

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/poshiv-orders/${id}/`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setFormData(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/poshiv-orders/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          estimated_price: formData.estimated_price,
          final_price: formData.final_price,
          is_paid: formData.is_paid,
          production_notes: formData.production_notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusDropdown(false);
    try {
      const res = await fetch(`${API_URL}/poshiv-orders/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setFormData(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const res = await fetch(`${API_URL}/poshiv-orders/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paid: true, status: 'confirmed' }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setFormData(data.order);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  const getStatusIndex = (status) => STATUS_FLOW.indexOf(status);

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
        <div style={styles.notFound}>Заказ не найден</div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate('/poshiv-orders')}
          style={{
            ...styles.backBtn,
            backgroundColor: hoveredBtn === 'back' ? '#f6f6f7' : 'transparent',
          }}
          onMouseEnter={() => setHoveredBtn('back')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
          </svg>
          Заказы пошива
        </button>

        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{order.order_number}</h1>
          <span style={{
            ...styles.headerStatus,
            backgroundColor: statusConfig.bg,
            color: statusConfig.color,
          }}>
            {statusConfig.label}
          </span>
        </div>

        <div style={styles.headerActions}>
          {!isEditing ? (
            <button
              style={{
                ...styles.editBtn,
                backgroundColor: hoveredBtn === 'edit' ? '#1a1a1a' : '#303030',
              }}
              onClick={() => setIsEditing(true)}
              onMouseEnter={() => setHoveredBtn('edit')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#fff">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              Редактировать
            </button>
          ) : (
            <>
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                style={{
                  ...styles.cancelBtn,
                  backgroundColor: hoveredBtn === 'cancel' ? '#f6f6f7' : '#fff',
                }}
                onClick={() => { setIsEditing(false); setFormData(order); }}
                onMouseEnter={() => setHoveredBtn('cancel')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div style={styles.timelineCard}>
        <div style={styles.timeline}>
          {STATUS_FLOW.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            return (
              <div key={status} style={styles.timelineItem}>
                <div style={{
                  ...styles.timelineDot,
                  backgroundColor: isCompleted ? '#303030' : '#e1e3e5',
                  border: isCurrent ? '3px solid #303030' : 'none',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(48,48,48,0.2)' : 'none',
                }}>
                  {isCompleted && !isCurrent && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#fff">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <div style={{
                    ...styles.timelineLine,
                    backgroundColor: index < currentStatusIndex ? '#303030' : '#e1e3e5',
                  }}/>
                )}
                <div style={{
                  ...styles.timelineLabel,
                  color: isCompleted ? '#303030' : '#8c9196',
                  fontWeight: isCurrent ? '600' : '400',
                }}>
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Product Image */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Изображение</h2>
            </div>
            <div style={styles.imageContainer}>
              {order.image_url ? (
                <img src={order.image_url} alt="Заказ" style={styles.orderImage} />
              ) : (
                <div style={styles.noImage}>
                  <svg width="48" height="48" viewBox="0 0 20 20" fill="#c9cccf">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                  <span>Нет изображения</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Детали заказа</h2>
            </div>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Тип изделия</span>
                <span style={styles.detailValue}>{order.item_type || '—'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Материал</span>
                <span style={styles.detailValue}>{order.material || '—'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Цвет</span>
                <span style={styles.detailValue}>{order.color || '—'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Размер</span>
                <span style={styles.detailValue}>{order.size || '—'}</span>
              </div>
            </div>

            {order.description && (
              <div style={styles.descriptionSection}>
                <span style={styles.detailLabel}>Описание</span>
                <p style={styles.description}>{order.description}</p>
              </div>
            )}

            {order.details && (
              <div style={styles.descriptionSection}>
                <span style={styles.detailLabel}>Дополнительно</span>
                <p style={styles.description}>{order.details}</p>
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {order.customer_notes && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Заметки клиента</h2>
              </div>
              <div style={styles.cardBody}>
                <p style={styles.notes}>{order.customer_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Client Info */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Клиент</h2>
              <button
                style={{
                  ...styles.viewClientBtn,
                  backgroundColor: hoveredBtn === 'viewClient' ? '#f6f6f7' : 'transparent',
                }}
                onClick={() => navigate(`/clients/${order.client_id}`)}
                onMouseEnter={() => setHoveredBtn('viewClient')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Открыть
                <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div style={styles.clientSection}>
              <div style={styles.clientAvatar}>
                {(order.client_name || '?')[0].toUpperCase()}
              </div>
              <div style={styles.clientInfo}>
                <span style={styles.clientName}>{order.client_name}</span>
                <span style={styles.clientUsername}>{order.client_username}</span>
              </div>
            </div>
            {order.address && (
              <div style={styles.addressSection}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span style={styles.address}>{order.address}</span>
              </div>
            )}
          </div>

          {/* Payment & Status */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Оплата и статус</h2>
            </div>
            <div style={styles.cardBody}>
              {/* Payment Status */}
              <div style={styles.paymentRow}>
                <span style={styles.paymentLabel}>Статус оплаты</span>
                <span style={{
                  ...styles.paymentBadge,
                  backgroundColor: order.is_paid ? '#e3f4e8' : '#fff8e6',
                  color: order.is_paid ? '#1a7f37' : '#b88c1a',
                }}>
                  {order.is_paid ? 'Оплачено' : 'Ожидает оплаты'}
                </span>
              </div>

              {!order.is_paid && order.status === 'awaiting_payment' && (
                <button
                  style={{
                    ...styles.confirmPaymentBtn,
                    backgroundColor: hoveredBtn === 'confirm' ? '#148c3b' : '#1a7f37',
                  }}
                  onClick={handleConfirmPayment}
                  onMouseEnter={() => setHoveredBtn('confirm')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Подтвердить оплату
                </button>
              )}

              {/* Order Status */}
              <div style={styles.statusRow}>
                <span style={styles.paymentLabel}>Статус заказа</span>
                <div style={styles.statusDropdownWrapper}>
                  <button
                    style={{
                      ...styles.statusDropdownBtn,
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.color,
                    }}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    {statusConfig.label}
                    <svg width="12" height="12" viewBox="0 0 20 20" fill={statusConfig.color}>
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <div style={styles.statusDropdown}>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div
                          key={key}
                          style={{
                            ...styles.statusOption,
                            backgroundColor: order.status === key ? '#f6f6f7' : 'transparent',
                          }}
                          onClick={() => handleStatusChange(key)}
                        >
                          <span style={{
                            ...styles.statusOptionDot,
                            backgroundColor: config.color,
                          }}/>
                          {config.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Prices */}
              <div style={styles.pricesSection}>
                <div style={styles.priceRow}>
                  <span style={styles.priceLabel}>Предварительная цена</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.estimated_price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_price: e.target.value }))}
                      style={styles.priceInput}
                      placeholder="0"
                    />
                  ) : (
                    <span style={styles.priceValue}>{formatMoney(order.estimated_price)}</span>
                  )}
                </div>
                <div style={styles.priceRow}>
                  <span style={styles.priceLabel}>Финальная цена</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.final_price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, final_price: e.target.value }))}
                      style={styles.priceInput}
                      placeholder="0"
                    />
                  ) : (
                    <span style={styles.finalPrice}>{formatMoney(order.final_price)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Production Notes */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Заметки производства</h2>
            </div>
            <div style={styles.cardBody}>
              {isEditing ? (
                <textarea
                  value={formData.production_notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, production_notes: e.target.value }))}
                  style={styles.notesTextarea}
                  placeholder="Добавьте заметки для производства..."
                  rows={4}
                />
              ) : (
                <p style={styles.notes}>{order.production_notes || 'Нет заметок'}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div style={styles.metaCard}>
            <div style={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              <span>Создан: {formatDate(order.created_at)}</span>
            </div>
            <div style={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              <span>Обновлён: {formatDate(order.updated_at)}</span>
            </div>
          </div>
        </div>
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
  notFound: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6d7175',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#5c5f62',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  headerInfo: {
    flex: 1,
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
  headerStatus: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
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
  saveBtn: {
    padding: '8px 14px',
    backgroundColor: '#1a7f37',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
  },
  cancelBtn: {
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#303030',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    padding: '20px 24px',
    marginBottom: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  timeline: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  timelineDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: '12px',
    left: 'calc(50% + 12px)',
    right: 'calc(-50% + 12px)',
    height: '2px',
  },
  timelineLabel: {
    marginTop: '8px',
    fontSize: '11px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },

  // Main Grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '20px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #e1e3e5',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  cardBody: {
    padding: '16px 18px',
  },

  // Image
  imageContainer: {
    padding: '16px',
  },
  orderImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  noImage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#8c9196',
    fontSize: '13px',
    gap: '12px',
  },

  // Details Grid
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '16px 18px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#303030',
  },
  descriptionSection: {
    padding: '0 18px 16px',
    borderTop: '1px solid #f1f1f1',
    paddingTop: '16px',
  },
  description: {
    fontSize: '13px',
    color: '#303030',
    lineHeight: '1.6',
    margin: '8px 0 0 0',
  },
  notes: {
    fontSize: '13px',
    color: '#6d7175',
    lineHeight: '1.6',
    margin: 0,
  },

  // Client Section
  clientSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
    borderBottom: '1px solid #f1f1f1',
  },
  clientAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
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
  clientUsername: {
    fontSize: '12px',
    color: '#6d7175',
  },
  viewClientBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#5c5f62',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  addressSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '14px 18px',
  },
  address: {
    fontSize: '13px',
    color: '#303030',
    lineHeight: '1.5',
  },

  // Payment & Status
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  paymentLabel: {
    fontSize: '13px',
    color: '#6d7175',
  },
  paymentBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  confirmPaymentBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#1a7f37',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'background-color 0.15s',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f1f1',
  },
  statusDropdownWrapper: {
    position: 'relative',
  },
  statusDropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  statusDropdown: {
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
  statusOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#303030',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  statusOptionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  // Prices
  pricesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: '13px',
    color: '#6d7175',
  },
  priceValue: {
    fontSize: '14px',
    color: '#303030',
  },
  finalPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#303030',
  },
  priceInput: {
    width: '120px',
    padding: '6px 10px',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'right',
    outline: 'none',
  },
  notesTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  // Meta
  metaCard: {
    padding: '14px 18px',
    backgroundColor: '#f6f6f7',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6d7175',
  },
};

export default PoshivOrderDetail;
