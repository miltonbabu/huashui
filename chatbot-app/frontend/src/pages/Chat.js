import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { conversationsAPI, messagesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Chat.css';

const Chat = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(user?.preferences?.defaultModel || 'huashui-1');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showDeepthinkText, setShowDeepthinkText] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({});
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    loadConversations();
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✓ WebSocket connected');
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ WebSocket disconnected');
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('new-message', (data) => {
      if (data.type === 'assistant') {
        setMessages(prev => [...prev, data.message]);
        setAiTyping(false);
        setLoading(false);
        loadConversations();
      }
    });

    socketRef.current.on('ai-typing', (data) => {
      setAiTyping(true);
    });

    socketRef.current.on('ai-error', (data) => {
      setError(data.error);
      setAiTyping(false);
      setLoading(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
    });
  };

  useEffect(() => {
    if (currentConversation && socketRef.current) {
      socketRef.current.emit('join-conversation', currentConversation.id);
      
      return () => {
        socketRef.current.emit('leave-conversation', currentConversation.id);
      };
    }
  }, [currentConversation]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationsAPI.getAll({ archived: false });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await messagesAPI.getByConversation(conversationId);
      setMessages(response.data.messages);
      setError(null);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await conversationsAPI.create({
        title: 'New Conversation',
        model: selectedModel
      });
      const newConversation = response.data.conversation;
      setCurrentConversation(newConversation);
      setMessages([]);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const messageText = inputMessage.trim();
    let conversationId = currentConversation?.id;

    if (!conversationId) {
      try {
        const response = await conversationsAPI.create({
          title: 'New Conversation',
          model: selectedModel
        });
        const newConversation = response.data.conversation;
        setCurrentConversation(newConversation);
        conversationId = newConversation.id;
        setMessages([]);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        setError('Failed to create conversation');
        return;
      }
    }

    setInputMessage('');
    setLoading(true);
    setError(null);

    const tempUserMessage = {
      role: 'user',
      content: messageText,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await messagesAPI.send({
        conversationId: conversationId,
        content: messageText,
        model: selectedModel
      });

      setMessages(prev => [
        ...prev.slice(0, -1),
        response.data.userMessage,
        response.data.assistantMessage
      ]);

      loadConversations();
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.slice(0, -1));
      
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 3) {
        setTimeout(() => {
          setInputMessage(messageText);
        }, 100);
      }
    } finally {
      setLoading(false);
      setAiTyping(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setSelectedModel(conversation.model);
    setError(null);
    setRetryCount(0);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await conversationsAPI.delete(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setError('Failed to delete conversation');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    const hasReasoning = msg.reasoning && msg.reasoning.length > 0;
    const isThinkingExpanded = expandedThinking[index];
    
    return (
      <div key={index} className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className="message-header">
          <div className="message-avatar">
            {isUser ? (
              <div className="avatar user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="avatar ai-avatar">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            )}
          </div>
          <div className="message-info">
            <span className="message-sender">{isUser ? 'You' : 'HuaShui AI'}</span>
            <span className="message-time">{formatDate(msg.createdAt)}</span>
          </div>
        </div>
        
        {!isUser && hasReasoning && (
          <div className="thinking-section">
            <button 
              className="thinking-toggle"
              onClick={() => setExpandedThinking(prev => ({ ...prev, [index]: !prev[index] }))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2.5"/>
                <ellipse cx="12" cy="12" rx="9" ry="4"/>
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/>
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>
              </svg>
              <span>{isThinkingExpanded ? 'Hide Thinking' : 'Show Thinking'}</span>
              <svg className={`chevron ${isThinkingExpanded ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            {isThinkingExpanded && (
              <div className="thinking-content">
                <div className="thinking-header">
                  <span>💭 Thinking Process</span>
                </div>
                <div className="thinking-text">
                  {msg.reasoning}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="message-content">
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <>
              <ReactMarkdown
                children={msg.content}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              />
              <p className="ai-footer-text">Generated by HuaShui AI</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">HuaShui AI</span>
          </div>
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot"></span>
          </div>
        </div>

        <button 
          className={`btn btn-primary new-chat-btn ${!currentConversation || messages.length === 0 ? 'disabled' : ''}`} 
          onClick={handleNewConversation}
          disabled={!currentConversation || messages.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Chat
        </button>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
              <small>Start a new chat to begin</small>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className="conversation-content">
                  <h4>{conv.title}</h4>
                  {conv.lastMessagePreview && (
                    <p className="conversation-preview">{conv.lastMessagePreview}</p>
                  )}
                  <div className="conversation-meta">
                    <span className={`badge badge-${conv.model}`}>
                      {conv.model === 'huashui-1' ? 'HuaShui 1.0' : 'HuaShui Reasoning'}
                    </span>
                    <span className="message-count">{conv.messageCount} messages</span>
                  </div>
                </div>
                <button
                  className="btn-icon delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer" ref={profileDropdownRef}>
          <div 
            className="user-info"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
            </div>
            <svg 
              className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
          
          {profileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-name">{user?.name}</span>
                <span className="dropdown-email">{user?.email}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
                {theme === 'dark' ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <button className="dropdown-item" onClick={() => alert('Settings coming soon!')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Settings</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <button 
            className="sidebar-toggle-header"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
          
          {currentConversation && (
            <div className="model-selector">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="model-select"
              >
                <option value="huashui-1">HuaShui 1.0</option>
                <option value="huashui-reasoning">HuaShui Reasoning</option>
              </select>
            </div>
          )}
        </div>

        <div className="messages-container">
          {!currentConversation ? (
            <div className="welcome-screen">
              <div className="welcome-content">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h1>Welcome to HuaShui AI</h1>
                <p>Start a conversation by typing a message below</p>
                
                <div className="quick-actions">
                  <button 
                    className="quick-action-btn"
                    onClick={() => setInputMessage('Tell me about yourself')}
                  >
                    <span>👋</span> Introduce yourself
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => setInputMessage('Help me write code')}
                  >
                    <span>💻</span> Help with code
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => setInputMessage('Explain a concept')}
                  >
                    <span>💡</span> Explain something
                  </button>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Start your conversation</h3>
              <p>Type a message below to begin chatting with HuaShui AI</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => renderMessage(msg, index))}
              {aiTyping && (
                <div className="message assistant-message typing-indicator">
                  <div className="message-avatar">
                    <div className="avatar ai-avatar">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className={`message-input-container ${messages.length > 0 ? 'has-messages' : ''}`}>
          <div className="input-wrapper">
            <button 
              type="button"
              className={`deepthink-btn ${selectedModel === 'huashui-reasoning' ? 'active' : ''}`}
              onClick={() => {
                setSelectedModel(selectedModel === 'huashui-reasoning' ? 'huashui-1' : 'huashui-reasoning');
                setShowDeepthinkText(true);
                setTimeout(() => setShowDeepthinkText(false), 2000);
              }}
              onMouseEnter={() => setShowDeepthinkText(true)}
              onMouseLeave={() => setShowDeepthinkText(false)}
              title={selectedModel === 'huashui-reasoning' ? 'Switch to HuaShui 1.0' : 'Enable DeepThink (Reasoning)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="2.5"/>
                <ellipse cx="12" cy="12" rx="9" ry="4"/>
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/>
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>
              </svg>
              {showDeepthinkText && <span className="deepthink-text">DeepThink</span>}
            </button>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedModel === 'huashui-reasoning' ? 'Type your message for deep reasoning...' : 'Type your message...'}
              className="message-input"
              rows="1"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={!inputMessage.trim() || loading}
            >
              {loading ? (
                <div className="loading-spinner small"></div>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
