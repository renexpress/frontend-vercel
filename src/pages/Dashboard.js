import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';

const ExchangeIcon = ({ color = '#6B7280' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M7 16V4M7 4L3 8M7 4L11 8" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

function Dashboard() {
  const [cbRate, setCbRate] = useState(null);

  useEffect(() => {
    fetchCbRate();
  }, []);

  const fetchCbRate = async () => {
    try {
      const response = await fetch(`${API_URL}/exchange-rate/`);
      const data = await response.json();
      setCbRate(data);
    } catch (error) {
      console.error('Error fetching CB rate:', error);
    }
  };

  return (
    <div style={styles.container}>
      {cbRate ? (
        <div style={styles.exchangeCard}>
          <div style={styles.exchangeHeader}>
            <div style={styles.iconWrapper}>
              <ExchangeIcon color="#F59E0B" />
            </div>
            <div>
              <h3 style={styles.exchangeTitle}>Курс USD/RUB</h3>
              <span style={styles.exchangeSubtitle}>Центральный банк РФ</span>
            </div>
          </div>
          <div style={styles.exchangeRates}>
            <div style={styles.rateItem}>
              <span style={styles.rateLabel}>Курс ЦБ</span>
              <span style={styles.rateValue}>{cbRate.cb_rate.toFixed(2)} ₽</span>
            </div>
            <div style={styles.rateDivider}>+5₽</div>
            <div style={styles.rateItem}>
              <span style={styles.rateLabel}>Наш курс</span>
              <span style={styles.rateValue}>{cbRate.our_rate.toFixed(2)} ₽</span>
            </div>
            <div style={styles.rateDivider}>×1.07</div>
            <div style={styles.rateItem}>
              <span style={styles.rateLabel}>Курс для оплаты</span>
              <span style={{...styles.rateValue, color: '#2AABAB', fontSize: '28px'}}>{cbRate.payment_rate.toFixed(2)} ₽</span>
            </div>
          </div>
          <div style={styles.exchangeFormula}>
            <span style={styles.formulaText}>
              Формула: <strong>сумма USD × (курс ЦБ + 5₽) × 1.07</strong>
            </span>
            <span style={styles.formulaExample}>
              Пример: $100 × {cbRate.our_rate.toFixed(2)} × 1.07 = {Math.ceil(100 * cbRate.our_rate * 1.07)} ₽
            </span>
          </div>
        </div>
      ) : (
        <div style={styles.loading}>Загрузка курса...</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6B7280',
    fontSize: '14px',
  },
  exchangeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  exchangeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: 0,
  },
  exchangeSubtitle: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  exchangeRates: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '24px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  rateItem: {
    textAlign: 'center',
  },
  rateLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  rateValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rateDivider: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#F59E0B',
    padding: '8px 12px',
    backgroundColor: '#FEF3C7',
    borderRadius: '8px',
  },
  exchangeFormula: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 16px',
    backgroundColor: '#F0FDFA',
    borderRadius: '8px',
    border: '1px solid #99F6E4',
  },
  formulaText: {
    fontSize: '13px',
    color: '#0F766E',
  },
  formulaExample: {
    fontSize: '12px',
    color: '#6B7280',
  },
};

export default Dashboard;
