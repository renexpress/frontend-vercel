import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formattedMessage, setFormattedMessage] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Multiple places with weight
  const [places, setPlaces] = useState([{ number: '', weight: '' }]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Admin edit form
  const [editForm, setEditForm] = useState({
    place_number: '',
    weight_kg: '',
    cargo_type: 'Одежда',
    shipment_date: getTodayDate(),
    admin_notes: ''
  });

  // Sync places to edit form (place_number and total weight)
  useEffect(() => {
    const validPlaces = places.filter(p => p.number.trim() !== '');
    const totalWeight = places.reduce((sum, p) => {
      const w = parseFloat(p.weight) || 0;
      return sum + w;
    }, 0);
    setEditForm(prev => ({
      ...prev,
      place_number: validPlaces.map(p => p.number).join(', '),
      weight_kg: totalWeight > 0 ? totalWeight.toString() : ''
    }));
  }, [places]);

  const addPlace = () => {
    setPlaces([...places, { number: '', weight: '' }]);
  };

  const removePlace = (index) => {
    if (places.length > 1) {
      const newPlaces = places.filter((_, i) => i !== index);
      setPlaces(newPlaces);
    }
  };

  const updatePlace = (index, field, value) => {
    const newPlaces = [...places];
    newPlaces[index] = { ...newPlaces[index], [field]: value };
    setPlaces(newPlaces);
  };

  useEffect(() => {
    fetchDelivery();
    fetchDeliveryTypes();
  }, [id]);

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveries/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setDelivery(data);

        // Parse place numbers (comma-separated) into array with weights
        // Format: "A1:5.5, A2:3.2" or legacy "A1, A2"
        const placeStr = data.place_number || '';
        const weightStr = data.weight_kg || '';

        let parsedPlaces = [];
        if (placeStr) {
          const placeArr = placeStr.split(',').map(p => p.trim()).filter(p => p);
          // Check if places have embedded weights (format: "A1:5.5")
          const hasEmbeddedWeights = placeArr.some(p => p.includes(':'));

          if (hasEmbeddedWeights) {
            parsedPlaces = placeArr.map(p => {
              const [num, w] = p.split(':');
              return { number: num.trim(), weight: w ? w.trim() : '' };
            });
          } else {
            // Legacy format - distribute weight equally or leave empty
            parsedPlaces = placeArr.map(p => ({ number: p, weight: '' }));
          }
        }

        setPlaces(parsedPlaces.length > 0 ? parsedPlaces : [{ number: '', weight: '' }]);

        setEditForm({
          place_number: data.place_number || '',
          weight_kg: data.weight_kg || '',
          cargo_type: data.cargo_type || 'Одежда',
          shipment_date: data.shipment_date || getTodayDate(),
          admin_notes: data.admin_notes || ''
        });

        // Fetch formatted message if delivery is in_istanbul or later
        if (['v_stambule', 'otpravlen', 'v_puti', 'v_moskve', 'oplata', 'dostavka', 'vidan'].includes(data.status)) {
          fetchFormattedMessage();
        }
      }
    } catch (error) {
      console.error('Error fetching delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/delivery-types/`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryTypes(data);
      }
    } catch (error) {
      console.error('Error fetching delivery types:', error);
    }
  };

  const fetchFormattedMessage = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveries/${id}/formatted/`);
      if (res.ok) {
        const data = await res.json();
        setFormattedMessage(data.formatted_message);
      }
    } catch (error) {
      console.error('Error fetching formatted message:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build place_number with embedded weights (format: "A1:5.5, A2:3.2")
      const validPlaces = places.filter(p => p.number.trim() !== '');
      const placeNumberStr = validPlaces.map(p => {
        if (p.weight) {
          return `${p.number}:${p.weight}`;
        }
        return p.number;
      }).join(', ');

      // Calculate total weight
      const totalWeight = places.reduce((sum, p) => {
        const w = parseFloat(p.weight) || 0;
        return sum + w;
      }, 0);

      const payload = {
        ...editForm,
        place_number: placeNumberStr,
        weight_kg: totalWeight > 0 ? totalWeight.toString() : editForm.weight_kg,
        status: 'v_stambule'  // Auto-set status to "В Стамбуле"
      };

      const res = await fetch(`${API_URL}/deliveries/${id}/admin-update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchDelivery();
        alert('Сохранено!');
      } else {
        alert('Ошибка сохранения');
      }
    } catch (error) {
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить эту доставку?')) return;

    try {
      const res = await fetch(`${API_URL}/deliveries/${id}/delete/`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/deliveries');
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedMessage);
    alert('Скопировано!');
  };

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

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>Доставка не найдена</div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(delivery.status);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/deliveries')}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
            </svg>
            Назад
          </button>
          <span style={styles.deliveryTypeIcon}>
            {delivery.delivery_type_name ? (
              delivery.delivery_type_name.toLowerCase().includes('avia') ? '✈️' : '🚚'
            ) : '❓'}
          </span>
          <h1 style={styles.title}>Заказ REN{delivery.receiver}-{delivery.sequential_number || 1}</h1>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: statusInfo.bg,
            color: statusInfo.color,
          }}>
            {statusInfo.label}
          </span>
        </div>
        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.btnSecondary,
              backgroundColor: hoveredBtn === 'delete' ? '#fef2f2' : '#fff',
              borderColor: hoveredBtn === 'delete' ? '#dc2626' : '#c9cccf',
              color: hoveredBtn === 'delete' ? '#dc2626' : '#303030',
            }}
            onMouseEnter={() => setHoveredBtn('delete')}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={handleDelete}
          >
            Удалить
          </button>
          <button
            style={{
              ...styles.btnPrimary,
              backgroundColor: hoveredBtn === 'save' ? '#1a1a1a' : '#303030',
            }}
            onMouseEnter={() => setHoveredBtn('save')}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Client Info Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Информация о получателе</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Имя пользователя</span>
                <span style={styles.infoValue}>{delivery.receiver_username}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>ФИО получателя</span>
                <span style={styles.infoValue}>{delivery.receiver_full_name || 'Не указано'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Адрес доставки</span>
                <span style={styles.infoValue}>{delivery.receiver_address || 'Не указан'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Телефон</span>
                <span style={styles.infoValue}>{delivery.receiver_phone || 'Не указан'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Тип доставки (выбран клиентом)</span>
                <span style={styles.infoValue}>{delivery.delivery_type_name || 'Не выбран'}</span>
              </div>
            </div>
          </div>

          {/* Product Info Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Информация о грузе</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Описание товара</span>
                <span style={styles.infoValue}>{delivery.product_description || 'Не указано'}</span>
              </div>
            </div>
          </div>

          {/* Sender Info Card */}
          {delivery.sender_username && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Информация об отправителе</h2>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Имя пользователя</span>
                  <span style={styles.infoValue}>{delivery.sender_username}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>ФИО</span>
                  <span style={styles.infoValue}>{delivery.sender_name || 'Не указано'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Телефон</span>
                  <span style={styles.infoValue}>{delivery.sender_phone || 'Не указан'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formatted Message Card */}
          {formattedMessage && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Информация о доставке</h2>
                <button style={styles.copyBtn} onClick={copyToClipboard}>
                  Копировать
                </button>
              </div>
              <pre style={styles.formattedMessage}>{formattedMessage}</pre>
            </div>
          )}
        </div>

        {/* Right Column - Admin Edit */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Заполнить данные (Администратор)</h2>

            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Места (груз)</label>
                <button
                  type="button"
                  style={styles.addPlaceBtn}
                  onClick={addPlace}
                  title="Добавить место"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#fff">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                  </svg>
                </button>
              </div>
              {places.map((place, index) => (
                <div key={index} style={styles.placeNumberRow}>
                  <input
                    type="text"
                    value={place.number}
                    onChange={e => updatePlace(index, 'number', e.target.value)}
                    placeholder={`Место ${index + 1}`}
                    style={styles.placeInput}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={place.weight}
                    onChange={e => updatePlace(index, 'weight', e.target.value)}
                    placeholder="Вес (кг)"
                    style={styles.weightInput}
                  />
                  {places.length > 1 && (
                    <button
                      type="button"
                      style={styles.removePlaceBtn}
                      onClick={() => removePlace(index)}
                      title="Удалить место"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="#dc2626">
                        <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {places.filter(p => p.number.trim()).length > 0 && (
                <div style={styles.placeSummary}>
                  Мест: {places.filter(p => p.number.trim()).length} | Общий вес: {places.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0).toFixed(1)} кг
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Тип груза</label>
              <input
                type="text"
                value={editForm.cargo_type}
                onChange={e => setEditForm({ ...editForm, cargo_type: e.target.value })}
                placeholder="Одежда"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Дата отправки</label>
              <input
                type="date"
                value={editForm.shipment_date}
                onChange={e => setEditForm({ ...editForm, shipment_date: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Заметки администратора</label>
              <textarea
                value={editForm.admin_notes}
                onChange={e => setEditForm({ ...editForm, admin_notes: e.target.value })}
                placeholder="Внутренние заметки..."
                style={styles.textarea}
                rows={3}
              />
            </div>

            {/* Calculated Price */}
            {(() => {
              const totalWeight = places.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
              if (totalWeight > 0 && delivery.delivery_type_price) {
                return (
                  <div style={styles.priceCard}>
                    <span style={styles.priceLabel}>Расчётная сумма:</span>
                    <span style={styles.priceValue}>
                      {(totalWeight * parseFloat(delivery.delivery_type_price)).toFixed(0)}$
                    </span>
                    <span style={styles.priceCalc}>
                      ({totalWeight.toFixed(1)} кг x {delivery.delivery_type_price}$/кг)
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Payment Status */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Оплата</h2>
            <div style={styles.paymentStatus}>
              <span style={{
                ...styles.paymentBadge,
                backgroundColor: delivery.is_paid ? '#d1fae5' : '#fee2e2',
                color: delivery.is_paid ? '#065f46' : '#991b1b',
              }}>
                {delivery.is_paid ? 'ОПЛАЧЕНО' : 'НЕ ОПЛАЧЕНО'}
              </span>
              {delivery.total_price && (
                <span style={styles.totalPrice}>{delivery.total_price}$</span>
              )}
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
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#d72c0d',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#5c5f62',
    cursor: 'pointer',
  },
  deliveryTypeIcon: {
    fontSize: '24px',
    marginRight: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  deliveryNumberSmall: {
    fontSize: '12px',
    color: '#8c9196',
    marginLeft: '8px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  btnPrimary: {
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
  btnSecondary: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '20px',
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

  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 16px 0',
  },

  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6d7175',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '14px',
    color: '#303030',
  },

  formGroup: {
    marginBottom: '16px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    marginBottom: '6px',
  },
  addPlaceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: '#2AABAB',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  placeNumberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  placeInput: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  weightInput: {
    width: '100px',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  removePlaceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '38px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  placeSummary: {
    fontSize: '12px',
    color: '#6d7175',
    fontStyle: 'italic',
    marginTop: '4px',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
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

  priceCard: {
    backgroundColor: '#f6f6f7',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  priceLabel: {
    fontSize: '13px',
    color: '#6d7175',
    display: 'block',
    marginBottom: '4px',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2AABAB',
    display: 'block',
  },
  priceCalc: {
    fontSize: '12px',
    color: '#8c9196',
  },

  paymentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  paymentBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
  },

  copyBtn: {
    padding: '6px 12px',
    backgroundColor: '#2AABAB',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#fff',
    cursor: 'pointer',
  },
  formattedMessage: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    margin: 0,
    overflow: 'auto',
  },
};

export default DeliveryDetail;
