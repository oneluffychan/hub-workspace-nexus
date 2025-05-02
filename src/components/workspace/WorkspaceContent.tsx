
import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Search, Plus, File } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageEditor from '@/components/page/PageEditor';

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
    <div className="flex h-full">
      {/* Sidebar with pages */}
      <div className="w-64 border-r bg-white p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Pages</h3>
          <Button variant="ghost" size="sm" onClick={handleCreatePage}>
            <Plus size={16} />
          </Button>
        </div>
        
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        
        <div className="flex-1 overflow-y-auto">
          {filteredPages.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No pages found
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredPages.map(page => (
                <li key={page.id}>
                  <div 
                    className={`flex items-center justify-between px-2 py-2 rounded-md ${
                      currentWorkspace.currentPageId === page.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                    } cursor-pointer group`}
                  >
                    <button 
                      className="flex items-center text-left w-full overflow-hidden"
                      onClick={() => handleSelectPage(page.id)}
                    >
                      <File size={16} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(page.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
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
  );
};

export default WorkspaceContent;
