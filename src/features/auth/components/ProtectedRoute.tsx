import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { ROUTES } from '../../../shared/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * 
 * Checks if the user is authenticated and redirects to the login page if not.
 * If the user is authenticated, it renders the children (the protected route).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  // If authentication is still loading, show nothing (or a loading spinner)
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  // If not authenticated, redirect to login page with the return URL
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If authenticated, render the protected route
  return <>{children}</>;
};

export default ProtectedRoute;
