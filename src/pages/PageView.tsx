
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import PageEditor from '@/components/page/PageEditor';

const PageView: React.FC = () => {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { 
    selectWorkspace, 
    selectPage, 
    getWorkspaceById, 
    getPageById 
  } = useWorkspace();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (workspaceId && pageId) {
      const workspace = getWorkspaceById(workspaceId);
      const page = getPageById(pageId);
      
      if (workspace && page) {
        // Always force a fresh selection to prevent navigation issues
        selectWorkspace(workspaceId);
        selectPage(workspaceId, pageId);
      } else {
        // Workspace or page not found
        navigate('/');
      }
    }
  }, [workspaceId, pageId, selectWorkspace, selectPage, getWorkspaceById, getPageById, navigate]);

  const page = pageId ? getPageById(pageId) : null;
  const workspace = workspaceId ? getWorkspaceById(workspaceId) : null;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page || !workspace || !workspaceId || !pageId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Page not found</h2>
            <p className="mt-2 text-gray-600">The page you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <PageEditor
          workspaceId={workspaceId}
          pageId={page.id}
          title={page.title}
          content={page.content}
          attachments={page.attachments}
        />
      </div>
    </AppLayout>
  );
};

export default PageView;
