
import React from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user, loading } = useAuth();
  
  // Redirect to dashboard if already logged in
  if (user && !loading) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Workspace Hub</h1>
          <p className="mt-2 text-gray-600">
            Access your workspaces and content
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
};

export default Login;
