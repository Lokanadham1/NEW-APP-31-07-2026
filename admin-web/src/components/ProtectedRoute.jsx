import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) return null; // avoid a login-page flash while restoring the session
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
