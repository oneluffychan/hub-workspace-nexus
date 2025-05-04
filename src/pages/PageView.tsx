import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import PageEditor from '@/components/page/PageEditor';
import CollapsibleSidebar from '@/components/workspace/CollapsibleSidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';

const PageView: React.FC = () => {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { 
    selectWorkspace, 
    selectPage, 
    getWorkspaceById, 
    getPageById,
    deletePage,
    createPage,
    currentWorkspace
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);

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

  // Handlers for sidebar
  const handleCreatePage = async () => {
    if (!workspaceId) return;
    const newPageId = await createPage(workspaceId, "Untitled Page");
    if (newPageId) {
      navigate(`/workspace/${workspaceId}/page/${newPageId}`);
    }
  };
  
  const handleSelectPage = (selectedPageId: string) => {
    if (!workspaceId) return;
    navigate(`/workspace/${workspaceId}/page/${selectedPageId}`);
  };

  const handleDeleteClick = (selectedPageId: string) => {
    setPageToDelete(selectedPageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete || !workspaceId) return;
    
    await deletePage(workspaceId, pageToDelete);
    setIsDeleteDialogOpen(false);
    setPageToDelete(null);
    
    // If we deleted the current page, navigate to workspace
    if (pageToDelete === pageId) {
      navigate(`/workspace/${workspaceId}`);
    }
  };

  // Filter pages based on search query
  const filteredPages = workspace && searchQuery
    ? workspace.pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workspace?.pages || [];

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
      <div className="flex h-full w-full">
        {/* Keep sidebar visible on all pages */}
        <CollapsibleSidebar
          onCreatePage={handleCreatePage}
          onSelectPage={handleSelectPage}
          onDeleteClick={handleDeleteClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredPages={filteredPages}
          currentPageId={page.id}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <PageEditor
            workspaceId={workspaceId}
            pageId={page.id}
            title={page.title}
            content={page.content}
            attachments={page.attachments}
          />
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this page and all of its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PageView;
