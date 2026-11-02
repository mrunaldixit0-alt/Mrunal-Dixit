import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Ensure Axios has the Authorization header immediately upon module evaluation
const initialToken = localStorage.getItem('smartdine_token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Request interceptor guarantees any outgoing request has the latest token from storage
axios.interceptors.request.use(
  (config) => {
    const currentToken = localStorage.getItem('smartdine_token');
    if (currentToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smartdine_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Synchronize Axios default Authorization header and localStorage
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('smartdine_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('smartdine_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('smartdine_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartdine_user');
    }
  }, [user]);

  // Customer Login (Email + Password)
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        email: email.trim(),
        password
      });

      const { user: userData, token: userToken } = response.data;
      setUser(userData);
      setToken(userToken);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  // Dedicated Administrator Login
  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/admin/login', {
        email: email.trim(),
        password
      });

      const { user: userData, token: userToken } = response.data;
      setUser(userData);
      setToken(userToken);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Administrator login failed. Check email and password.';
      return { success: false, error: errorMessage };
    }
  };

  // Customer Registration (Name, Email, Phone, Password)
  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim()
      });

      const { user: userData, token: userToken, message } = response.data;
      setUser(userData);
      setToken(userToken);
      setLoading(false);
      return {
        success: true,
        message: message || 'Account created successfully!',
        user: userData,
        token: userToken
      };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed. Please try again.'
      };
    }
  };

  // Optional Guest Session (Browsing & Ordering without Account)
  const continueAsGuest = async (name = '', phone = '') => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/guest-access', { name, phone });
      const { user: guestData, token: guestToken } = response.data;
      setUser(guestData);
      setToken(guestToken);
      setLoading(false);
      return { success: true, user: guestData };
    } catch (err) {
      // Local fallback for offline mode
      const fallbackGuest = {
        id: 'guest_' + Date.now(),
        name: name || 'Guest Diner',
        email: '',
        phone: phone || '',
        role: 'guest',
        isGuest: true
      };
      setUser(fallbackGuest);
      setToken('guest_local_token_' + Date.now());
      setLoading(false);
      return { success: true, user: fallbackGuest };
    }
  };

  // Clean Logout
  const logout = () => {
    localStorage.removeItem('smartdine_user');
    localStorage.removeItem('smartdine_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (name, phone) => {
    try {
      const response = await axios.put('/api/auth/profile', { name, phone });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (err) {
      if (user) {
        const updated = { ...user, name: name || user.name, phone: phone || user.phone };
        setUser(updated);
        return { success: true, user: updated };
      }
      return { success: false, error: 'Failed to update profile.' };
    }
  };

  const resetPassword = async (email, newPassword) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: email.trim(),
        newPassword
      });
      setLoading(false);
      return { success: true, message: response.data?.message || 'Password reset successfully!' };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to reset password. Please check your email.'
      };
    }
  };

  const isAdmin = user && user.role === 'admin';
  const isCustomer = user && user.role === 'customer';
  const isGuest = user && user.role === 'guest';
  const isAuthenticated = !!user && user.role !== 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        adminLogin,
        register,
        continueAsGuest,
        logout,
        updateProfile,
        resetPassword,
        isAdmin,
        isCustomer,
        isGuest,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
