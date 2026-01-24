import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    deliveries: 0,
    unreadMessages: 0,
    cbRate: 0,
  });
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Check if current user is main admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isMainAdmin = user.is_main_admin === true;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, deliveriesRes, rateRes, messagesRes] = await Promise.all([
        fetch(`${API_URL}/clients/`).then(r => r.json()).catch(() => ({ results: [] })),
        fetch(`${API_URL}/deliveries/`).then(r => r.json()).catch(() => ({ results: [] })),
        fetch(`${API_URL}/exchange-rate/`).then(r => r.json()).catch(() => ({ cb_rate: 0 })),
        fetch(`${API_URL}/support/unread-count/`).then(r => r.json()).catch(() => ({ count: 0 })),
      ]);

      setStats({
        clients: clientsRes.count || clientsRes.results?.length || 0,
        deliveries: deliveriesRes.count || deliveriesRes.results?.length || 0,
        unreadMessages: messagesRes.count || 0,
        cbRate: rateRes.cb_rate || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const mainCards = [
    {
      id: 'deliveries',
      title: 'Доставки',
      desc: 'Управление доставками и отслеживание статусов',
      btn: 'Открыть',
      path: '/deliveries',
    },
    {
      id: 'clients',
      title: 'Клиенты',
      desc: 'База клиентов и история заказов',
      btn: 'Перейти',
      path: '/clients',
    },
    {
      id: 'kurs',
      title: 'Курс',
      desc: `Текущий курс ЦБ: ${stats.cbRate ? stats.cbRate.toFixed(2) + '₽' : '—'}`,
      btn: 'Расчёты',
      path: '/kurs',
    },
  ];

  const allResourceCards = [
    {
      id: 'support',
      title: 'Поддержка',
      desc: 'Чаты с клиентами и обработка обращений',
      btn: 'Открыть чаты',
      path: '/support',
    },
    {
      id: 'admins',
      title: 'Администраторы',
      desc: 'Управление доступом и ролями администраторов',
      btn: 'Управление',
      path: '/admins',
      mainAdminOnly: true,
    },
  ];

  // Filter cards based on admin access
  const resourceCards = allResourceCards.filter(card => !card.mainAdminOnly || isMainAdmin);

  return (
    <div style={styles.container}>
      {/* Main Cards Row */}
      <div style={styles.row}>
        {mainCards.map((card) => (
          <div key={card.id} style={styles.card}>
            <h3 style={styles.title}>{card.title}</h3>
            <p style={styles.desc}>{card.desc}</p>
            <button
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredBtn(card.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.btn,
                backgroundColor: hoveredBtn === card.id ? '#f3f4f6' : 'transparent',
              }}
            >
              {card.btn}
            </button>
          </div>
        ))}
      </div>

      {/* Section Title */}
      <h2 style={styles.sectionTitle}>Инструменты</h2>

      {/* Resource Cards Row */}
      <div style={styles.row}>
        {resourceCards.map((card) => (
          <div key={card.id} style={styles.card}>
            <h3 style={styles.title}>{card.title}</h3>
            <p style={styles.desc}>{card.desc}</p>
            <button
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredBtn(card.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                ...styles.btn,
                alignSelf: 'flex-end',
                backgroundColor: hoveredBtn === card.id ? '#f3f4f6' : 'transparent',
              }}
            >
              {card.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 48px',
    maxWidth: '1100px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    flex: 1,
    backgroundColor: '#f6f6f7',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #303030',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 8px 0',
  },
  desc: {
    fontSize: '13px',
    color: '#303030',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
    flex: 1,
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#111',
    backgroundColor: 'transparent',
    border: '1px solid #303030',
    borderRadius: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 16px 0',
  },
};

export default Dashboard;
