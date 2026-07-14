import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('codeverse_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);

  // Determine user state by validating token on boot
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            await fetchNotifications(token);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Auth initialization failed', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('codeverse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchNotifications(data.token);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, role })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('codeverse_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchNotifications(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('codeverse_token');
    setToken('');
    setUser(null);
    setNotifications([]);
    setStats(null);
  };

  const updateProfile = async (name, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    setUser(prev => ({ ...prev, name: data.user.name }));
    return data;
  };

  const fetchNotifications = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    }
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      loading,
      notifications,
      stats,
      API_BASE_URL,
      login,
      register,
      logout,
      updateProfile,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      fetchDashboardStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
