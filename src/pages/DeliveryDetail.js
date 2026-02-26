import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formattedMessage, setFormattedMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  // Memoize status history to prevent lag
  const memoizedStatusHistory = useMemo(() => {
    if (!delivery?.status_history) return [];
    return [...delivery.status_history];
  }, [delivery?.status_history]);

  // Multiple places with weight, volume, and barcode
  const [places, setPlaces] = useState([{ number: '', weight: '', volume: '', barcode: '' }]);

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
    setPlaces([...places, { number: '', weight: '', volume: '', barcode: '' }]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveries/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setDelivery(data);

        // Parse place numbers (comma-separated) into array with weights, volumes, and barcodes
        // Format: "A1:5.5:0.02:BC001, A2:3.2:0.03:BC002" or legacy "A1:5.5, A2:3.2" or "A1, A2"
        const placeStr = data.place_number || '';

        let parsedPlaces = [];
        if (placeStr) {
          const placeArr = placeStr.split(',').map(p => p.trim()).filter(p => p);
          // Check if places have embedded data (format with colons)
          const hasEmbeddedData = placeArr.some(p => p.includes(':'));

          if (hasEmbeddedData) {
            parsedPlaces = placeArr.map(p => {
              const parts = p.split(':');
              return {
                number: parts[0]?.trim() || '',
                weight: parts[1]?.trim() || '',
                volume: parts[2]?.trim() || '',
                barcode: parts[3]?.trim() || ''
              };
            });
          } else {
            // Legacy format - just place numbers
            parsedPlaces = placeArr.map(p => ({ number: p, weight: '', volume: '', barcode: '' }));
          }
        }

        setPlaces(parsedPlaces.length > 0 ? parsedPlaces : [{ number: '', weight: '', volume: '', barcode: '' }]);

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
      // Build place_number with embedded data (format: "A1:5.5:0.02:BC001, A2:3.2:0.03:BC002")
      // Note: Replace commas with periods in numeric values to avoid parsing issues
      const validPlaces = places.filter(p => p.number.trim() !== '');
      const placeNumberStr = validPlaces.map(p => {
        const num = (p.number || '').replace(/,/g, '');  // Remove commas from place number
        const weight = (p.weight || '').replace(/,/g, '.');  // Convert comma to period for decimals
        const volume = (p.volume || '').replace(/,/g, '.');  // Convert comma to period for decimals
        const barcode = (p.barcode || '').replace(/,/g, '');  // Remove commas from barcode
        const parts = [num, weight, volume, barcode];
        // Remove trailing empty parts
        while (parts.length > 1 && parts[parts.length - 1] === '') {
          parts.pop();
        }
        return parts.join(':');
      }).join(', ');

      // Calculate total weight
      const totalWeight = places.reduce((sum, p) => {
        const w = parseFloat(p.weight) || 0;
        return sum + w;
      }, 0);

      // Calculate total volume
      const totalVolume = places.reduce((sum, p) => {
        const v = parseFloat(p.volume) || 0;
        return sum + v;
      }, 0);

      // Collect all barcodes
      const allBarcodes = validPlaces
        .map(p => p.barcode)
        .filter(b => b && b.trim())
        .join(', ');

      const payload = {
        ...editForm,
        place_number: placeNumberStr,
        weight_kg: totalWeight > 0 ? totalWeight.toString() : editForm.weight_kg,
        volume: totalVolume > 0 ? totalVolume.toFixed(3) : null,
        barcode: allBarcodes || null,
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
    prinyat: { label: 'Принят', bg: '#2AABAB', color: '#fff' },
    v_stambule: { label: 'В Стамбуле', bg: '#2AABAB', color: '#fff' },
    otpravlen: { label: 'Отправлен', bg: '#2AABAB', color: '#fff' },
    v_puti: { label: 'В пути', bg: '#2AABAB', color: '#fff' },
    v_moskve: { label: 'В Москве', bg: '#2AABAB', color: '#fff' },
    oplata: { label: 'Оплата', bg: '#2AABAB', color: '#fff' },
    dostavka: { label: 'Доставка', bg: '#2AABAB', color: '#fff' },
    vidan: { label: 'Выдан', bg: '#2AABAB', color: '#fff' },
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

  // Check if delivery is completed (vidan = delivered)
  const isDeliveryCompleted = delivery.status === 'vidan';

  // Check if receiver has filled required data (address is optional - filled later when receiver chooses delivery option)
  const receiverDataFilled = delivery.receiver_full_name &&
                              delivery.receiver_phone &&
                              delivery.delivery_type;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 20 20" style={{ display: 'block', flexShrink: 0, marginTop: '2px' }}>
              <defs>
                <linearGradient id="backIconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2AABAB"/>
                  <stop offset="100%" stopColor="#0a2535"/>
                </linearGradient>
              </defs>
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" fill="url(#backIconGradient)"/>
            </svg>
            <span style={styles.backBtnText}>Назад</span>
          </button>
          <span style={styles.deliveryTypeIcon}>
            {delivery.delivery_type_name ? (
              delivery.delivery_type_name.toLowerCase().includes('avia') ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              )
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            )}
          </span>
          <h1 style={styles.title}>Заказ {delivery.delivery_number}</h1>
          <span style={styles.statusBadge}>
            {statusInfo.label}
          </span>
        </div>
        {!isDeliveryCompleted && (
          <div style={styles.headerRight}>
            <button
              style={styles.btnDelete}
              onMouseEnter={() => setHoveredBtn('delete')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handleDelete}
            >
              <span style={styles.btnDeleteText}>Удалить</span>
            </button>
            <button
              style={{
                ...styles.btnSave,
                opacity: !receiverDataFilled ? 0.5 : 1,
                cursor: !receiverDataFilled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={() => setHoveredBtn('save')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handleSave}
              disabled={saving || !receiverDataFilled}
              title={!receiverDataFilled ? 'Получатель должен сначала заполнить свои данные' : ''}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>

      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Info Card with Two Tables */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Информация о доставке</h2>
            <div style={styles.twoColumnLayout}>
              {/* Left - Отправитель + Доставка */}
              <div style={styles.infoTableWrapper}>
                <div style={styles.infoTableHeader}>
                  <span style={styles.gradientText}>Отправитель</span>
                </div>
                <table style={styles.infoTableInner}>
                  <tbody>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>ID</span></td>
                      <td style={styles.infoTdValue}>{delivery.sender_username || <span style={styles.notSet}>—</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>ФИО</span></td>
                      <td style={styles.infoTdValue}>{delivery.sender_name || <span style={styles.notSet}>Не указано</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Телефон</span></td>
                      <td style={styles.infoTdValue}>{delivery.sender_phone || <span style={styles.notSet}>Не указан</span>}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ ...styles.infoTableHeader, marginTop: '20px' }}>
                  <span style={styles.gradientText}>Доставка</span>
                </div>
                <table style={styles.infoTableInner}>
                  <tbody>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Описание груза</span></td>
                      <td style={styles.infoTdValue}>{delivery.product_description || <span style={styles.notSet}>Не указано</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Тип доставки</span></td>
                      <td style={styles.infoTdValue}>{delivery.delivery_type_name || <span style={styles.notSet}>Не выбран</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Адрес</span></td>
                      <td style={styles.infoTdValue}>
                        {delivery.delivery_option === 'pickup'
                          ? 'Забрать с пункта выдачи'
                          : delivery.delivery_option === 'home_delivery' && delivery.home_delivery_data
                            ? `${delivery.home_delivery_data.city || ''}${delivery.home_delivery_data.street ? ', ' + delivery.home_delivery_data.street : ''}${delivery.home_delivery_data.house ? ', д.' + delivery.home_delivery_data.house : ''}${delivery.home_delivery_data.apartment ? ', кв.' + delivery.home_delivery_data.apartment : ''}`
                            : <span style={styles.notSet}>Не указан</span>
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right - Получатель + Способ получения и оплата */}
              <div style={styles.infoTableWrapper}>
                <div style={styles.infoTableHeader}>
                  <span style={styles.gradientText}>Получатель</span>
                </div>
                <table style={styles.infoTableInner}>
                  <tbody>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>ID</span></td>
                      <td style={styles.infoTdValue}>{delivery.receiver_username}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>ФИО</span></td>
                      <td style={styles.infoTdValue}>{delivery.receiver_full_name || <span style={styles.notSet}>Не указано</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Телефон</span></td>
                      <td style={styles.infoTdValue}>{delivery.receiver_phone || <span style={styles.notSet}>Не указан</span>}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ ...styles.infoTableHeader, marginTop: '20px' }}>
                  <span style={styles.gradientText}>Способ получения и оплата</span>
                </div>
                <table style={styles.infoTableInner}>
                  <tbody>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Способ получения</span></td>
                      <td style={styles.infoTdValue}>{delivery.delivery_option_display || <span style={styles.notSet}>Не выбрано</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Сумма</span></td>
                      <td style={styles.infoTdValue}>{delivery.total_price ? `${delivery.total_price}$` : <span style={styles.notSet}>Неизвестно</span>}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Оплачено</span></td>
                      <td style={styles.infoTdValue}>
                        <span style={{ color: delivery.is_paid ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                          {delivery.is_paid ? 'Да' : 'Нет'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Full Address Card - shows when status is oplata/dostavka/vidan and paid */}
          {['oplata', 'dostavka', 'vidan'].includes(delivery.status) && delivery.is_paid && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Полный адрес</h2>
              <div style={styles.infoTableWrapper}>
                <table style={styles.infoTableInner}>
                  <tbody>
                    {/* Pickup address info */}
                    {delivery.delivery_option === 'pickup' && (
                      <>
                        <tr>
                          <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Адрес</span></td>
                          <td style={styles.infoTdValue}>М.О. г.Дзержинский, Денисьевский проезд 2А, пункт OZON</td>
                        </tr>
                        <tr>
                          <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Телефон</span></td>
                          <td style={styles.infoTdValue}>+7 901 523-78-55</td>
                        </tr>
                        <tr>
                          <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Контакт</span></td>
                          <td style={styles.infoTdValue}>Сергей</td>
                        </tr>
                      </>
                    )}

                    {/* Home delivery address info */}
                    {delivery.delivery_option === 'home_delivery' && delivery.home_delivery_data && (
                      <>
                        {delivery.home_delivery_data.city && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Город</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.city}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.district && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Район</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.district}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.street && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Улица</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.street}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.house && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Дом</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.house}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.entrance && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Подъезд</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.entrance}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.floor && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Этаж</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.floor}</td>
                          </tr>
                        )}
                        {delivery.home_delivery_data.apartment && (
                          <tr>
                            <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Квартира</span></td>
                            <td style={styles.infoTdValue}>{delivery.home_delivery_data.apartment}</td>
                          </tr>
                        )}
                      </>
                    )}

                    {/* No delivery option selected */}
                    {!delivery.delivery_option && (
                      <tr>
                        <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Статус</span></td>
                        <td style={styles.infoTdValue}>
                          <span style={{ color: '#92400e' }}>Ожидание выбора клиентом</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
            <h2 style={{...styles.cardTitle, ...styles.gradientText}}>
              {isDeliveryCompleted ? 'Данные доставки' : 'Заполнить данные'}
            </h2>

            {isDeliveryCompleted ? (() => {
              const placesArr = delivery.place_number ? delivery.place_number.split(',').map(p => p.trim()).filter(p => p) : [];
              const parsedPlaces = placesArr.map(p => {
                if (p.includes(':')) {
                  const parts = p.split(':');
                  return {
                    number: parts[0]?.trim() || '',
                    weight: parseFloat(parts[1]?.trim()) || 0,
                    volume: parseFloat(parts[2]?.trim()) || 0,
                    barcode: parts[3]?.trim() || ''
                  };
                }
                return { number: p, weight: 0, volume: 0, barcode: '' };
              });
              const totalWeight = parsedPlaces.reduce((sum, p) => sum + p.weight, 0);
              const totalVolume = parsedPlaces.reduce((sum, p) => sum + p.volume, 0);
              const vidanStatus = delivery.status_history?.find(h => h.to_status === 'vidan');
              const getPlacesWord = (count) => {
                if (count === 1) return 'место';
                if (count >= 2 && count <= 4) return 'места';
                return 'мест';
              };

              return (
                <div>
                  {/* Places Table */}
                  {parsedPlaces.length > 0 && (
                    <div style={styles.placesTableContainer}>
                      <span style={styles.placesTableTitle}>Места</span>
                      <div style={styles.placesTableHeader}>
                        <span style={{...styles.placesTableHeaderCell, flex: 1}}>Место</span>
                        <span style={{...styles.placesTableHeaderCell, flex: 1}}>Вес</span>
                        <span style={{...styles.placesTableHeaderCell, flex: 1}}>Объём</span>
                        <span style={{...styles.placesTableHeaderCell, flex: 1.2, borderRight: 'none'}}>Баркод</span>
                      </div>
                      {parsedPlaces.map((place, idx) => (
                        <div key={idx} style={{...styles.placesTableRow, backgroundColor: idx % 2 === 0 ? '#F8FAFA' : '#fff'}}>
                          <span style={{...styles.placesTableCell, flex: 1, fontWeight: '600', color: '#2AABAB'}}>{place.number}</span>
                          <span style={{...styles.placesTableCell, flex: 1}}>{place.weight ? `${place.weight} кг` : '—'}</span>
                          <span style={{...styles.placesTableCell, flex: 1}}>{place.volume > 0 ? `${place.volume.toFixed(1)} м³` : '—'}</span>
                          <span style={{...styles.placesTableCell, flex: 1.2, borderRight: 'none'}}>{place.barcode || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Line */}
                  <div style={styles.summaryLine}>
                    <span style={styles.summaryText}>
                      {parsedPlaces.length} {getPlacesWord(parsedPlaces.length)} · {totalWeight > 0 ? `${totalWeight.toFixed(1)} кг` : '—'}
                      {totalVolume > 0 ? ` · ${totalVolume.toFixed(1)} м³` : ''}
                      {delivery.total_price ? ` · ${delivery.total_price}$` : ''}
                    </span>
                  </div>

                  {/* Dates */}
                  <div style={styles.datesRow}>
                    <div style={styles.dateBlock}>
                      <span style={styles.dateLabel}>Дата отправки</span>
                      <span style={styles.dateValue}>{delivery.shipment_date ? new Date(delivery.shipment_date).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                    <div style={styles.dateBlock}>
                      <span style={styles.dateLabel}>Дата выдачи</span>
                      <span style={styles.dateValue}>{vidanStatus ? new Date(vidanStatus.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })() : !receiverDataFilled ? (
              <div style={styles.warningCard}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2AABAB" style={{ marginBottom: 8 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span style={styles.warningTitle}>Ожидание данных получателя</span>
                <span style={styles.warningText}>
                  Получатель должен заполнить свои данные (ФИО, телефон, тип доставки) прежде чем вы сможете заполнить данные администратора.
                </span>
                <div style={styles.missingFields}>
                  <span style={styles.missingFieldsTitle}>Не заполнено:</span>
                  {!delivery.receiver_full_name && <span style={styles.missingField}>• ФИО получателя</span>}
                  {!delivery.receiver_phone && <span style={styles.missingField}>• Телефон</span>}
                  {!delivery.delivery_type && <span style={styles.missingField}>• Тип доставки</span>}
                </div>
              </div>
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Места (груз)</label>
                  {places.map((place, index) => (
                    <div key={index} style={styles.placeNumberRow}>
                      <div style={styles.gradientBorderWrapper}>
                        <input
                          type="text"
                          value={place.number}
                          onChange={e => updatePlace(index, 'number', e.target.value)}
                          placeholder={`Место ${index + 1}`}
                          style={styles.placeInput}
                        />
                      </div>
                      <div style={styles.gradientBorderWrapperFixed}>
                        <input
                          type="number"
                          step="0.1"
                          value={place.weight}
                          onChange={e => updatePlace(index, 'weight', e.target.value)}
                          placeholder="Вес (кг)"
                          style={styles.weightInput}
                        />
                      </div>
                      <div style={styles.gradientBorderWrapperFixed}>
                        <input
                          type="number"
                          step="0.001"
                          value={place.volume}
                          onChange={e => updatePlace(index, 'volume', e.target.value)}
                          placeholder="Объём (м³)"
                          style={styles.volumeInput}
                        />
                      </div>
                      <div style={styles.gradientBorderWrapperFixed}>
                        <input
                          type="text"
                          value={place.barcode}
                          onChange={e => updatePlace(index, 'barcode', e.target.value)}
                          placeholder="Баркод"
                          style={styles.barcodeInput}
                        />
                      </div>
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
                  <button
                    type="button"
                    style={styles.addPlaceBtnBelow}
                    onClick={addPlace}
                    title="Добавить место"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                    </svg>
                    <span>Добавить место</span>
                  </button>
                  {places.filter(p => p.number.trim()).length > 0 && (
                    <div style={styles.placeSummary}>
                      Мест: {places.filter(p => p.number.trim()).length} | Вес: {places.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0).toFixed(1)} кг | Объём: {places.reduce((sum, p) => sum + (parseFloat(p.volume) || 0), 0).toFixed(1)} м³
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Дата отправки</label>
                  <div style={styles.gradientBorderWrapperFull}>
                    <input
                      type="date"
                      value={editForm.shipment_date}
                      onChange={e => setEditForm({ ...editForm, shipment_date: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Calculated Price */}
                {(() => {
                  const totalWeight = places.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
                  if (totalWeight > 0 && delivery.delivery_type_price) {
                    return (
                      <div style={styles.priceTableWrapper}>
                        <table style={styles.priceTable}>
                          <tbody>
                            <tr>
                              <td style={styles.priceTableLabel}>
                                <span style={styles.infoTdLabelText}>Общая сумма</span>
                              </td>
                              <td style={styles.priceTableValue}>
                                <span style={{ color: '#000', fontWeight: '600', fontSize: '15px' }}>
                                  {(totalWeight * parseFloat(delivery.delivery_type_price)).toFixed(0)}$
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ color: '#6d7175', fontSize: '11px', marginTop: '6px', paddingLeft: '2px' }}>
                          {totalWeight.toFixed(1)} кг × {delivery.delivery_type_price}$/кг
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>

          {/* Chestniy Znak (Honest Mark) */}
          {delivery.chestniy_znak && (
            <div style={styles.card}>
              <h2 style={{...styles.cardTitle, ...styles.gradientText}}>Честный знак</h2>
              <div style={styles.infoTableWrapper}>
                <table style={styles.infoTableInner}>
                  <tbody>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Кол-во единиц</span></td>
                      <td style={styles.infoTdValue}>{delivery.chestniy_znak.units_count || '—'}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Компания</span></td>
                      <td style={styles.infoTdValue}>{delivery.chestniy_znak.company_name || '—'}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>ИНН</span></td>
                      <td style={styles.infoTdValue}>{delivery.chestniy_znak.inn || '—'}</td>
                    </tr>
                    <tr>
                      <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Налогообложение</span></td>
                      <td style={styles.infoTdValue}>{delivery.chestniy_znak.tax_type_display || '—'}</td>
                    </tr>
                    {delivery.chestniy_znak.specification_url && (
                      <tr>
                        <td style={styles.infoTdLabel}><span style={styles.infoTdLabelText}>Спецификация</span></td>
                        <td style={styles.infoTdValue}>
                          <a
                            href={delivery.chestniy_znak.specification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{color: '#000', textDecoration: 'underline'}}
                          >
                            Скачать файл
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status History - Collapsible */}
          <div style={styles.card}>
            <div
              style={styles.historyHeaderRow}
              onClick={() => setHistoryExpanded(!historyExpanded)}
            >
              <h2 style={{ ...styles.cardTitle, ...styles.gradientText, margin: 0, cursor: 'pointer' }}>
                История статуса
              </h2>
              <button style={styles.historyExpandBtn}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="#6d7175"
                  style={{ transform: historyExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </button>
            </div>
            {historyExpanded && (
              memoizedStatusHistory.length > 0 ? (
                <div style={styles.historyList}>
                  {memoizedStatusHistory.map((history, index) => {
                    const historyStatusInfo = getStatusInfo(history.to_status);
                    const total = memoizedStatusHistory.length;
                    const progress = total === 1 ? 1 : index / (total - 1);
                    const r = Math.round(42 + (10 - 42) * progress);
                    const g = Math.round(171 + (37 - 171) * progress);
                    const b = Math.round(171 + (53 - 171) * progress);
                    const dotColor = `rgb(${r}, ${g}, ${b})`;
                    return (
                      <div key={history.id || index} style={styles.historyItem}>
                        <div style={{...styles.historyDot, backgroundColor: dotColor}} />
                        {index < memoizedStatusHistory.length - 1 && (
                          <div style={{...styles.historyLine, background: `linear-gradient(to bottom, ${dotColor}, rgb(${Math.round(42 + (10 - 42) * ((index + 1) / (total - 1)))}, ${Math.round(171 + (37 - 171) * ((index + 1) / (total - 1)))}, ${Math.round(171 + (53 - 171) * ((index + 1) / (total - 1)))}))`}} />
                        )}
                        <div style={styles.historyContent}>
                          <div style={styles.historyHeader}>
                            <span style={styles.historyStatusGradient}>
                              {history.to_status_display || historyStatusInfo.label}
                            </span>
                            <span style={styles.historyDate}>
                              {new Date(history.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {history.employee_name && (
                            <span style={styles.historyEmployee}>
                              Сотрудник: {history.employee_name}
                            </span>
                          )}
                          {history.notes && (
                            <div style={styles.historyCommentBox}>
                              <span style={styles.historyCommentLabel}>Комментарий:</span>
                              <span style={styles.historyCommentText}>{history.notes}</span>
                            </div>
                          )}
                          {history.photos && history.photos.length > 0 && (
                            <div style={styles.historyPhotos}>
                              {history.photos.map((photo, photoIdx) => (
                                <img
                                  key={photo.id || photoIdx}
                                  src={photo.photo_url}
                                  alt={`Status ${photoIdx + 1}`}
                                  style={styles.historyPhoto}
                                  loading="lazy"
                                  decoding="async"
                                  onClick={() => setViewingImage(photo.photo_url)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.historyEmpty}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#2AABAB" style={{ opacity: 0.5, marginBottom: 8 }}>
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                  </svg>
                  <span style={styles.historyEmptyText}>История статусов пуста</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {viewingImage && (
        <div style={styles.lightboxOverlay} onClick={() => setViewingImage(null)}>
          <button style={styles.lightboxClose} onClick={() => setViewingImage(null)}>×</button>
          <img src={viewingImage} alt="" style={styles.lightboxImage} onClick={e => e.stopPropagation()} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #2AABAB',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    lineHeight: '1',
  },
  backBtnContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    verticalAlign: 'middle',
  },
  backBtnText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '500',
    lineHeight: '1',
    display: 'block',
  },
  deliveryTypeIcon: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
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
  btnDelete: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #2AABAB',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnDeleteText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  btnSave: {
    padding: '8px 16px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
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
  infoSection: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e1e3e5',
  },
  infoSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  infoSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  infoRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '6px 0',
  },
  infoRowLabel: {
    fontSize: '13px',
    color: '#6d7175',
    fontWeight: '500',
    minWidth: '120px',
  },
  infoRowValue: {
    fontSize: '13px',
    color: '#303030',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  notSet: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  deliveryTableCenter: {
    marginTop: '20px',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  infoTableWrapper: {
    flex: 1,
  },
  infoTableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '600',
  },
  gradientText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  infoTableInner: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  infoTdLabel: {
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    borderBottom: '1px solid #e1e3e5',
    borderRight: '1px solid #e1e3e5',
    width: '120px',
  },
  infoTdLabelText: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  infoTdValue: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#000',
    borderBottom: '1px solid #e1e3e5',
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
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  addPlaceBtnBelow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 16px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '8px',
  },
  placeNumberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '6px',
  },
  gradientBorderWrapper: {
    flex: 1,
    minWidth: '60px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '8px',
    padding: '1px',
  },
  gradientBorderWrapperFixed: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '8px',
    padding: '1px',
  },
  gradientBorderWrapperFull: {
    width: '100%',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '8px',
    padding: '1px',
  },
  placeInput: {
    width: '100%',
    padding: '8px 8px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '7px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  weightInput: {
    width: '65px',
    padding: '8px 6px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '7px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  volumeInput: {
    width: '70px',
    padding: '8px 6px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '7px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  barcodeInput: {
    width: '80px',
    padding: '8px 6px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '7px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  removePlaceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '32px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  placeSummary: {
    fontSize: '12px',
    color: '#000',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '7px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
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

  priceTableWrapper: {
    marginTop: '16px',
  },
  priceTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  priceTableLabel: {
    padding: '10px 12px',
    fontSize: '13px',
    fontWeight: '500',
    borderTop: '1px solid #e1e3e5',
    borderBottom: '1px solid #e1e3e5',
    width: '120px',
    verticalAlign: 'top',
  },
  priceTableValue: {
    padding: '10px 12px',
    fontSize: '13px',
    borderTop: '1px solid #e1e3e5',
    borderBottom: '1px solid #e1e3e5',
    verticalAlign: 'top',
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

  // Warning card styles
  warningCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '24px 16px',
    backgroundColor: '#E8F7F7',
    borderRadius: '8px',
    border: '1px solid #2AABAB',
  },
  warningTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2AABAB',
    marginBottom: '8px',
  },
  warningText: {
    fontSize: '13px',
    color: '#239999',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  missingFields: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    padding: '12px',
    backgroundColor: '#D0F0F0',
    borderRadius: '6px',
  },
  missingFieldsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2AABAB',
    marginBottom: '6px',
  },
  missingField: {
    fontSize: '12px',
    color: '#239999',
    marginBottom: '2px',
  },

  // Completed delivery card styles
  completedCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '24px 16px',
    backgroundColor: '#E8F7F7',
    borderRadius: '8px',
    border: '1px solid #2AABAB',
  },
  completedTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2AABAB',
    marginBottom: '8px',
  },
  completedText: {
    fontSize: '13px',
    color: '#239999',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  completedInfo: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#D0F0F0',
    borderRadius: '6px',
    textAlign: 'left',
  },
  completedInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '6px 0',
    borderBottom: '1px solid #B8E8E8',
  },
  completedInfoLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#239999',
  },
  completedInfoValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'right',
    maxWidth: '60%',
  },

  // Status History styles
  historyHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    paddingBottom: '0',
    marginBottom: '0',
  },
  historyExpandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '16px',
  },
  historyItem: {
    position: 'relative',
    paddingLeft: '24px',
    paddingBottom: '16px',
  },
  historyDot: {
    position: 'absolute',
    left: 0,
    top: '4px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#2AABAB',
  },
  historyLine: {
    position: 'absolute',
    left: '4px',
    top: '18px',
    bottom: 0,
    width: '2px',
    backgroundColor: '#E8F7F7',
  },
  historyContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatus: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2AABAB',
  },
  historyStatusGradient: {
    fontSize: '14px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  historyDate: {
    fontSize: '12px',
    color: '#000',
  },
  historyEmployee: {
    fontSize: '12px',
    color: '#000',
  },
  historyCommentBox: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#F5F5F5',
    borderRadius: '8px',
  },
  historyCommentLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#000',
    marginBottom: '4px',
  },
  historyCommentText: {
    fontSize: '13px',
    color: '#000',
    lineHeight: '1.4',
  },
  historyPhotos: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  historyPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '6px',
    objectFit: 'cover',
    cursor: 'pointer',
    border: '1px solid #e1e3e5',
    backgroundColor: '#e5e7eb',
    transition: 'opacity 0.3s ease',
  },
  historyEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    color: '#6d7175',
  },
  historyEmptyText: {
    fontSize: '13px',
    color: '#2AABAB',
  },

  // Chestniy Znak styles
  chestniyZnakInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  chestniyZnakRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  chestniyZnakLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6d7175',
  },
  chestniyZnakValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#303030',
  },
  chestniyZnakLink: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#2AABAB',
    textDecoration: 'none',
  },

  // Completed delivery stats blocks
  statsBlocksRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  statsBlockGradient: {
    flex: '1 1 calc(25% - 12px)',
    minWidth: '100px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '12px',
    padding: '1.5px',
  },
  statsBlockInner: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statsBlockLabel: {
    fontSize: '12px',
    color: '#6d7175',
    marginBottom: '4px',
  },
  statsBlockValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Places table for completed delivery
  placesTableContainer: {
    marginBottom: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #E0E0E0',
  },
  placesTableTitle: {
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px',
    display: 'block',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  placesTableHeader: {
    display: 'flex',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    padding: '10px 0',
  },
  placesTableHeaderCell: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    padding: '0 8px',
    borderRight: '1px solid rgba(255,255,255,0.3)',
  },
  placesTableRow: {
    display: 'flex',
    borderTop: '1px solid #E0E0E0',
  },
  placesTableCell: {
    fontSize: '13px',
    color: '#1A1A1A',
    textAlign: 'center',
    padding: '12px 8px',
    borderRight: '1px solid #E0E0E0',
  },

  // Summary line
  summaryLine: {
    padding: '12px 0',
    textAlign: 'center',
  },
  summaryText: {
    fontSize: '14px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  // Dates row
  datesRow: {
    display: 'flex',
    gap: '16px',
  },
  dateBlock: {
    flex: 1,
    backgroundColor: '#F8FAFA',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: '12px',
    color: '#6d7175',
    display: 'block',
    marginBottom: '4px',
  },
  dateValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Lightbox styles
  lightboxOverlay: {
    position: 'fixed',
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  },
  lightboxClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '40px',
    cursor: 'pointer',
    zIndex: 10000,
  },
  lightboxImage: {
    maxWidth: '90%',
    maxHeight: '85%',
    objectFit: 'contain',
    cursor: 'default',
  },
};

export default DeliveryDetail;
