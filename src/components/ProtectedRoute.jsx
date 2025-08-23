import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // User logged in but does not have the required role, redirect to homepage or unauthorized page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
