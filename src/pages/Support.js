import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const CHAT_STATUS_CONFIG = {
  open: { label: 'Открыт', color: '#065f46', bg: '#d1fae5' },
  pending: { label: 'В ожидании', color: '#92400e', bg: '#fef3c7' },
  resolved: { label: 'Решён', color: '#374151', bg: '#f3f4f6' },
  closed: { label: 'Закрыт', color: '#6b7280', bg: '#f9fafb' },
};

function Support() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, unread: 0 });

  useEffect(() => {
    loadChats();
    const pollInterval = setInterval(loadChats, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedChat) return;
    const msgPollInterval = setInterval(() => {
      loadMessages(selectedChat.client_id);
    }, 5000);
    return () => clearInterval(msgPollInterval);
  }, [selectedChat]);

  useEffect(() => {
    let filtered = [...chats];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.client_name?.toLowerCase().includes(query) ||
        chat.client_username?.toLowerCase().includes(query) ||
        chat.last_message?.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'unread') {
        filtered = filtered.filter(chat => chat.unread_count > 0);
      } else {
        filtered = filtered.filter(chat => chat.status === statusFilter);
      }
    }
    filtered.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0));
    setFilteredChats(filtered);
    setStats({
      total: chats.length,
      open: chats.filter(c => c.status === 'open' || !c.status).length,
      pending: chats.filter(c => c.status === 'pending').length,
      unread: chats.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    });
  }, [chats, searchQuery, statusFilter]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/support/chats/`);
      if (response.data.success) setChats(response.data.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (clientId) => {
    try {
      const response = await axios.get(`${API_URL}/support/${clientId}/messages/`);
      if (response.data.success) setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.client_id);
    try {
      await axios.post(`${API_URL}/support/${chat.client_id}/read/`);
      loadChats();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedChat || sending) return;
    setSending(true);
    try {
      // Get current admin name from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const adminName = user.full_name || user.username || 'Администратор';

      if (selectedFile) await uploadFile();
      if (newMessage.trim()) {
        await axios.post(`${API_URL}/support/${selectedChat.client_id}/send/`, {
          message: newMessage,
          is_from_client: false,
          admin_name: adminName
        });
        loadMessages(selectedChat.client_id);
      }
      setNewMessage('');
      setSelectedFile(null);
      loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile || !selectedChat) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('client_id', selectedChat.client_id);
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadMessages(selectedChat.client_id);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const updateChatStatus = async (newStatus) => {
    if (!selectedChat) return;
    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/status/`, { status: newStatus });
      setSelectedChat(prev => ({ ...prev, status: newStatus }));
      loadChats();
    } catch (error) {
      setSelectedChat(prev => ({ ...prev, status: newStatus }));
      setChats(prev => prev.map(c => c.client_id === selectedChat.client_id ? { ...c, status: newStatus } : c));
    }
    setShowStatusModal(false);
  };

  const closeChat = async () => {
    if (!selectedChat) return;
    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/close/`, { reason: closeReason });
      setSelectedChat(prev => ({ ...prev, status: 'closed' }));
      loadChats();
    } catch (error) {
      setSelectedChat(prev => ({ ...prev, status: 'closed' }));
      setChats(prev => prev.map(c => c.client_id === selectedChat.client_id ? { ...c, status: 'closed' } : c));
    }
    setShowCloseModal(false);
    setCloseReason('');
  };

  const reopenChat = async () => {
    if (!selectedChat) return;
    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/reopen/`);
      setSelectedChat(prev => ({ ...prev, status: 'open' }));
      loadChats();
    } catch (error) {
      setSelectedChat(prev => ({ ...prev, status: 'open' }));
      setChats(prev => prev.map(c => c.client_id === selectedChat.client_id ? { ...c, status: 'open' } : c));
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const groupMessagesByDate = useCallback((msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.created_at });
      }
      groups.push({ type: 'message', ...msg });
    });
    return groups;
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#303030">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          <h1 style={styles.title}>Поддержка</h1>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Всего</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statValue, color: '#065f46' }}>{stats.open}</span>
            <span style={styles.statLabel}>Открытых</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statValue, color: '#92400e' }}>{stats.pending}</span>
            <span style={styles.statLabel}>В ожидании</span>
          </div>
          {stats.unread > 0 && (
            <div style={styles.statItem}>
              <span style={{ ...styles.statValue, color: '#dc2626' }}>{stats.unread}</span>
              <span style={styles.statLabel}>Непрочитанных</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9196" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          <div style={styles.filterTabs}>
            {[
              { key: 'all', label: 'Все' },
              { key: 'unread', label: 'Новые', count: stats.unread },
              { key: 'open', label: 'Открытые' },
              { key: 'pending', label: 'Ожидание' },
            ].map(filter => (
              <button
                key={filter.key}
                style={{
                  ...styles.filterTab,
                  ...(statusFilter === filter.key ? styles.filterTabActive : {}),
                }}
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
                {filter.count > 0 && <span style={styles.filterBadge}>{filter.count}</span>}
              </button>
            ))}
          </div>

          <div style={styles.chatList}>
            {filteredChats.length === 0 ? (
              <div style={styles.emptyList}>
                <p style={styles.emptyText}>Чатов не найдено</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <div
                  key={chat.client_id}
                  style={{
                    ...styles.chatItem,
                    ...(selectedChat?.client_id === chat.client_id ? styles.chatItemActive : {}),
                  }}
                  onClick={() => selectChat(chat)}
                >
                  <div style={styles.chatAvatar}>
                    {chat.client_name?.charAt(0).toUpperCase() || 'К'}
                  </div>
                  <div style={styles.chatInfo}>
                    <div style={styles.chatTop}>
                      <span style={styles.chatName}>{chat.client_name || chat.client_username}</span>
                      <span style={styles.chatTime}>{formatDate(chat.last_message_time)}</span>
                    </div>
                    <div style={styles.chatBottom}>
                      <span style={styles.chatPreview}>
                        {chat.last_message_has_image && '📷 '}
                        {chat.last_message || 'Изображение'}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={styles.unreadBadge}>{chat.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderLeft}>
                  <div style={styles.chatHeaderAvatar}>
                    {selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}
                  </div>
                  <div>
                    <div style={styles.chatHeaderName}>{selectedChat.client_name || selectedChat.client_username}</div>
                    <div style={styles.chatHeaderMeta}>
                      <span>{selectedChat.client_username}</span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: CHAT_STATUS_CONFIG[selectedChat.status]?.bg || '#d1fae5',
                        color: CHAT_STATUS_CONFIG[selectedChat.status]?.color || '#065f46',
                      }}>
                        {CHAT_STATUS_CONFIG[selectedChat.status]?.label || 'Открыт'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={styles.chatHeaderActions}>
                  <button style={styles.actionBtn} onClick={() => setShowStatusModal(true)} title="Статус">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </button>
                  <button
                    style={{ ...styles.actionBtn, ...(showInfoPanel ? styles.actionBtnActive : {}) }}
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    title="Информация"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={styles.messagesArea}>
                {groupedMessages.map((item, index) => {
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${index}`} style={styles.dateDivider}>
                        <span style={styles.dateDividerText}>{formatDate(item.date)}</span>
                      </div>
                    );
                  }
                  const msg = item;
                  const isClient = msg.is_from_client;
                  return (
                    <div key={msg.id || index} style={{ ...styles.messageRow, justifyContent: isClient ? 'flex-start' : 'flex-end' }}>
                      {isClient && (
                        <div style={styles.msgAvatar}>{selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}</div>
                      )}
                      <div style={styles.msgWrapper}>
                        {!isClient && msg.admin_name && (
                          <div style={styles.adminNameLabel}>{msg.admin_name}</div>
                        )}
                        <div style={{ ...styles.msgBubble, ...(isClient ? styles.msgBubbleClient : styles.msgBubbleAdmin) }}>
                          {msg.image_url && (
                            <img src={msg.image_url} alt="" style={styles.msgImage} onClick={() => window.open(msg.image_url, '_blank')} />
                          )}
                          {msg.message && <p style={{ ...styles.msgText, color: isClient ? '#303030' : '#fff' }}>{msg.message}</p>}
                          <span style={{ ...styles.msgTime, color: isClient ? '#8c9196' : 'rgba(255,255,255,0.7)' }}>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={styles.inputArea}>
                {selectedFile && (
                  <div style={styles.filePreview}>
                    <span style={styles.fileName}>{selectedFile.name}</span>
                    <button style={styles.fileRemove} onClick={() => setSelectedFile(null)}>×</button>
                  </div>
                )}
                <div style={styles.inputRow}>
                  <button style={styles.attachBtn} onClick={() => fileInputRef.current?.click()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение..."
                    style={styles.textarea}
                    rows={1}
                    disabled={selectedChat.status === 'closed'}
                  />
                  <button
                    style={{ ...styles.sendBtn, opacity: (!newMessage.trim() && !selectedFile) || sending ? 0.5 : 1 }}
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                {selectedChat.status === 'closed' && (
                  <div style={styles.closedNotice}>
                    Чат закрыт. <button style={styles.reopenBtn} onClick={reopenChat}>Открыть снова</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.emptyChat}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#c9cccf">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <h2 style={styles.emptyChatTitle}>Выберите чат</h2>
              <p style={styles.emptyChatText}>Выберите чат из списка слева</p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        {selectedChat && showInfoPanel && (
          <div style={styles.infoPanel}>
            <div style={styles.infoPanelHeader}>
              <span style={styles.infoPanelTitle}>Информация</span>
              <button style={styles.infoPanelClose} onClick={() => setShowInfoPanel(false)}>×</button>
            </div>
            <div style={styles.infoSection}>
              <div style={styles.infoClient}>
                <div style={styles.infoAvatar}>{selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}</div>
                <div>
                  <p style={styles.infoName}>{selectedChat.client_name || 'Клиент'}</p>
                  <p style={styles.infoUsername}>{selectedChat.client_username}</p>
                </div>
              </div>
            </div>
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Статус</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: CHAT_STATUS_CONFIG[selectedChat.status]?.bg || '#d1fae5',
                  color: CHAT_STATUS_CONFIG[selectedChat.status]?.color || '#065f46',
                }}>
                  {CHAT_STATUS_CONFIG[selectedChat.status]?.label || 'Открыт'}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Создан</span>
                <span style={styles.infoValue}>{formatFullDate(selectedChat.created_at) || '—'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Активность</span>
                <span style={styles.infoValue}>{formatFullDate(selectedChat.last_message_time) || '—'}</span>
              </div>
            </div>
            <div style={styles.infoSection}>
              <button style={styles.infoPanelBtn} onClick={() => setShowStatusModal(true)}>Изменить статус</button>
              {selectedChat.status !== 'closed' ? (
                <button style={{ ...styles.infoPanelBtn, ...styles.infoPanelBtnDanger }} onClick={() => setShowCloseModal(true)}>Закрыть чат</button>
              ) : (
                <button style={{ ...styles.infoPanelBtn, ...styles.infoPanelBtnSuccess }} onClick={reopenChat}>Открыть чат</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Изменить статус</h2>
            <div style={styles.modalOptions}>
              {Object.entries(CHAT_STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  style={{
                    ...styles.modalOption,
                    ...(selectedChat?.status === key ? styles.modalOptionActive : {}),
                  }}
                  onClick={() => updateChatStatus(key)}
                >
                  <span style={{ ...styles.statusDot, backgroundColor: config.color }}></span>
                  {config.label}
                </button>
              ))}
            </div>
            <button style={styles.modalCancel} onClick={() => setShowStatusModal(false)}>Отмена</button>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCloseModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Закрыть чат</h2>
            <p style={styles.modalSubtitle}>Укажите причину (необязательно)</p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Причина закрытия..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={3}
            />
            <div style={styles.modalActions}>
              <button style={styles.modalCancel} onClick={() => setShowCloseModal(false)}>Отмена</button>
              <button style={styles.modalConfirm} onClick={closeChat}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '16px 20px',
    height: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column',
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
    borderTopColor: '#303030',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#303030',
  },
  statLabel: {
    fontSize: '11px',
    color: '#6d7175',
  },
  content: {
    display: 'flex',
    flex: 1,
    gap: '12px',
    minHeight: 0,
    overflow: 'hidden',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderBottom: '1px solid #e1e3e5',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#303030',
  },
  clearBtn: {
    width: '20px',
    height: '20px',
    border: 'none',
    background: '#e1e3e5',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6d7175',
  },
  filterTabs: {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    borderBottom: '1px solid #e1e3e5',
    overflowX: 'auto',
  },
  filterTab: {
    padding: '6px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  filterTabActive: {
    backgroundColor: '#303030',
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '1px 5px',
    borderRadius: '8px',
    fontSize: '10px',
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyList: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#6d7175',
    fontSize: '13px',
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s',
  },
  chatItemActive: {
    backgroundColor: '#f3f4f6',
    borderLeft: '3px solid #303030',
  },
  chatAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  chatName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#303030',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chatTime: {
    fontSize: '11px',
    color: '#8c9196',
  },
  chatBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    fontSize: '12px',
    color: '#6d7175',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#303030',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '600',
    marginLeft: '8px',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e1e3e5',
  },
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chatHeaderAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
  chatHeaderName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  chatHeaderMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6d7175',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
  },
  chatHeaderActions: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    border: '1px solid #e1e3e5',
    backgroundColor: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6d7175',
  },
  actionBtnActive: {
    backgroundColor: '#303030',
    borderColor: '#303030',
    color: '#fff',
  },
  messagesArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
  },
  dateDivider: {
    display: 'flex',
    justifyContent: 'center',
    margin: '16px 0',
  },
  dateDividerText: {
    backgroundColor: '#e1e3e5',
    color: '#6d7175',
    padding: '4px 12px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '10px',
  },
  msgAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
  },
  msgWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '65%',
  },
  adminNameLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#6d7175',
    marginBottom: '4px',
    paddingRight: '4px',
  },
  msgBubble: {
    padding: '10px 14px',
    borderRadius: '12px',
  },
  msgBubbleClient: {
    backgroundColor: '#fff',
    border: '1px solid #e1e3e5',
    borderBottomLeftRadius: '4px',
  },
  msgBubbleAdmin: {
    backgroundColor: '#303030',
    borderBottomRightRadius: '4px',
  },
  msgImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '6px',
  },
  msgText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  msgTime: {
    fontSize: '10px',
    marginTop: '4px',
    display: 'block',
    textAlign: 'right',
  },
  inputArea: {
    padding: '12px 16px',
    borderTop: '1px solid #e1e3e5',
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  fileName: {
    fontSize: '12px',
    color: '#303030',
  },
  fileRemove: {
    width: '20px',
    height: '20px',
    border: 'none',
    background: '#e1e3e5',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  attachBtn: {
    width: '40px',
    height: '40px',
    border: '1px solid #e1e3e5',
    backgroundColor: '#fff',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #e1e3e5',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    maxHeight: '100px',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    backgroundColor: '#303030',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedNotice: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#991b1b',
    textAlign: 'center',
  },
  reopenBtn: {
    background: 'none',
    border: 'none',
    color: '#303030',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatTitle: {
    margin: '16px 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#303030',
  },
  emptyChatText: {
    margin: 0,
    fontSize: '13px',
    color: '#6d7175',
  },
  infoPanel: {
    width: '280px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  infoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e1e3e5',
  },
  infoPanelTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  infoPanelClose: {
    width: '24px',
    height: '24px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6d7175',
  },
  infoSection: {
    padding: '16px',
    borderBottom: '1px solid #e1e3e5',
  },
  infoClient: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  infoName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#303030',
  },
  infoUsername: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#6d7175',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6d7175',
  },
  infoValue: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#303030',
  },
  infoPanelBtn: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e1e3e5',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  infoPanelBtnDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b',
  },
  infoPanelBtnSuccess: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
    color: '#065f46',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    width: '100%',
    maxWidth: '360px',
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#303030',
  },
  modalSubtitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#6d7175',
  },
  modalOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  modalOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    border: '1px solid #e1e3e5',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#303030',
    cursor: 'pointer',
  },
  modalOptionActive: {
    borderColor: '#303030',
    backgroundColor: '#f3f4f6',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e1e3e5',
    borderRadius: '8px',
    fontSize: '13px',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '12px',
  },
  modalCancel: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#6d7175',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalConfirm: {
    padding: '8px 16px',
    backgroundColor: '#303030',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default Support;
