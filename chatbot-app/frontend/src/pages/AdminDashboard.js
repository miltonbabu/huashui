import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    } else {
      loadData();
    }
  }, [isAdmin, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const response = await adminAPI.getStats();
        setStats(response.data.stats);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getUsers();
        setUsers(response.data.users);
      } else if (activeTab === 'conversations') {
        const response = await adminAPI.getConversations();
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete all user data.')) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: !currentStatus } : u
      ));
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h1>Admin Panel</h1>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Overview
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            Users
          </button>

          <button
            className={`nav-item ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Conversations
          </button>
        </nav>

        <div className="admin-footer">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Chat
          </button>
          <button className="btn btn-danger" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="admin-content">
                <div className="content-header">
                  <h2>System Overview</h2>
                  <p>Monitor your HuaShui AI platform</p>
                </div>

                <div className="stats-grid">
                  <StatCard
                    title="Total Users"
                    value={stats.users.total}
                    subtitle={`${stats.users.active} active`}
                    color="primary"
                    icon={
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                    }
                  />

                  <StatCard
                    title="Conversations"
                    value={stats.conversations.total}
                    subtitle={`${stats.conversations.active} active this week`}
                    color="success"
                    icon={
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    }
                  />

                  <StatCard
                    title="Total Messages"
                    value={stats.messages.total.toLocaleString()}
                    subtitle={`${stats.messages.totalByUsers.toLocaleString()} by users`}
                    color="warning"
                    icon={
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    }
                  />

                  <StatCard
                    title="Total Tokens"
                    value={(stats.tokens.total / 1000000).toFixed(2) + 'M'}
                    subtitle="Processed tokens"
                    color="info"
                    icon={
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    }
                  />
                </div>

                <div className="model-stats">
                  <div className="card">
                    <div className="card-header">
                      <h3>Model Usage</h3>
                    </div>
                    <div className="model-stats-grid">
                      {stats.models.huashui1 && (
                        <div className="model-stat-card huashui-1">
                          <div className="model-stat-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          </div>
                          <div>
                            <h4>HuaShui 1.0</h4>
                            <div className="stat-value">{stats.models.huashui1.conversations}</div>
                            <p>{stats.models.huashui1.messages} messages</p>
                          </div>
                        </div>
                      )}

                      {stats.models.huashuiReasoning && (
                        <div className="model-stat-card huashui-reasoning">
                          <div className="model-stat-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                              <path d="M2 17L12 22L22 17"/>
                            </svg>
                          </div>
                          <div>
                            <h4>HuaShui Reasoning</h4>
                            <div className="stat-value">{stats.models.huashuiReasoning.conversations}</div>
                            <p>{stats.models.huashuiReasoning.messages} messages</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="admin-content">
                <div className="content-header">
                  <h2>User Management</h2>
                  <p>Manage all registered users</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Messages</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{user.name}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge badge-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{user.usage.totalMessages}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon"
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'conversations' && (
              <div className="admin-content">
                <div className="content-header">
                  <h2>Recent Conversations</h2>
                  <p>Monitor user conversations across the platform</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>User</th>
                        <th>Model</th>
                        <th>Messages</th>
                        <th>Last Activity</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.map(conv => (
                        <tr key={conv.id}>
                          <td className="conversation-title">{conv.title}</td>
                          <td>{conv.userId?.name || 'Unknown'}</td>
                          <td>
                            <span className={`badge badge-${conv.model}`}>
                              {conv.model}
                            </span>
                          </td>
                          <td>{conv.messageCount}</td>
                          <td>{new Date(conv.lastMessageAt).toLocaleString()}</td>
                          <td>{new Date(conv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
