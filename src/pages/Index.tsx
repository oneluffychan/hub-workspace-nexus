
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import WorkspaceContent from '@/components/workspace/WorkspaceContent';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to Workspace Hub</h1>
            <p className="mt-2 text-gray-600">
              Please login or create an account to continue
            </p>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/login')}>Login</Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <WorkspaceContent />
    </AppLayout>
  );
};

export default Index;
