import React from 'react';

const CalendarIcon = ({ color = '#FF6B35' }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

function Schedule() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <CalendarIcon />
        </div>
        <h2 style={styles.title}>Schedule</h2>
        <p style={styles.description}>
          Calendar and scheduling features coming soon.
          <br />
          Manage appointments, events, and deadlines.
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

export default Schedule;
