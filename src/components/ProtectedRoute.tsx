import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { UserRole } from '../types';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, currentUser, userProfile, loading, getDefaultRoute } = useAuth();
  const location = useLocation();

  const activeUser = user || currentUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <LoadingSpinner fullScreen label="Checking authentication status..." />
      </div>
    );
  }

  if (!activeUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    const fallbackRoute = getDefaultRoute(userProfile.role);
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};
