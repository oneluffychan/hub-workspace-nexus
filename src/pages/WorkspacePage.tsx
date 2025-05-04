
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceContent from '@/components/workspace/WorkspaceContent';

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { selectWorkspace, getWorkspaceById } = useWorkspace();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (workspaceId) {
      const workspace = getWorkspaceById(workspaceId);
      
      if (workspace) {
        // Force a fresh selection of the workspace to fix navigation issues
        selectWorkspace(workspaceId);
      } else {
        // Workspace not found or not accessible
        navigate('/');
      }
    }
  }, [workspaceId, getWorkspaceById, navigate, selectWorkspace]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <WorkspaceContent />
    </AppLayout>
  );
};

export default WorkspacePage;
