import React from 'react';

const CampaignIcon = ({ color = '#FF6B35' }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);

function Campaigns() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <CampaignIcon />
        </div>
        <h2 style={styles.title}>Campaigns</h2>
        <p style={styles.description}>
          Marketing campaign features coming soon.
          <br />
          Launch and track marketing campaigns effectively.
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

export default Campaigns;
