import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const LogoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L4 8v16l12 6 12-6V8L16 2z" fill="#7c3aed" opacity="0.2"/>
    <path d="M16 2L4 8l12 6 12-6-12-6z" fill="#7c3aed"/>
    <path d="M4 8v16l12 6V14L4 8z" fill="#8b5cf6"/>
    <path d="M28 8v16l-12 6V14l12-6z" fill="#a78bfa"/>
  </svg>
);

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login/`, {
        username,
        password
      });

      if (response.data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Неверные учетные данные');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandContent}>
          <LogoIcon />
          <h1 style={styles.brandTitle}>Логистика</h1>
          <p style={styles.brandSubtitle}>CRM система для управления логистической компанией</p>
        </div>
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>📦</div>
            <span>Управление товарами</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>👥</div>
            <span>База клиентов</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>📊</div>
            <span>Аналитика</span>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Вход в систему</h2>
            <p style={styles.formSubtitle}>Введите ваши учетные данные</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="Введите логин"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Введите пароль"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div style={styles.hint}>
            <span style={styles.hintIcon}>💡</span>
            <span>Демо: admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: 'white',
  },
  brandContent: {
    marginBottom: '48px',
  },
  brandTitle: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '20px 0 12px 0',
  },
  brandSubtitle: {
    fontSize: '16px',
    opacity: 0.9,
    lineHeight: '1.6',
    maxWidth: '400px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    opacity: 0.9,
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '48px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  formHeader: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#4b5563',
  },
  input: {
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.15s ease',
    outline: 'none',
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.15s ease',
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#f5f3ff',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#7c3aed',
  },
  hintIcon: {
    fontSize: '14px',
  },
};

export default Login;
