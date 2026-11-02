import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth();

  // Customer pages are open to everyone - never block with login redirect
  if (!requireAdmin) {
    return children;
  }

  // Admin pages require verified admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
