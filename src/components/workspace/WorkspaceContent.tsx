
import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import PageEditor from '@/components/page/PageEditor';
import CollapsibleSidebar from './CollapsibleSidebar';

const WorkspaceContent: React.FC = () => {
  const { currentWorkspace, createPage, deletePage, selectPage } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center flex-col space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">No workspace selected</h2>
          <p className="text-gray-500 mt-2">Select or create a workspace to get started</p>
        </div>
      </div>
    );
  }
  
  const currentPage = currentWorkspace.pages.find(page => page.id === currentWorkspace.currentPageId);
  
  // Filter pages based on search query
  const filteredPages = searchQuery
    ? currentWorkspace.pages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentWorkspace.pages;
  
  const handleCreatePage = async () => {
    if (!currentWorkspace) return;
    await createPage(currentWorkspace.id, "Untitled Page");
  };
  
  const handleSelectPage = (pageId: string) => {
    if (!currentWorkspace) return;
    selectPage(currentWorkspace.id, pageId);
  };

  const handleDeleteClick = (pageId: string) => {
    setPageToDelete(pageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete || !currentWorkspace) return;
    
    await deletePage(currentWorkspace.id, pageToDelete);
    setIsDeleteDialogOpen(false);
    setPageToDelete(null);
  };
  
  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <CollapsibleSidebar 
          onCreatePage={handleCreatePage}
          onSelectPage={handleSelectPage}
          onDeleteClick={handleDeleteClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredPages={filteredPages}
          currentPageId={currentWorkspace.currentPageId}
        />
        
        {/* Main content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentPage ? (
            <PageEditor
              workspaceId={currentWorkspace.id}
              pageId={currentPage.id}
              title={currentPage.title}
              content={currentPage.content}
              attachments={currentPage.attachments}
            />
          ) : (
            <div className="h-full flex items-center justify-center flex-col space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800">No page selected</h2>
                <p className="text-gray-500 mt-2">Select or create a page to get started</p>
                <Button onClick={handleCreatePage} className="mt-4">
                  Create a page
                </Button>
              </div>
            </div>
          )}
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
      </div>
    </SidebarProvider>
  );
};

export default WorkspaceContent;
