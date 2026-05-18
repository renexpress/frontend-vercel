import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';

function Tnved() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirm modal state
  const [selected, setSelected] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/admin/tnved/pending/`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Не удалось загрузить список: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openConfirm = (tnved) => {
    setSelected(tnved);
    setPriceInput('');
    setNotesInput(tnved.notes || '');
    setSubmitError('');
  };

  const closeConfirm = () => {
    setSelected(null);
    setPriceInput('');
    setNotesInput('');
    setSubmitError('');
  };

  const handleConfirm = async () => {
    const price = parseFloat(priceInput);
    if (!price || price <= 0) {
      setSubmitError('Укажите положительную цену за кг');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch(`${API_URL}/admin/tnved/${selected.id}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_kg: price,
          notes: notesInput.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const msg = data.price_per_kg?.[0] || data.error || `HTTP ${response.status}`;
        setSubmitError(msg);
        return;
      }
      closeConfirm();
      fetchPending();
    } catch (e) {
      setSubmitError(`Ошибка: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ТНВЭД на проверку</h1>
        <button style={styles.refreshBtn} onClick={fetchPending}>Обновить</button>
      </div>

      {loading && <div style={styles.empty}>Загрузка...</div>}

      {!loading && error && <div style={styles.errorBanner}>{error}</div>}

      {!loading && !error && pending.length === 0 && (
        <div style={styles.empty}>Нет кодов на проверке</div>
      )}

      {!loading && pending.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr style={styles.tr}>
              <th style={styles.th}>Код ТНВЭД</th>
              <th style={styles.th}>Официальное название (AI)</th>
              <th style={styles.thCenter}>Доставок ждут</th>
              <th style={styles.thCenter}>Создан</th>
              <th style={styles.thRight}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.tdCode}>{t.code}</td>
                <td style={styles.td}>{t.official_name || <span style={styles.muted}>(пусто — заполнит админ)</span>}</td>
                <td style={styles.tdCenter}>{t.pending_deliveries_count}</td>
                <td style={styles.tdCenter}>{formatDate(t.created_at)}</td>
                <td style={styles.tdRight}>
                  <button style={styles.confirmBtn} onClick={() => openConfirm(t)}>
                    Установить цену
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div style={styles.modalOverlay} onClick={closeConfirm}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Подтверждение ТНВЭД</h2>
            <div style={styles.modalSubtitle}>
              <strong>{selected.code}</strong>
              <div style={styles.officialName}>
                {selected.official_name || '(AI не определил название)'}
              </div>
            </div>

            <label style={styles.label}>
              Цена за кг (USD) <span style={styles.required}>*</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                style={styles.input}
                placeholder="Например: 8.50"
                autoFocus
              />
            </label>

            <label style={styles.label}>
              Заметки админа (необязательно)
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                style={styles.textarea}
                rows={3}
                placeholder="Уточнения о товаре, поставке, и т.д."
              />
            </label>

            <div style={styles.infoBox}>
              ℹ️ Доставок ждут эту цену: <strong>{selected.pending_deliveries_count}</strong>.<br />
              Отправители получат push-уведомление с этой ценой и решат принять или отказаться.
            </div>

            {submitError && <div style={styles.errorBanner}>{submitError}</div>}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={closeConfirm}
                disabled={submitting}
              >
                Отмена
              </button>
              <button
                style={{ ...styles.confirmBtn, opacity: submitting ? 0.5 : 1 }}
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? 'Сохраняем...' : 'Подтвердить и уведомить'}
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
    padding: 24,
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: '1px solid #d0d0d0',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  errorBanner: {
    padding: 12,
    background: '#fee',
    border: '1px solid #f99',
    borderRadius: 6,
    color: '#c33',
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  th: {
    padding: 12,
    textAlign: 'left',
    background: '#fafafa',
    fontWeight: 600,
    fontSize: 13,
    color: '#555',
  },
  thCenter: {
    padding: 12,
    textAlign: 'center',
    background: '#fafafa',
    fontWeight: 600,
    fontSize: 13,
    color: '#555',
  },
  thRight: {
    padding: 12,
    textAlign: 'right',
    background: '#fafafa',
    fontWeight: 600,
    fontSize: 13,
    color: '#555',
  },
  td: {
    padding: 12,
    fontSize: 14,
  },
  tdCode: {
    padding: 12,
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: 14,
  },
  tdCenter: {
    padding: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  tdRight: {
    padding: 12,
    textAlign: 'right',
  },
  muted: {
    color: '#999',
    fontStyle: 'italic',
  },
  confirmBtn: {
    padding: '8px 14px',
    background: '#2AABAB',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  cancelBtn: {
    padding: '8px 14px',
    background: '#f0f0f0',
    color: '#333',
    border: '1px solid #d0d0d0',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 600,
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #eee',
  },
  officialName: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  label: {
    display: 'block',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 500,
  },
  required: {
    color: '#e44',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d0d0d0',
    borderRadius: 6,
    fontSize: 14,
    marginTop: 6,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d0d0d0',
    borderRadius: 6,
    fontSize: 14,
    marginTop: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  infoBox: {
    padding: 12,
    background: '#f0f8ff',
    border: '1px solid #cde',
    borderRadius: 6,
    fontSize: 13,
    color: '#456',
    marginBottom: 16,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
};

export default Tnved;
