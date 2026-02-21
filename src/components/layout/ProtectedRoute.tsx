/**
 * Protected Route Component
 * 
 * - Checks authentication via AuthContext
 * - Redirects unauthenticated users to /login
 * - Enforces admin-only access when adminOnly prop is set
 * - Redirects first-time students to /change-password
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  // Loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force first-time students to change password
  if (
    userData?.firstLogin && 
    userData?.role === 'STUDENT' && 
    location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  // Check admin access
  if (adminOnly && userData?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
