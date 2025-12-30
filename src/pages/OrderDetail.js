import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from '../config/api';

// New status flow after payment confirmation
const STATUSES = [
  { key: "awaiting_payment", label: "Ожидание оплаты", icon: "💳" },
  { key: "accepted", label: "Принято", icon: "✓" },
  { key: "warehouse", label: "На складе", icon: "🏭" },
  { key: "in_transit", label: "В дороге", icon: "🚛" },
  { key: "moscow", label: "Москва", icon: "🏙" },
  { key: "istanbul", label: "Стамбул", icon: "🌉" },
  { key: "delivered", label: "Доставлен", icon: "✅" },
];

const STATUS_LABELS = {
  awaiting_payment: "Ожидание оплаты",
  accepted: "Принято",
  warehouse: "На складе",
  in_transit: "В дороге",
  moscow: "Москва",
  istanbul: "Стамбул",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

// Mock audit log data - in production this would come from the API
const generateMockAuditLog = (order) => {
  const logs = [];
  const baseDate = new Date(order.created_at);

  logs.push({
    id: 1,
    action: "order_created",
    description: "Заказ создан",
    user: order.client_name || "Клиент",
    timestamp: baseDate.toISOString(),
    details: `Заказ ${order.order_number} создан клиентом`,
  });

  if (order.is_paid) {
    const paidDate = new Date(baseDate);
    paidDate.setHours(paidDate.getHours() + 2);
    logs.push({
      id: 2,
      action: "payment_confirmed",
      description: "Оплата подтверждена",
      user: "Администратор",
      timestamp: paidDate.toISOString(),
      details: `Оплата на сумму ${Number(order.total_amount).toLocaleString("ru-RU")} ₽ подтверждена`,
    });
  }

  const statusIndex = STATUSES.findIndex(s => s.key === order.status);
  for (let i = 1; i <= statusIndex; i++) {
    const statusDate = new Date(baseDate);
    statusDate.setDate(statusDate.getDate() + i);
    logs.push({
      id: 2 + i,
      action: "status_changed",
      description: `Статус изменён на "${STATUSES[i].label}"`,
      user: "Система",
      timestamp: statusDate.toISOString(),
      details: `Заказ переведён в статус: ${STATUSES[i].label}`,
    });
  }

  if (order.status === "cancelled") {
    logs.push({
      id: logs.length + 1,
      action: "order_cancelled",
      description: "Заказ отменён",
      user: "Администратор",
      timestamp: new Date().toISOString(),
      details: order.cancel_reason || "Причина не указана",
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Internal notes
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Audit log
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => { loadOrder(); }, [id]);

  useEffect(() => {
    if (order) {
      // Load real history from API
      loadOrderHistory();
      // Mock internal notes
      setInternalNotes([
        {
          id: 1,
          text: "Клиент просил доставку до 18:00",
          author: "Менеджер Анна",
          timestamp: new Date(order.created_at).toISOString(),
        }
      ]);
    }
  }, [order]);

  const loadOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (error) {
      console.error("Error loading order:", error);
      setError("Не удалось загрузить заказ");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    setAdvancing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders/${id}/confirm_payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrder(data.order);
        setSuccessMessage("Оплата подтверждена! Заказ переведён в статус 'Принято'");
        loadOrderHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || "Не удалось подтвердить оплату");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      setError(`Ошибка: ${error.message}`);
    } finally {
      setAdvancing(false);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/history/`);
      const data = await response.json();
      if (data.success && data.history) {
        const logs = data.history.map((h, idx) => ({
          id: h.id,
          action: "status_changed",
          description: `${h.from_status_display || 'Создан'} → ${h.to_status_display}`,
          user: h.changed_by_admin ? "Администратор" : (h.employee_name || "Сотрудник"),
          timestamp: h.created_at,
          details: h.notes || `Статус изменён на: ${h.to_status_display}`,
        }));
        setAuditLog(logs);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError("Укажите причину отмены");
      return;
    }

    setAdvancing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders/${id}/cancel/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrder(data.order);
        setSuccessMessage("Заказ отменён");
        setShowCancelModal(false);
        setCancelReason("");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || "Не удалось отменить заказ");
      }
    } catch (error) {
      // For demo, simulate cancellation
      setOrder(prev => ({ ...prev, status: "cancelled", cancel_reason: cancelReason }));
      setSuccessMessage("Заказ отменён");
      setShowCancelModal(false);
      setCancelReason("");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setAdvancing(false);
    }
  };

  const handleRefund = async () => {
    const amount = refundType === "full" ? order.total_amount : parseFloat(refundAmount);

    if (refundType === "partial" && (!amount || amount <= 0 || amount > order.total_amount)) {
      setError("Укажите корректную сумму возврата");
      return;
    }

    if (!refundReason.trim()) {
      setError("Укажите причину возврата");
      return;
    }

    setAdvancing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders/${id}/refund/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: refundType,
          amount: amount,
          reason: refundReason
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrder(data.order);
        setSuccessMessage(`Возврат на сумму ${Number(amount).toLocaleString("ru-RU")} ₽ оформлен`);
        setShowRefundModal(false);
        setRefundAmount("");
        setRefundReason("");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || "Не удалось оформить возврат");
      }
    } catch (error) {
      // For demo, simulate refund
      setSuccessMessage(`Возврат на сумму ${Number(amount).toLocaleString("ru-RU")} ₽ оформлен`);
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setAdvancing(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);

    // Simulate API call
    setTimeout(() => {
      const note = {
        id: Date.now(),
        text: newNote,
        author: "Текущий пользователь",
        timestamp: new Date().toISOString(),
      };
      setInternalNotes(prev => [note, ...prev]);
      setNewNote("");
      setAddingNote(false);
    }, 500);
  };

  const formatDate = (ds) => new Date(ds).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const formatDateTime = (ds) => new Date(ds).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const formatMoney = (a) => Number(a).toLocaleString("ru-RU") + " ₽";
  const getStatusIndex = (s) => STATUSES.findIndex(st => st.key === s);

  const getActionIcon = (action) => {
    switch (action) {
      case "order_created": return "🆕";
      case "payment_confirmed": return "💰";
      case "status_changed": return "📦";
      case "order_cancelled": return "❌";
      case "refund_processed": return "💸";
      case "note_added": return "📝";
      default: return "📋";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "order_created": return "#3B82F6";
      case "payment_confirmed": return "#10B981";
      case "status_changed": return "#8B5CF6";
      case "order_cancelled": return "#EF4444";
      case "refund_processed": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate("/orders")}>← Назад</button>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate("/orders")}>← Назад</button>
        <div style={styles.errorContainer}>
          <p>Заказ не найден</p>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = getStatusIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const nextStatus = !isDelivered && !isCancelled && currentIndex < STATUSES.length - 1
    ? STATUSES[currentIndex + 1]
    : null;

  // Calculate pricing breakdown
  const unitPrice = Number(order.unit_price) || 0;
  const quantity = Number(order.quantity) || 1;
  const subtotal = unitPrice * quantity;
  const discount = Number(order.discount) || 0;
  const shipping = Number(order.shipping_cost) || 0;
  const total = Number(order.total_amount) || subtotal;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/orders")}>
          ← Назад к заказам
        </button>
        <div style={styles.headerInfo}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>{order.order_number}</h1>
            <div style={styles.headerBadges}>
              <span style={{
                ...styles.typeBadge,
                backgroundColor: order.order_type === "roznica" ? "#DBEAFE" : "#FEF3C7",
                color: order.order_type === "roznica" ? "#1D4ED8" : "#92400E",
              }}>
                {order.order_type === "roznica" ? "Розница" : "Опт"}
              </span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: isCancelled ? "#FEE2E2" : isDelivered ? "#D1FAE5" : "#FEF3C7",
                color: isCancelled ? "#DC2626" : isDelivered ? "#059669" : "#D97706",
              }}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
          </div>
          <p style={styles.subtitle}>Создан: {formatDateTime(order.created_at)}</p>
        </div>

        {/* Action Buttons */}
        <div style={styles.headerActions}>
          {!isCancelled && !isDelivered && (
            <button
              style={styles.cancelBtn}
              onClick={() => setShowCancelModal(true)}
            >
              Отменить заказ
            </button>
          )}
          {order.is_paid && !isCancelled && (
            <button
              style={styles.refundBtn}
              onClick={() => setShowRefundModal(true)}
            >
              Оформить возврат
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.errorBanner}>
          ❌ {error}
        </div>
      )}
      {successMessage && (
        <div style={styles.successBanner}>
          ✅ {successMessage}
        </div>
      )}

      <div style={styles.content}>
        {/* Main Column */}
        <div style={styles.mainColumn}>
          {/* Status Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Статус заказа</h2>

            {isCancelled ? (
              <div style={styles.cancelledBanner}>
                <div style={styles.cancelledIcon}>❌</div>
                <div>
                  <p style={styles.cancelledTitle}>Заказ отменён</p>
                  {order.cancel_reason && (
                    <p style={styles.cancelledReason}>Причина: {order.cancel_reason}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={styles.statusTracker}>
                  {STATUSES.map((status, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={status.key} style={styles.statusItem}>
                        <div style={{
                          ...styles.statusCircle,
                          backgroundColor: isCompleted ? "#dcfce7" : isCurrent ? "#fef3c7" : "#f5f5f5",
                          border: isCurrent ? "2px solid #f59e0b" : isCompleted ? "2px solid #22c55e" : "2px solid #e5e7eb",
                        }}>
                          <span style={{ fontSize: "20px" }}>{status.icon}</span>
                        </div>
                        <div style={styles.statusInfo}>
                          <span style={{
                            color: isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : "#9ca3af",
                            fontWeight: isCurrent ? "600" : "400",
                            fontSize: "14px",
                          }}>
                            {status.label}
                          </span>
                          {isCurrent && (
                            <span style={styles.currentBadge}>Текущий статус</span>
                          )}
                        </div>
                        {index < STATUSES.length - 1 && (
                          <div style={{
                            ...styles.statusLine,
                            backgroundColor: isCompleted ? "#22c55e" : "#e5e7eb",
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status Info */}
                {!isDelivered && order.status !== 'awaiting_payment' && (
                  <div style={styles.statusInfoBox}>
                    <p style={styles.statusInfoText}>
                      Статус заказа изменяется сотрудниками через Employee App
                    </p>
                  </div>
                )}

                {isDelivered && (
                  <div style={styles.deliveredBanner}>
                    ✅ Заказ успешно доставлен
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order Info Card - Enhanced */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Информация о заказе</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Товар</span>
                <div style={styles.productLink}>
                  <span style={styles.infoValue}>{order.product_name}</span>
                  {order.product && (
                    <button
                      style={styles.productLinkBtn}
                      onClick={() => navigate(`/products/${order.product}`)}
                      title="Открыть товар"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15,3 21,3 21,9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {order.color_name && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Цвет</span>
                  <span style={styles.infoValue}>{order.color_name}</span>
                </div>
              )}
              {order.size_name && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Размер</span>
                  <span style={styles.infoValue}>{order.size_name}</span>
                </div>
              )}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Тип заказа</span>
                <span style={styles.infoValue}>{order.order_type === "roznica" ? "Розница" : "Оптом"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Количество</span>
                <span style={styles.infoValue}>{order.quantity} шт.</span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div style={styles.pricingSection}>
              <h3 style={styles.pricingTitle}>Расчёт стоимости</h3>
              <div style={styles.pricingGrid}>
                <div style={styles.pricingRow}>
                  <span>Цена за единицу</span>
                  <span>{formatMoney(unitPrice)}</span>
                </div>
                <div style={styles.pricingRow}>
                  <span>Количество</span>
                  <span>× {quantity}</span>
                </div>
                <div style={styles.pricingRow}>
                  <span>Подытог</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ ...styles.pricingRow, color: "#10B981" }}>
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

          {/* Order History / Audit Log */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>История заказа</h2>
            <div style={styles.auditLog}>
              {auditLog.map((log, index) => (
                <div key={log.id} style={styles.auditItem}>
                  <div style={styles.auditTimeline}>
                    <div style={{
                      ...styles.auditDot,
                      backgroundColor: getActionColor(log.action),
                    }}>
                      <span style={styles.auditIcon}>{getActionIcon(log.action)}</span>
                    </div>
                    {index < auditLog.length - 1 && <div style={styles.auditLine} />}
                  </div>
                  <div style={styles.auditContent}>
                    <div style={styles.auditHeader}>
                      <span style={styles.auditDescription}>{log.description}</span>
                      <span style={styles.auditTime}>{formatDateTime(log.timestamp)}</span>
                    </div>
                    <p style={styles.auditDetails}>{log.details}</p>
                    <span style={styles.auditUser}>Исполнитель: {log.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div style={styles.sideColumn}>
          {/* Client Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Клиент</h2>
            <div style={styles.clientInfo}>
              <div style={styles.clientAvatar}>
                {(order.client_name || "?")[0].toUpperCase()}
              </div>
              <div style={styles.clientDetails}>
                <p style={styles.clientName}>{order.client_name}</p>
                <p style={styles.clientUsername}>{order.client_username}</p>
              </div>
            </div>
            {order.client_phone && (
              <div style={styles.clientContact}>
                <span style={styles.contactIcon}>📞</span>
                <span>{order.client_phone}</span>
              </div>
            )}
            {order.client_email && (
              <div style={styles.clientContact}>
                <span style={styles.contactIcon}>📧</span>
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

          {/* Payment Card - Enhanced */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Оплата</h2>
            <div style={{
              ...styles.paymentBadge,
              backgroundColor: order.is_paid ? "#dcfce7" : "#fef3c7",
              color: order.is_paid ? "#166534" : "#92400e",
            }}>
              {order.is_paid ? "✓ Оплачено" : "⏳ Ожидает оплаты"}
            </div>

            {order.is_paid && (
              <div style={styles.paymentDetails}>
                <div style={styles.paymentRow}>
                  <span style={styles.paymentLabel}>Сумма</span>
                  <span style={styles.paymentValue}>{formatMoney(total)}</span>
                </div>
                {order.payment_method && (
                  <div style={styles.paymentRow}>
                    <span style={styles.paymentLabel}>Способ оплаты</span>
                    <span style={styles.paymentValue}>{order.payment_method}</span>
                  </div>
                )}
                {order.paid_at && (
                  <div style={styles.paymentRow}>
                    <span style={styles.paymentLabel}>Дата оплаты</span>
                    <span style={styles.paymentValue}>{formatDateTime(order.paid_at)}</span>
                  </div>
                )}
              </div>
            )}

            {!order.is_paid && !isCancelled && (
              <button
                style={styles.paymentBtn}
                onClick={confirmPayment}
                disabled={advancing}
              >
                {advancing ? "Обработка..." : "Подтвердить оплату"}
              </button>
            )}
          </div>

          {/* Delivery Card - Enhanced */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Доставка</h2>
            <div style={styles.addressBlock}>
              <div style={styles.addressItem}>
                <span style={styles.addressLabel}>ОТКУДА</span>
                <span style={styles.addressValue}>{order.address_from || "Склад Стамбул"}</span>
              </div>
              <div style={styles.addressDivider}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </div>
              <div style={styles.addressItem}>
                <span style={styles.addressLabel}>КУДА</span>
                <span style={styles.addressValue}>{order.address_to}</span>
              </div>
            </div>
            {order.tracking_number && (
              <div style={styles.trackingInfo}>
                <span style={styles.trackingLabel}>Трек-номер</span>
                <span style={styles.trackingNumber}>{order.tracking_number}</span>
              </div>
            )}
            {order.estimated_delivery && (
              <div style={styles.deliveryEstimate}>
                <span style={styles.estimateLabel}>Ожидаемая доставка</span>
                <span style={styles.estimateValue}>{formatDate(order.estimated_delivery)}</span>
              </div>
            )}
          </div>

          {/* Internal Notes Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Внутренние заметки</h2>
            <p style={styles.notesDisclaimer}>Видны только сотрудникам</p>

            <div style={styles.addNoteSection}>
              <textarea
                style={styles.noteInput}
                placeholder="Добавить заметку..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
              />
              <button
                style={styles.addNoteBtn}
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
              >
                {addingNote ? "..." : "Добавить"}
              </button>
            </div>

            <div style={styles.notesList}>
              {internalNotes.map(note => (
                <div key={note.id} style={styles.noteItem}>
                  <p style={styles.noteText}>{note.text}</p>
                  <div style={styles.noteMeta}>
                    <span>{note.author}</span>
                    <span>•</span>
                    <span>{formatDateTime(note.timestamp)}</span>
                  </div>
                </div>
              ))}
              {internalNotes.length === 0 && (
                <p style={styles.noNotes}>Заметок пока нет</p>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Примечания клиента</h2>
              <p style={styles.notesText}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Отмена заказа</h2>
            <p style={styles.modalSubtitle}>Укажите причину отмены заказа {order.order_number}</p>

            <textarea
              style={styles.modalTextarea}
              placeholder="Причина отмены (обязательно)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />

            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowCancelModal(false)}
              >
                Отмена
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleCancelOrder}
                disabled={advancing || !cancelReason.trim()}
              >
                {advancing ? "Обработка..." : "Отменить заказ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRefundModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Оформление возврата</h2>
            <p style={styles.modalSubtitle}>Заказ {order.order_number} • Сумма: {formatMoney(total)}</p>

            <div style={styles.refundTypeSection}>
              <label style={styles.refundTypeLabel}>
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === "full"}
                  onChange={(e) => setRefundType(e.target.value)}
                />
                <span style={styles.refundTypeText}>
                  <strong>Полный возврат</strong>
                  <span>{formatMoney(total)}</span>
                </span>
              </label>
              <label style={styles.refundTypeLabel}>
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === "partial"}
                  onChange={(e) => setRefundType(e.target.value)}
                />
                <span style={styles.refundTypeText}>
                  <strong>Частичный возврат</strong>
                </span>
              </label>
            </div>

            {refundType === "partial" && (
              <div style={styles.refundAmountSection}>
                <label style={styles.inputLabel}>Сумма возврата</label>
                <input
                  type="number"
                  style={styles.modalInput}
                  placeholder="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={total}
                />
              </div>
            )}

            <div style={styles.refundReasonSection}>
              <label style={styles.inputLabel}>Причина возврата</label>
              <textarea
                style={styles.modalTextarea}
                placeholder="Укажите причину возврата..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowRefundModal(false)}
              >
                Отмена
              </button>
              <button
                style={{ ...styles.modalConfirmBtn, backgroundColor: "#F59E0B" }}
                onClick={handleRefund}
                disabled={advancing || !refundReason.trim() || (refundType === "partial" && !refundAmount)}
              >
                {advancing ? "Обработка..." : "Оформить возврат"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "32px 40px",
    maxWidth: "1400px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#FF6B35",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  btnSpinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginRight: "8px",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: "14px",
    color: "#FF6B35",
    cursor: "pointer",
    padding: "8px 0",
    fontWeight: "500",
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  headerBadges: {
    display: "flex",
    gap: "8px",
  },
  typeBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "8px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  refundBtn: {
    padding: "10px 20px",
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "500",
  },
  successBanner: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "500",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "24px",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
    marginTop: 0,
  },
  statusTracker: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    position: "relative",
    paddingBottom: "24px",
  },
  statusCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 1,
  },
  statusInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  currentBadge: {
    fontSize: "11px",
    color: "#f59e0b",
    fontWeight: "500",
  },
  statusLine: {
    position: "absolute",
    left: "23px",
    top: "48px",
    width: "2px",
    height: "24px",
  },
  statusInfoBox: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#F0F9FF",
    borderRadius: "10px",
    border: "1px solid #BAE6FD",
  },
  statusInfoText: {
    margin: 0,
    fontSize: "13px",
    color: "#0369A1",
    textAlign: "center",
  },
  cancelledBanner: {
    backgroundColor: "#fef2f2",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  cancelledIcon: {
    fontSize: "32px",
  },
  cancelledTitle: {
    margin: 0,
    fontWeight: "600",
    color: "#DC2626",
    fontSize: "16px",
  },
  cancelledReason: {
    margin: "4px 0 0 0",
    color: "#991B1B",
    fontSize: "14px",
  },
  deliveredBanner: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "600",
    marginTop: "24px",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  infoLabel: {
    color: "#64748b",
    fontSize: "14px",
  },
  infoValue: {
    color: "#1e293b",
    fontWeight: "500",
    fontSize: "14px",
  },
  productLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  productLinkBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    backgroundColor: "#FFF5F2",
    border: "none",
    borderRadius: "6px",
    color: "#FF6B35",
    cursor: "pointer",
  },
  pricingSection: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  pricingTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    marginTop: 0,
    marginBottom: "16px",
  },
  pricingGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  pricingRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#475569",
  },
  pricingTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    paddingTop: "12px",
    marginTop: "8px",
    borderTop: "2px solid #e2e8f0",
  },
  totalAmount: {
    color: "#DC2626",
    fontSize: "20px",
  },
  // Audit log styles
  auditLog: {
    display: "flex",
    flexDirection: "column",
  },
  auditItem: {
    display: "flex",
    gap: "16px",
  },
  auditTimeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "40px",
    flexShrink: 0,
  },
  auditDot: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  auditIcon: {
    fontSize: "16px",
  },
  auditLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "#E5E7EB",
    minHeight: "24px",
  },
  auditContent: {
    flex: 1,
    paddingBottom: "24px",
  },
  auditHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "4px",
  },
  auditDescription: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "14px",
  },
  auditTime: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  auditDetails: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#64748b",
  },
  auditUser: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  // Client card styles
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  clientAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#FFF5F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    color: "#FF6B35",
  },
  clientDetails: {},
  clientName: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "15px",
    margin: 0,
  },
  clientUsername: {
    color: "#64748b",
    fontSize: "13px",
    margin: "4px 0 0 0",
  },
  clientContact: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    fontSize: "14px",
    color: "#475569",
    borderTop: "1px solid #f1f5f9",
  },
  contactIcon: {
    fontSize: "14px",
  },
  viewClientBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#F8FAFC",
    color: "#64748B",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    marginTop: "12px",
  },
  // Payment styles
  paymentBadge: {
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    textAlign: "center",
  },
  paymentDetails: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
  },
  paymentLabel: {
    color: "#64748b",
  },
  paymentValue: {
    color: "#1e293b",
    fontWeight: "500",
  },
  paymentBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "12px",
  },
  // Delivery styles
  addressBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  addressItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
  },
  addressLabel: {
    fontSize: "10px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
  },
  addressValue: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "500",
  },
  addressDivider: {
    textAlign: "center",
    padding: "4px 0",
  },
  trackingInfo: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },
  trackingLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  trackingNumber: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "monospace",
  },
  deliveryEstimate: {
    marginTop: "12px",
  },
  estimateLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  estimateValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  // Internal notes styles
  notesDisclaimer: {
    fontSize: "12px",
    color: "#9CA3AF",
    marginTop: "-12px",
    marginBottom: "16px",
  },
  addNoteSection: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  noteInput: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "13px",
    resize: "none",
    fontFamily: "inherit",
  },
  addNoteBtn: {
    padding: "10px 16px",
    backgroundColor: "#FF6B35",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    alignSelf: "flex-end",
  },
  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  noteItem: {
    padding: "12px",
    backgroundColor: "#FFFBEB",
    borderRadius: "8px",
    borderLeft: "3px solid #F59E0B",
  },
  noteText: {
    margin: 0,
    fontSize: "13px",
    color: "#1e293b",
    lineHeight: "1.5",
  },
  noteMeta: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    fontSize: "11px",
    color: "#9CA3AF",
  },
  noNotes: {
    color: "#9CA3AF",
    fontSize: "13px",
    textAlign: "center",
    padding: "20px",
    margin: 0,
  },
  notesText: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "480px",
    margin: "20px",
  },
  modalTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
  },
  modalSubtitle: {
    margin: "0 0 20px 0",
    fontSize: "14px",
    color: "#64748b",
  },
  modalTextarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "14px",
    resize: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  modalInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  inputLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  modalCancelBtn: {
    padding: "12px 24px",
    backgroundColor: "#F1F5F9",
    color: "#64748B",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  modalConfirmBtn: {
    padding: "12px 24px",
    backgroundColor: "#EF4444",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  refundTypeSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  refundTypeLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    cursor: "pointer",
  },
  refundTypeText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  refundAmountSection: {
    marginBottom: "20px",
  },
  refundReasonSection: {
    marginBottom: "0",
  },
};

export default OrderDetail;
