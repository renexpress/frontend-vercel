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
  const [statusFilter] = useState('all');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [chatAdmins, setChatAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, unread: 0 });

  // Load current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 200);
  }, []);

  useEffect(() => {
    loadChats();
    const pollInterval = setInterval(loadChats, 10000);
    return () => clearInterval(pollInterval);
  }, []);


  useEffect(() => {
    if (!selectedChat) return;
    const msgPollInterval = setInterval(() => {
      loadMessages(selectedChat.client_id);
    }, 5000);
    return () => clearInterval(msgPollInterval);
  }, [selectedChat]);

  // Scroll to bottom and mark as read when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && selectedChat) {
      scrollToBottom();
      // Mark messages as read if we're viewing this chat
      axios.post(`${API_URL}/support/${selectedChat.client_id}/read/`).then(() => {
        loadChats(); // Refresh chat list to update unread count
      }).catch(() => {});
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, selectedChat, scrollToBottom]);

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

  const loadChats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params = new URLSearchParams();
      if (user.id) params.append('admin_id', user.id);
      if (user.is_main_admin) params.append('is_main_admin', 'true');

      const response = await axios.get(`${API_URL}/support/chats/?${params.toString()}`);
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

  const loadChatAdmins = async (clientId) => {
    try {
      const response = await axios.get(`${API_URL}/support/${clientId}/admins/`);
      if (response.data.success) setChatAdmins(response.data.admins);
    } catch (error) {
      console.error('Error loading chat admins:', error);
    }
  };

  const handleAdminToggle = async (adminId, isAssigned) => {
    // Only main admin can change assignments
    if (!currentUser?.is_main_admin) return;

    const newAdmins = chatAdmins.map(admin =>
      admin.id === adminId ? { ...admin, is_assigned: !isAssigned } : admin
    );
    setChatAdmins(newAdmins);

    try {
      const assignedIds = newAdmins.filter(a => a.is_assigned).map(a => a.id);
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/admins/update/`, {
        admin_ids: assignedIds
      });
    } catch (error) {
      console.error('Error updating chat admins:', error);
      // Revert on error
      loadChatAdmins(selectedChat.client_id);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    prevMessageCountRef.current = 0; // Reset so scroll triggers for new chat
    const response = await axios.get(`${API_URL}/support/${chat.client_id}/messages/`);
    if (response.data.success) {
      setMessages(response.data.messages);
      // Instantly be at bottom when opening a new chat
      scrollToBottom();
    }
    // Load admins for this chat
    loadChatAdmins(chat.client_id);
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
      const adminNameWithPosition = user.position ? `${adminName} (${user.position})` : adminName;

      if (selectedFile) await uploadFile();
      if (newMessage.trim()) {
        await axios.post(`${API_URL}/support/${selectedChat.client_id}/send/`, {
          message: newMessage,
          is_from_client: false,
          admin_name: adminNameWithPosition
        });
        await loadMessages(selectedChat.client_id);
        scrollToBottom();
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
    setIsUploadingFile(true);
    try {
      // Upload image to Azure using general upload endpoint
      const formData = new FormData();
      formData.append('image', selectedFile);

      console.log('Uploading file:', selectedFile.name);
      const uploadResponse = await axios.post(`${API_URL}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload response:', uploadResponse.data);

      if (uploadResponse.data.success && uploadResponse.data.url) {
        // Get current admin name from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const adminName = user.full_name || user.username || 'Администратор';
        const adminNameWithPosition = user.position ? `${adminName} (${user.position})` : adminName;

        // Send message with image URL
        await axios.post(`${API_URL}/support/${selectedChat.client_id}/send/`, {
          message: '',
          image_url: uploadResponse.data.url,
          is_from_client: false,
          admin_name: adminNameWithPosition
        });
        await loadMessages(selectedChat.client_id);
        scrollToBottom();
      } else {
        console.error('Upload failed:', uploadResponse.data);
        alert('Ошибка загрузки: ' + (uploadResponse.data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUploadingFile(false);
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
        <h1 style={styles.title}>Поддержка</h1>
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
                    </div>
                  </div>
                </div>
                <button
                  style={styles.burgerBtn}
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  title={showInfoPanel ? 'Закрыть' : 'Меню'}
                >
                  {showInfoPanel ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.5">
                      <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                  )}
                </button>
              </div>

              <div id="messages-container" style={styles.messagesArea} ref={messagesContainerRef}>
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
                      <div style={{ ...styles.msgWrapper, alignItems: isClient ? 'flex-start' : 'flex-end' }}>
                        {!isClient && msg.admin_name && (
                          <div style={styles.adminNameLabel}>{msg.admin_name}</div>
                        )}
                        {msg.image_url && (
                          <img src={msg.image_url} alt="" style={styles.msgImage} onClick={() => setViewingImage(msg.image_url)} />
                        )}
                        {msg.message && (
                          <div style={{ ...styles.msgBubble, ...(isClient ? styles.msgBubbleClient : styles.msgBubbleAdmin) }}>
                            <p style={{ ...styles.msgText, ...(isClient ? styles.msgTextClient : {}) }}>{msg.message}</p>
                          </div>
                        )}
                        <span style={styles.msgTimeOutside}>{formatTime(msg.created_at)}</span>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
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
            <div style={{...styles.infoSection, borderBottom: 'none'}}>
              <span style={styles.infoSectionTitleGradient}>Доступ к чату</span>
              <div style={styles.adminList}>
                {chatAdmins.map(admin => (
                  <label
                    key={admin.id}
                    style={{
                      ...styles.adminItem,
                      opacity: currentUser?.is_main_admin ? 1 : 0.7,
                      cursor: currentUser?.is_main_admin ? 'pointer' : 'default'
                    }}
                  >
                    <div
                      style={{
                        ...styles.customCheckbox,
                        ...(admin.is_assigned ? styles.customCheckboxChecked : {})
                      }}
                      onClick={() => currentUser?.is_main_admin && handleAdminToggle(admin.id, admin.is_assigned)}
                    >
                      {admin.is_assigned && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div style={styles.adminInfo}>
                      <span style={styles.adminName}>{admin.full_name}</span>
                      {admin.position && <span style={styles.adminPosition}>{admin.position}</span>}
                    </div>
                  </label>
                ))}
              </div>
              {!currentUser?.is_main_admin && (
                <span style={styles.adminHint}>Только главный администратор может изменять доступ</span>
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

      {/* Image Lightbox */}
      {viewingImage && (
        <div style={styles.lightboxOverlay} onClick={() => setViewingImage(null)}>
          <button style={styles.lightboxClose} onClick={() => setViewingImage(null)}>×</button>
          <img src={viewingImage} alt="" style={styles.lightboxImage} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '12px 20px',
    height: 'calc(100vh - 100px)',
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
    marginBottom: '10px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    width: '260px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
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
    gap: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s',
  },
  chatItemActive: {
    backgroundColor: '#f3f4f6',
    borderLeft: '3px solid #303030',
  },
  chatAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
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
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chatTime: {
    fontSize: '11px',
    color: '#303030',
  },
  chatBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    fontSize: '12px',
    color: '#303030',
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
    minHeight: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #e1e3e5',
  },
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  chatHeaderAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  chatHeaderName: {
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  chatHeaderMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#303030',
  },
  burgerBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6d7175',
    transition: 'background-color 0.15s',
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
    minHeight: 0,
    padding: '12px',
    paddingBottom: '70px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
  },
  dateDivider: {
    display: 'flex',
    justifyContent: 'center',
    margin: '10px 0',
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
    gap: '6px',
    marginBottom: '8px',
  },
  msgAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    backgroundColor: '#303030',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
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
    padding: '8px 12px',
    borderRadius: '10px',
  },
  msgBubbleClient: {
    backgroundColor: '#fff',
    border: '1px solid #e8e8e8',
    borderBottomLeftRadius: '4px',
  },
  msgBubbleAdmin: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderBottomRightRadius: '4px',
  },
  msgTextClient: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  msgImage: {
    maxWidth: '100%',
    maxHeight: '240px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    border: 'none',
    display: 'block',
    objectFit: 'cover',
  },
  msgText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#fff',
  },
  msgTime: {
    fontSize: '10px',
    marginTop: '4px',
    display: 'block',
    textAlign: 'right',
  },
  msgTimeOutside: {
    fontSize: '11px',
    color: '#8c9196',
    marginTop: '4px',
  },
  inputArea: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '8px 12px',
    backgroundColor: 'transparent',
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
    width: '34px',
    height: '34px',
    border: 'none',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    flex: 1,
    padding: '8px 16px',
    border: 'none',
    borderRadius: '24px',
    fontSize: '13px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    maxHeight: '80px',
    background: 'linear-gradient(to right, rgba(42, 171, 171, 0.3), rgba(10, 37, 53, 0.3))',
  },
  sendBtn: {
    width: '34px',
    height: '34px',
    border: 'none',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    borderRadius: '8px',
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
    width: '240px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e1e3e5',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  infoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
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
    padding: '12px',
    borderBottom: '1px solid #e1e3e5',
  },
  infoSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6d7175',
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'block',
  },
  infoSectionTitleGradient: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'block',
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  customCheckbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  customCheckboxChecked: {
    background: 'linear-gradient(to right, #2AABAB, #0a2535)',
    border: 'none',
  },
  adminList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  adminItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
  },
  adminCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'inherit',
  },
  adminInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  adminName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
  },
  adminPosition: {
    fontSize: '11px',
    color: '#6d7175',
  },
  adminHint: {
    fontSize: '11px',
    color: '#8c9196',
    fontStyle: 'italic',
    marginTop: '8px',
    display: 'block',
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
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    cursor: 'pointer',
  },
  lightboxClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '24px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    maxWidth: '85%',
    maxHeight: '85%',
    objectFit: 'contain',
    borderRadius: '8px',
    cursor: 'default',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
  },
};

export default Support;
