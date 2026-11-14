import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  return children;
};
