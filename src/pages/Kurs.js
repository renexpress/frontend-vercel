import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';

function Kurs() {
  const [cbRate, setCbRate] = useState(null);

  useEffect(() => {
    fetchCbRate();
    const interval = setInterval(fetchCbRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
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

  if (!cbRate) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Курс и расчёты</h1>
      </div>

      {/* Current Rates Card */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Текущий курс USD/RUB</h3>
        <div style={styles.ratesRow}>
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
            <span style={styles.rateValueMain}>{cbRate.payment_rate.toFixed(2)} ₽</span>
          </div>
        </div>
      </div>

      {/* Basic Formula */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Базовая формула</h3>
        <div style={styles.formulaBox}>
          <span style={styles.formulaText}>Итого = Сумма USD × (Курс ЦБ + 5₽) × 1.07</span>
          <div style={styles.exampleRow}>
            <span style={styles.exampleLabel}>Пример:</span>
            <span style={styles.exampleText}>$100 × {cbRate.our_rate.toFixed(2)} × 1.07 = <strong>{Math.ceil(100 * cbRate.our_rate * 1.07)} ₽</strong></span>
          </div>
        </div>
      </div>

      {/* Tax Coefficients */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Коэффициенты с Честным знаком</h3>
        <div style={styles.taxRow}>
          <div style={styles.taxItem}>
            <span style={styles.taxLabel}>С НДС 25%</span>
            <span style={styles.taxValue}>÷ 0.75</span>
          </div>
          <div style={styles.taxItem}>
            <span style={styles.taxLabel}>Без НДС 13%</span>
            <span style={styles.taxValue}>÷ 0.87</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Расчёт пошагово</h3>

        <div style={styles.step}>
          <span style={styles.stepNumber}>1</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabel}>Цена маркировки</span>
            <span style={styles.stepFormula}>Кол-во единиц × 5₽</span>
          </div>
        </div>

        <div style={styles.step}>
          <span style={styles.stepNumber}>2</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabel}>Маркировка с налогом</span>
            <span style={styles.stepFormula}>Цена маркировки ÷ налоговый коэфф.</span>
          </div>
        </div>

        <div style={styles.step}>
          <span style={styles.stepNumber}>3</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabel}>Доставка с налогом (USD)</span>
            <span style={styles.stepFormula}>Доставка USD ÷ налоговый коэфф.</span>
          </div>
        </div>

        <div style={styles.step}>
          <span style={styles.stepNumber}>4</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabel}>Доставка в рублях</span>
            <span style={styles.stepFormula}>Доставка с налогом × Наш курс</span>
          </div>
        </div>

        <div style={styles.step}>
          <span style={styles.stepNumber}>5</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabel}>Промежуточная сумма</span>
            <span style={styles.stepFormula}>Маркировка + Доставка в рублях</span>
          </div>
        </div>

        <div style={styles.stepFinal}>
          <span style={styles.stepNumberFinal}>6</span>
          <div style={styles.stepContent}>
            <span style={styles.stepLabelFinal}>ИТОГО К ОПЛАТЕ</span>
            <span style={styles.stepFormulaFinal}>Промежуточная сумма × 1.07</span>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Сводная таблица</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Тип расчёта</th>
                <th style={styles.th}>Формула</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>Наш курс</span></td>
                <td style={styles.td}>Курс ЦБ + 5₽</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>Без Честного знака</span></td>
                <td style={styles.td}>Сумма USD × Наш курс × 1.07</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>С НДС 25%</span></td>
                <td style={styles.td}>÷ 0.75</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>Без НДС 13%</span></td>
                <td style={styles.td}>÷ 0.87</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>Маркировка</span></td>
                <td style={styles.td}>Кол-во × 5₽ ÷ налог. коэфф.</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}><span style={styles.tdLabel}>Итого с ЧЗ</span></td>
                <td style={styles.td}>(Маркировка + Доставка) × 1.07</td>
              </tr>
            </tbody>
          </table>
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
    borderTopColor: '#2AABAB',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    padding: '20px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  ratesRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  rateItem: {
    textAlign: 'center',
  },
  rateLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#6d7175',
    marginBottom: '4px',
  },
  rateValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#303030',
  },
  rateValueMain: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  rateDivider: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    padding: '4px 10px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '6px',
  },
  formulaBox: {
    padding: '16px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(42, 171, 171, 0.1), rgba(10, 37, 53, 0.1))',
  },
  formulaText: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
    marginBottom: '8px',
  },
  exampleRow: {
    fontSize: '13px',
    color: '#6d7175',
  },
  exampleLabel: {
    fontWeight: '500',
    marginRight: '6px',
  },
  exampleText: {
    color: '#303030',
  },
  taxRow: {
    display: 'flex',
    gap: '12px',
  },
  taxItem: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, rgba(42, 171, 171, 0.15), rgba(10, 37, 53, 0.15))',
    textAlign: 'center',
  },
  taxLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#303030',
    marginBottom: '4px',
  },
  taxValue: {
    fontSize: '14px',
    fontWeight: '700',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#6d7175',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
  },
  stepFormula: {
    fontSize: '12px',
    color: '#6d7175',
  },
  stepFinal: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'linear-gradient(to right, rgba(42, 171, 171, 0.15), rgba(10, 37, 53, 0.15))',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  stepNumberFinal: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepLabelFinal: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  stepFormulaFinal: {
    fontSize: '12px',
    color: '#303030',
    fontWeight: '500',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#000',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #e1e3e5',
  },
  tdLabel: {
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
};

export default Kurs;
