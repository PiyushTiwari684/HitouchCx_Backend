import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

// Why this component? This is a wrapper that "protects" routes.
// It will be used in App.jsx.

const ProtectedRoute = () => {
  // 1. Get the authentication state from our global context
  const { isAuthenticated } = useAuth();

  // 2. Check if the user is authenticated
  if (isAuthenticated) {
    // If YES, render the child component.
    // <Outlet /> is a placeholder from react-router-dom
    // that says "render whatever child route is nested inside me."
    return <Outlet />;
  }

  // 3. If NO, redirect the user to the /login page
  // 'replace' is a good practice: it replaces the current history entry
  // so the user can't click the "back" button to get back to the
  // protected page they were just redirected from.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;