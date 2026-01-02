import React from 'react';

function Discounts() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9cccf" strokeWidth="1.5">
            <path d="M7.5 9.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.9 3.6l1.4 1.4 11.3-11.3-1.4-1.4-11.3 11.3z"/>
          </svg>
        </div>
        <h1 style={styles.title}>Скидки</h1>
        <p style={styles.subtitle}>Эта страница находится в разработке</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f6f6f7',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  iconWrapper: {
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#303030',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6d7175',
  },
};

export default Discounts;
