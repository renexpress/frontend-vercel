import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

// Chat status configuration
const CHAT_STATUS_CONFIG = {
  open: { label: 'Открыт', color: '#10B981', bg: '#D1FAE5' },
  pending: { label: 'В ожидании', color: '#F59E0B', bg: '#FEF3C7' },
  resolved: { label: 'Решён', color: '#6B7280', bg: '#F3F4F6' },
  closed: { label: 'Закрыт', color: '#9CA3AF', bg: '#F9FAFB' },
};

function Support() {
  // State
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Info panel
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    unread: 0,
  });

  // Admin users (mock data)
  const [adminUsers] = useState([
    { id: 1, name: 'Администратор 1' },
    { id: 2, name: 'Администратор 2' },
    { id: 3, name: 'Менеджер поддержки' },
  ]);

  // Load chats on mount
  useEffect(() => {
    loadChats();

    const pollInterval = setInterval(loadChats, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for messages when chat selected
  useEffect(() => {
    if (!selectedChat) return;

    const msgPollInterval = setInterval(() => {
      loadMessages(selectedChat.client_id);
    }, 5000);

    return () => clearInterval(msgPollInterval);
  }, [selectedChat]);

  // Filter chats based on search and status
  useEffect(() => {
    let filtered = [...chats];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.client_name?.toLowerCase().includes(query) ||
        chat.client_username?.toLowerCase().includes(query) ||
        chat.last_message?.toLowerCase().includes(query) ||
        chat.order_id?.toString().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'unread') {
        filtered = filtered.filter(chat => chat.unread_count > 0);
      } else {
        filtered = filtered.filter(chat => chat.status === statusFilter);
      }
    }

    // Sort by most recent
    filtered.sort((a, b) => {
      const dateA = new Date(a.last_message_time || 0);
      const dateB = new Date(b.last_message_time || 0);
      return dateB - dateA;
    });

    setFilteredChats(filtered);

    // Update stats
    setStats({
      total: chats.length,
      open: chats.filter(c => c.status === 'open' || !c.status).length,
      pending: chats.filter(c => c.status === 'pending').length,
      unread: chats.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    });
  }, [chats, searchQuery, statusFilter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/support/chats/`);
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (clientId) => {
    try {
      const response = await axios.get(`${API_URL}/support/${clientId}/messages/`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.client_id);

    // Mark messages as read
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
      if (selectedFile) {
        // Upload file first
        await uploadFile();
      }

      if (newMessage.trim()) {
        await axios.post(`${API_URL}/support/${selectedChat.client_id}/send/`, {
          message: newMessage,
          is_from_client: false
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
    if (file) {
      setSelectedFile(file);
    }
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
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/status/`, {
        status: newStatus
      });

      setSelectedChat(prev => ({ ...prev, status: newStatus }));
      loadChats();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      // Simulate for demo
      setSelectedChat(prev => ({ ...prev, status: newStatus }));
      setChats(prev => prev.map(c =>
        c.client_id === selectedChat.client_id ? { ...c, status: newStatus } : c
      ));
      setShowStatusModal(false);
    }
  };

  const assignChat = async (adminId) => {
    if (!selectedChat) return;

    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/assign/`, {
        admin_id: adminId
      });

      const admin = adminUsers.find(a => a.id === adminId);
      setSelectedChat(prev => ({ ...prev, assigned_to: admin?.name }));
      loadChats();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning chat:', error);
      // Simulate for demo
      const admin = adminUsers.find(a => a.id === adminId);
      setSelectedChat(prev => ({ ...prev, assigned_to: admin?.name }));
      setShowAssignModal(false);
    }
  };

  const closeChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/close/`, {
        reason: closeReason
      });

      setSelectedChat(prev => ({ ...prev, status: 'closed' }));
      loadChats();
      setShowCloseModal(false);
      setCloseReason('');
    } catch (error) {
      console.error('Error closing chat:', error);
      // Simulate for demo
      setSelectedChat(prev => ({ ...prev, status: 'closed' }));
      setChats(prev => prev.map(c =>
        c.client_id === selectedChat.client_id ? { ...c, status: 'closed' } : c
      ));
      setShowCloseModal(false);
      setCloseReason('');
    }
  };

  const reopenChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.post(`${API_URL}/support/${selectedChat.client_id}/reopen/`);
      setSelectedChat(prev => ({ ...prev, status: 'open' }));
      loadChats();
    } catch (error) {
      console.error('Error reopening chat:', error);
      // Simulate for demo
      setSelectedChat(prev => ({ ...prev, status: 'open' }));
      setChats(prev => prev.map(c =>
        c.client_id === selectedChat.client_id ? { ...c, status: 'open' } : c
      ));
    }
  };

  // Formatting helpers
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageType = (msg) => {
    if (msg.type === 'system') return 'system';
    if (msg.file_url) return 'file';
    if (msg.image_url) return 'image';
    return 'text';
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Group messages by date
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Загрузка чатов...</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Поддержка</h1>
          <p style={styles.subtitle}>Управление чатами с клиентами</p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Всего</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statValue, color: '#10B981' }}>{stats.open}</span>
            <span style={styles.statLabel}>Открытых</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statValue, color: '#F59E0B' }}>{stats.pending}</span>
            <span style={styles.statLabel}>В ожидании</span>
          </div>
          {stats.unread > 0 && (
            <div style={styles.statItem}>
              <span style={{ ...styles.statValue, color: '#EF4444' }}>{stats.unread}</span>
              <span style={styles.statLabel}>Непрочитанных</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Chat List Sidebar */}
        <div style={styles.sidebar}>
          {/* Search */}
          <div style={styles.searchSection}>
            <div style={styles.searchInputWrapper}>
              <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по имени, ID заказа..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button
                  style={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={styles.filterTabs}>
            {[
              { key: 'all', label: 'Все' },
              { key: 'unread', label: 'Непрочитанные' },
              { key: 'open', label: 'Открытые' },
              { key: 'pending', label: 'В ожидании' },
              { key: 'resolved', label: 'Решённые' },
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
                {filter.key === 'unread' && stats.unread > 0 && (
                  <span style={styles.filterBadge}>{stats.unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Chat List */}
          <div style={styles.chatList}>
            {filteredChats.length === 0 ? (
              <div style={styles.emptyChats}>
                <div style={styles.emptyChatIcon}>💬</div>
                <p style={styles.emptyChatText}>Чатов не найдено</p>
                <p style={styles.emptyChatHint}>
                  {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Чаты появятся когда клиенты напишут'}
                </p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <div
                  key={chat.client_id}
                  style={{
                    ...styles.chatItem,
                    ...(selectedChat?.client_id === chat.client_id ? styles.chatItemActive : {}),
                    ...(chat.unread_count > 0 ? styles.chatItemUnread : {}),
                  }}
                  onClick={() => selectChat(chat)}
                >
                  <div style={styles.chatAvatar}>
                    {chat.client_name?.charAt(0).toUpperCase() || 'К'}
                  </div>
                  <div style={styles.chatItemContent}>
                    <div style={styles.chatItemTop}>
                      <span style={styles.chatItemName}>{chat.client_name || chat.client_username}</span>
                      <span style={styles.chatItemTime}>
                        {chat.last_message_time ? formatDate(chat.last_message_time) : ''}
                      </span>
                    </div>
                    <div style={styles.chatItemMiddle}>
                      <span style={styles.chatItemUsername}>{chat.client_username}</span>
                      {chat.status && chat.status !== 'open' && (
                        <span style={{
                          ...styles.chatStatusBadge,
                          backgroundColor: CHAT_STATUS_CONFIG[chat.status]?.bg,
                          color: CHAT_STATUS_CONFIG[chat.status]?.color,
                        }}>
                          {CHAT_STATUS_CONFIG[chat.status]?.label}
                        </span>
                      )}
                    </div>
                    <div style={styles.chatItemBottom}>
                      <span style={styles.chatItemPreview}>
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

        {/* Chat Conversation Area */}
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderLeft}>
                  <div style={styles.chatHeaderAvatar}>
                    {selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}
                  </div>
                  <div style={styles.chatHeaderInfo}>
                    <div style={styles.chatHeaderName}>
                      {selectedChat.client_name || selectedChat.client_username}
                    </div>
                    <div style={styles.chatHeaderMeta}>
                      <span>{selectedChat.client_username}</span>
                      {selectedChat.status && (
                        <span style={{
                          ...styles.headerStatusBadge,
                          backgroundColor: CHAT_STATUS_CONFIG[selectedChat.status]?.bg || CHAT_STATUS_CONFIG.open.bg,
                          color: CHAT_STATUS_CONFIG[selectedChat.status]?.color || CHAT_STATUS_CONFIG.open.color,
                        }}>
                          {CHAT_STATUS_CONFIG[selectedChat.status]?.label || 'Открыт'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.chatHeaderActions}>
                  <button
                    style={styles.headerActionBtn}
                    onClick={() => setShowStatusModal(true)}
                    title="Изменить статус"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </button>
                  <button
                    style={styles.headerActionBtn}
                    onClick={() => setShowAssignModal(true)}
                    title="Назначить"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                  <button
                    style={{
                      ...styles.headerActionBtn,
                      ...(showInfoPanel ? styles.headerActionBtnActive : {}),
                    }}
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

              {/* Messages Container */}
              <div style={styles.messagesContainer}>
                {groupedMessages.map((item, index) => {
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${index}`} style={styles.dateDivider}>
                        <span style={styles.dateDividerText}>{formatDate(item.date)}</span>
                      </div>
                    );
                  }

                  const msg = item;
                  const msgType = getMessageType(msg);
                  const isClient = msg.is_from_client;

                  if (msgType === 'system') {
                    return (
                      <div key={msg.id || index} style={styles.systemMessage}>
                        <span style={styles.systemMessageText}>{msg.message}</span>
                        <span style={styles.systemMessageTime}>{formatTime(msg.created_at)}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: isClient ? 'flex-start' : 'flex-end',
                      }}
                    >
                      {isClient && (
                        <div style={styles.messageAvatar}>
                          {selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}
                        </div>
                      )}
                      <div style={{
                        ...styles.messageBubble,
                        ...(isClient ? styles.messageBubbleClient : styles.messageBubbleAdmin),
                      }}>
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Изображение"
                            style={styles.messageImage}
                            onClick={() => window.open(msg.image_url, '_blank')}
                          />
                        )}
                        {msg.file_url && !isImageFile(msg.file_url) && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.fileAttachment}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span>{msg.file_name || 'Файл'}</span>
                          </a>
                        )}
                        {msg.message && (
                          <p style={{
                            ...styles.messageText,
                            ...(isClient ? {} : { color: '#fff' }),
                          }}>
                            {msg.message}
                          </p>
                        )}
                        <div style={{
                          ...styles.messageFooter,
                          ...(isClient ? {} : { color: 'rgba(255,255,255,0.7)' }),
                        }}>
                          <span style={styles.messageTime}>{formatTime(msg.created_at)}</span>
                          {!isClient && msg.status && (
                            <span style={styles.messageStatus}>
                              {msg.status === 'sent' && '✓'}
                              {msg.status === 'delivered' && '✓✓'}
                              {msg.status === 'read' && '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={styles.inputArea}>
                {selectedFile && (
                  <div style={styles.filePreview}>
                    <div style={styles.filePreviewContent}>
                      {selectedFile.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          style={styles.filePreviewImage}
                        />
                      ) : (
                        <div style={styles.filePreviewIcon}>📎</div>
                      )}
                      <span style={styles.filePreviewName}>{selectedFile.name}</span>
                    </div>
                    <button
                      style={styles.filePreviewRemove}
                      onClick={() => setSelectedFile(null)}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div style={styles.inputRow}>
                  <button
                    style={styles.attachBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    title="Прикрепить файл"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                    style={styles.textarea}
                    rows={1}
                    disabled={selectedChat.status === 'closed'}
                  />
                  <button
                    style={{
                      ...styles.sendBtn,
                      opacity: (!newMessage.trim() && !selectedFile) || sending ? 0.5 : 1,
                    }}
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sending || selectedChat.status === 'closed'}
                  >
                    {sending ? (
                      <div style={styles.sendingSpinner}></div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </div>
                {selectedChat.status === 'closed' && (
                  <div style={styles.closedChatNotice}>
                    Чат закрыт.{' '}
                    <button style={styles.reopenLink} onClick={reopenChat}>
                      Открыть снова
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.emptyChat}>
              <div style={styles.emptyChatIconLarge}>💬</div>
              <h2 style={styles.emptyChatTitle}>Выберите чат</h2>
              <p style={styles.emptyChatDescription}>
                Выберите чат из списка слева для просмотра сообщений и ответа клиенту
              </p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        {selectedChat && showInfoPanel && (
          <div style={styles.infoPanel}>
            <div style={styles.infoPanelHeader}>
              <h3 style={styles.infoPanelTitle}>Информация о чате</h3>
              <button
                style={styles.infoPanelClose}
                onClick={() => setShowInfoPanel(false)}
              >
                ×
              </button>
            </div>

            {/* Client Info */}
            <div style={styles.infoSection}>
              <h4 style={styles.infoSectionTitle}>Клиент</h4>
              <div style={styles.clientCard}>
                <div style={styles.clientAvatarLarge}>
                  {selectedChat.client_name?.charAt(0).toUpperCase() || 'К'}
                </div>
                <div style={styles.clientInfo}>
                  <p style={styles.clientName}>{selectedChat.client_name || 'Клиент'}</p>
                  <p style={styles.clientUsername}>{selectedChat.client_username}</p>
                </div>
              </div>
              {selectedChat.client_phone && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Телефон</span>
                  <span style={styles.infoValue}>{selectedChat.client_phone}</span>
                </div>
              )}
              {selectedChat.client_email && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{selectedChat.client_email}</span>
                </div>
              )}
            </div>

            {/* Chat Details */}
            <div style={styles.infoSection}>
              <h4 style={styles.infoSectionTitle}>Детали чата</h4>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Статус</span>
                <span style={{
                  ...styles.statusValue,
                  backgroundColor: CHAT_STATUS_CONFIG[selectedChat.status]?.bg || CHAT_STATUS_CONFIG.open.bg,
                  color: CHAT_STATUS_CONFIG[selectedChat.status]?.color || CHAT_STATUS_CONFIG.open.color,
                }}>
                  {CHAT_STATUS_CONFIG[selectedChat.status]?.label || 'Открыт'}
                </span>
              </div>
              {selectedChat.assigned_to && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Назначен</span>
                  <span style={styles.infoValue}>{selectedChat.assigned_to}</span>
                </div>
              )}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Создан</span>
                <span style={styles.infoValue}>
                  {selectedChat.created_at ? formatFullDate(selectedChat.created_at) : '—'}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Последняя активность</span>
                <span style={styles.infoValue}>
                  {selectedChat.last_message_time ? formatFullDate(selectedChat.last_message_time) : '—'}
                </span>
              </div>
            </div>

            {/* Linked Orders */}
            {selectedChat.orders && selectedChat.orders.length > 0 && (
              <div style={styles.infoSection}>
                <h4 style={styles.infoSectionTitle}>Связанные заказы</h4>
                {selectedChat.orders.map(order => (
                  <div key={order.id} style={styles.orderCard}>
                    <span style={styles.orderNumber}>{order.order_number}</span>
                    <span style={styles.orderStatus}>{order.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={styles.infoSection}>
              <h4 style={styles.infoSectionTitle}>Действия</h4>
              <div style={styles.actionButtons}>
                <button
                  style={styles.actionBtn}
                  onClick={() => setShowStatusModal(true)}
                >
                  Изменить статус
                </button>
                <button
                  style={styles.actionBtn}
                  onClick={() => setShowAssignModal(true)}
                >
                  Назначить
                </button>
                {selectedChat.status !== 'closed' ? (
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                    onClick={() => setShowCloseModal(true)}
                  >
                    Закрыть чат
                  </button>
                ) : (
                  <button
                    style={{ ...styles.actionBtn, ...styles.actionBtnSuccess }}
                    onClick={reopenChat}
                  >
                    Открыть чат
                  </button>
                )}
              </div>
            </div>

            {/* Chat History / Audit Log */}
            <div style={styles.infoSection}>
              <h4 style={styles.infoSectionTitle}>История действий</h4>
              <div style={styles.auditLog}>
                <div style={styles.auditItem}>
                  <div style={styles.auditDot}></div>
                  <div style={styles.auditContent}>
                    <span style={styles.auditAction}>Чат создан</span>
                    <span style={styles.auditTime}>
                      {selectedChat.created_at ? formatFullDate(selectedChat.created_at) : '—'}
                    </span>
                  </div>
                </div>
                {selectedChat.assigned_to && (
                  <div style={styles.auditItem}>
                    <div style={styles.auditDot}></div>
                    <div style={styles.auditContent}>
                      <span style={styles.auditAction}>
                        Назначен: {selectedChat.assigned_to}
                      </span>
                      <span style={styles.auditTime}>—</span>
                    </div>
                  </div>
                )}
                {selectedChat.status === 'closed' && (
                  <div style={styles.auditItem}>
                    <div style={{ ...styles.auditDot, backgroundColor: '#EF4444' }}></div>
                    <div style={styles.auditContent}>
                      <span style={styles.auditAction}>Чат закрыт</span>
                      <span style={styles.auditTime}>—</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Изменить статус чата</h2>
            <div style={styles.statusOptions}>
              {Object.entries(CHAT_STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  style={{
                    ...styles.statusOption,
                    ...(selectedChat?.status === key ? styles.statusOptionActive : {}),
                  }}
                  onClick={() => updateChatStatus(key)}
                >
                  <span style={{
                    ...styles.statusDot,
                    backgroundColor: config.color,
                  }}></span>
                  {config.label}
                </button>
              ))}
            </div>
            <button
              style={styles.modalCancelBtn}
              onClick={() => setShowStatusModal(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Назначить чат</h2>
            <div style={styles.assignOptions}>
              {adminUsers.map(admin => (
                <button
                  key={admin.id}
                  style={styles.assignOption}
                  onClick={() => assignChat(admin.id)}
                >
                  <div style={styles.assignAvatar}>
                    {admin.name.charAt(0)}
                  </div>
                  {admin.name}
                </button>
              ))}
            </div>
            <button
              style={styles.modalCancelBtn}
              onClick={() => setShowAssignModal(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Close Chat Modal */}
      {showCloseModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCloseModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Закрыть чат</h2>
            <p style={styles.modalSubtitle}>
              Вы можете указать причину закрытия чата (необязательно)
            </p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Причина закрытия..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={3}
            />
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowCloseModal(false)}
              >
                Отмена
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={closeChat}
              >
                Закрыть чат
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 40px)',
    padding: '20px',
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#6B7280',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {},
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748B',
  },
  headerStats: {
    display: 'flex',
    gap: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748B',
  },
  content: {
    display: 'flex',
    flex: 1,
    gap: '16px',
    minHeight: 0,
    overflow: 'hidden',
  },
  // Sidebar
  sidebar: {
    width: '320px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  searchSection: {
    padding: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    width: '18px',
    height: '18px',
    color: '#9CA3AF',
  },
  searchInput: {
    width: '100%',
    padding: '10px 36px 10px 40px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '8px',
    width: '24px',
    height: '24px',
    border: 'none',
    background: '#F1F5F9',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabs: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
    overflowX: 'auto',
  },
  filterTab: {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748B',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  filterTabActive: {
    backgroundColor: '#FFF5F2',
    color: '#FF6B35',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyChats: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyChatIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyChatText: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyChatHint: {
    margin: '8px 0 0 0',
    fontSize: '13px',
    color: '#64748B',
  },
  chatItem: {
    display: 'flex',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #F8FAFC',
    transition: 'background-color 0.2s',
  },
  chatItemActive: {
    backgroundColor: '#FFF5F2',
    borderLeft: '3px solid #FF6B35',
  },
  chatItemUnread: {
    backgroundColor: '#FFF9F5',
  },
  chatAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    marginRight: '12px',
    flexShrink: 0,
  },
  chatItemContent: {
    flex: 1,
    minWidth: 0,
  },
  chatItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  chatItemName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1E293B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chatItemTime: {
    fontSize: '11px',
    color: '#9CA3AF',
    flexShrink: 0,
    marginLeft: '8px',
  },
  chatItemMiddle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  chatItemUsername: {
    fontSize: '12px',
    color: '#64748B',
  },
  chatStatusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '600',
  },
  chatItemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatItemPreview: {
    fontSize: '13px',
    color: '#64748B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    marginLeft: '8px',
    flexShrink: 0,
  },
  // Chat Area
  chatArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
  },
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chatHeaderAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  chatHeaderInfo: {},
  chatHeaderName: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1E293B',
  },
  chatHeaderMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  headerStatusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '600',
  },
  chatHeaderActions: {
    display: 'flex',
    gap: '8px',
  },
  headerActionBtn: {
    width: '36px',
    height: '36px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
    transition: 'all 0.2s',
  },
  headerActionBtnActive: {
    backgroundColor: '#FFF5F2',
    borderColor: '#FF6B35',
    color: '#FF6B35',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px 0',
  },
  dateDividerText: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  systemMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '16px 0',
    padding: '12px 16px',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
  },
  systemMessageText: {
    fontSize: '13px',
    color: '#64748B',
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: '11px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '12px',
  },
  messageAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
  },
  messageBubbleClient: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderBottomLeftRadius: '4px',
  },
  messageBubbleAdmin: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: '4px',
  },
  messageImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  fileAttachment: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#1E293B',
    fontSize: '13px',
    marginBottom: '8px',
  },
  messageText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1E293B',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
    marginTop: '6px',
  },
  messageTime: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  messageStatus: {
    fontSize: '12px',
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  emptyChatIconLarge: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyChatTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyChatDescription: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '300px',
  },
  // Input Area
  inputArea: {
    padding: '16px 20px',
    borderTop: '1px solid #F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  filePreviewContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filePreviewImage: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    objectFit: 'cover',
  },
  filePreviewIcon: {
    fontSize: '24px',
  },
  filePreviewName: {
    fontSize: '13px',
    color: '#1E293B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
  },
  filePreviewRemove: {
    width: '28px',
    height: '28px',
    border: 'none',
    background: '#E2E8F0',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
  },
  attachBtn: {
    width: '44px',
    height: '44px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  textarea: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    maxHeight: '120px',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    border: 'none',
    backgroundColor: '#FF6B35',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  sendingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  closedChatNotice: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#FEF2F2',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#DC2626',
    textAlign: 'center',
  },
  reopenLink: {
    background: 'none',
    border: 'none',
    color: '#FF6B35',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  // Info Panel
  infoPanel: {
    width: '320px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  infoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
  },
  infoPanelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
  },
  infoPanelClose: {
    width: '28px',
    height: '28px',
    border: 'none',
    background: '#F1F5F9',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
  },
  infoSectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  clientCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  clientAvatarLarge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  clientInfo: {},
  clientName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  clientUsername: {
    margin: '2px 0 0 0',
    fontSize: '13px',
    color: '#64748B',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1E293B',
  },
  statusValue: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  orderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  orderNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  orderStatus: {
    fontSize: '11px',
    color: '#64748B',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionBtn: {
    padding: '10px 16px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1E293B',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  actionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    color: '#DC2626',
  },
  actionBtnSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    color: '#059669',
  },
  auditLog: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  auditItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  auditDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    marginTop: '6px',
    flexShrink: 0,
  },
  auditContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  auditAction: {
    fontSize: '13px',
    color: '#1E293B',
  },
  auditTime: {
    fontSize: '11px',
    color: '#9CA3AF',
    marginTop: '2px',
  },
  // Modals
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#64748B',
  },
  statusOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  statusOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1E293B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusOptionActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  assignOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  assignOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1E293B',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  assignAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  modalCancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '10px 20px',
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default Support;
