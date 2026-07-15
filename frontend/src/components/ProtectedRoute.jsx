import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-samsung-gray">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-samsung-blue border-t-transparent"></div>
          <p className="text-samsung-grayText text-sm font-medium animate-pulse">
            Connecting to SmartThings...
          </p>
        </div>
      </div>
    );
  }

  if (requireAuth) {
    // Requires login: redirect to landing if not logged in
    return currentUser ? children : <Navigate to="/" replace />;
  } else {
    // Requires guest: redirect to dashboard if logged in
    return currentUser ? <Navigate to="/dashboard" replace /> : children;
  }
};

export default ProtectedRoute;
