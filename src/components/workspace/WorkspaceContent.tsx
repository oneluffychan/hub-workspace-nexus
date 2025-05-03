
import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Globe, Lock, Share2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import PageEditor from '@/components/page/PageEditor';
import CollapsibleSidebar from './CollapsibleSidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

const WorkspaceContent: React.FC = () => {
  const { 
    currentWorkspace, 
    createPage, 
    deletePage, 
    selectPage, 
    togglePagePublic, 
    toggleWorkspacePublic 
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const navigate = useNavigate();
  
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
    const newPageId = await createPage(currentWorkspace.id, "Untitled Page");
    if (newPageId) {
      navigate(`/workspace/${currentWorkspace.id}/page/${newPageId}`);
    }
  };
  
  const handleSelectPage = (pageId: string) => {
    if (!currentWorkspace) return;
    navigate(`/workspace/${currentWorkspace.id}/page/${pageId}`);
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
  
  const handleTogglePagePublic = () => {
    if (!currentWorkspace || !currentPage) return;
    
    togglePagePublic(currentWorkspace.id, currentPage.id, !currentPage.isPublic);
  };
  
  const handleToggleWorkspacePublic = () => {
    if (!currentWorkspace) return;
    
    toggleWorkspacePublic(currentWorkspace.id, !currentWorkspace.isPublic);
  };
  
  const copyShareLink = (type: 'page' | 'workspace') => {
    if (!currentWorkspace) return;
    
    let shareUrl = '';
    
    if (type === 'page' && currentPage) {
      shareUrl = `${window.location.origin}/share/page/${currentPage.id}`;
      if (!currentPage.isPublic) {
        togglePagePublic(currentWorkspace.id, currentPage.id, true);
      }
    } else if (type === 'workspace') {
      shareUrl = `${window.location.origin}/share/workspace/${currentWorkspace.id}`;
      if (!currentWorkspace.isPublic) {
        toggleWorkspacePublic(currentWorkspace.id, true);
      }
    }
    
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
    setIsShareDialogOpen(false);
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  {currentPage.isPublic ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={handleTogglePagePublic}
                    >
                      <Globe size={16} />
                      <span>Public</span>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={handleTogglePagePublic}
                    >
                      <Lock size={16} />
                      <span>Private</span>
                    </Button>
                  )}
                </div>
                
                <Popover open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="flex items-center space-x-1"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Share options</h4>
                        <p className="text-sm text-muted-foreground">
                          Share this page or the entire workspace with others.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Current page</span>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => copyShareLink('page')}
                          >
                            Copy link
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Entire workspace</span>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => copyShareLink('workspace')}
                          >
                            Copy link
                          </Button>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Workspace visibility</span>
                          <Button
                            size="sm"
                            variant={currentWorkspace.isPublic ? "default" : "outline"}
                            className="h-8"
                            onClick={handleToggleWorkspacePublic}
                          >
                            {currentWorkspace.isPublic ? "Public" : "Private"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <PageEditor
                workspaceId={currentWorkspace.id}
                pageId={currentPage.id}
                title={currentPage.title}
                content={currentPage.content}
                attachments={currentPage.attachments}
              />
            </div>
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
