import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

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
        navigate('/');
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
      {/* Left Panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logoWrapper}>
            <svg width="48" height="48">
              <rect width="48" height="48" rx="12" fill="#303030"/>
              <text x="24" y="32" fontFamily="Arial" fontSize="26" fontWeight="700" fill="#fff" textAnchor="middle">R</text>
            </svg>
          </div>
          <h1 style={styles.brandTitle}>renexpress</h1>
          <p style={styles.brandSubtitle}>CRM система для управления логистической компанией</p>
        </div>

        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
            <span>Управление товарами</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <span>База клиентов</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <span>Аналитика и статистика</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="1" y="3" width="22" height="18" rx="2" ry="2"/>
                <line x1="1" y1="9" x2="23" y2="9"/>
              </svg>
            </div>
            <span>Управление заказами</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Вход в систему</h2>
            <p style={styles.formSubtitle}>Введите ваши учетные данные для входа</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DE3618" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
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
              {loading ? (
                <span style={styles.loadingText}>Вход...</span>
              ) : (
                <>
                  <span>Войти</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>renexpress CRM v1.0</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #303030 100%)',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: 'white',
  },
  brandContent: {
    marginBottom: '48px',
  },
  logoWrapper: {
    marginBottom: '20px',
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '16px',
    opacity: 0.7,
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
    gap: '14px',
    fontSize: '15px',
    opacity: 0.9,
  },
  featureIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#f6f6f7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#6d7175',
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
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#FED3D1',
    borderRadius: '8px',
    color: '#DE3618',
    fontSize: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #c9cccf',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.15s ease',
    outline: 'none',
    backgroundColor: '#fff',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#303030',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
  },
  loadingText: {
    opacity: 0.8,
  },
  footer: {
    marginTop: '24px',
  },
  footerText: {
    fontSize: '12px',
    color: '#8c9196',
  },
};

export default Login;
