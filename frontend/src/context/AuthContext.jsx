import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartdine_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartdine_token') || null);
  const [loading, setLoading] = useState(false);

  // Set default axios header
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user: userData, token: userToken } = response.data;
      setUser(userData);
      setToken(userToken);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', { name, email, password, phone });
      const { user: userData, token: userToken, message } = response.data;
      setLoading(false);
      return {
        success: true,
        message: message || 'Account created successfully!',
        user: userData,
        token: userToken
      };
    } catch (err) {
      setLoading(false);
      let errorMessage = 'Unable to create account. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartdine_user');
    localStorage.removeItem('smartdine_token');
  };

  const updateProfile = async (name, phone) => {
    try {
      const response = await axios.put('/api/auth/profile', { name, phone });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to update profile.'
      };
    }
  };

  const isAdmin = user && user.role === 'admin';
  const isCustomer = user && user.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isCustomer,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
