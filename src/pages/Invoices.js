import React from 'react';

const InvoiceIcon = ({ color = '#FF6B35' }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

function Invoices() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <InvoiceIcon />
        </div>
        <h2 style={styles.title}>Invoices</h2>
        <p style={styles.description}>
          Invoice management features coming soon.
          <br />
          Create, track, and manage invoices seamlessly.
        </p>
        <button style={styles.button}>Coming Soon</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)',
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  iconWrapper: {
    width: '96px',
    height: '96px',
    borderRadius: '24px',
    backgroundColor: '#FFF4F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '12px',
  },
  description: {
    fontSize: '15px',
    color: '#6B7280',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#F5F5F7',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'not-allowed',
  },
};

export default Invoices;
