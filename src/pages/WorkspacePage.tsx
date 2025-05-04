
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceContent from '@/components/workspace/WorkspaceContent';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { selectWorkspace, getWorkspaceById, toggleWorkspacePublic } = useWorkspace();
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const currentWorkspace = workspaceId ? getWorkspaceById(workspaceId) : null;

  const handleShareWorkspace = () => {
    if (!currentWorkspace) return;
    
    const shareUrl = `${window.location.origin}/share/workspace/${currentWorkspace.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Make workspace public if it's not already
    if (!currentWorkspace.isPublic) {
      toggleWorkspacePublic(currentWorkspace.id, true);
      toast.success('Workspace is now public and can be shared');
    } else {
      toast.success('Share link copied to clipboard');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-2 px-4 py-2 border-b">
        <h1 className="text-xl font-semibold">
          {currentWorkspace?.name || 'Workspace'}
        </h1>
        
        {currentWorkspace && (
          <Popover open={isSharePopoverOpen} onOpenChange={setIsSharePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Share2 size={16} className="mr-2" />
                <span>Share Workspace</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Share this workspace</h4>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this workspace and its public pages.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input 
                    value={`${window.location.origin}/share/workspace/${currentWorkspace.id}`} 
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button 
                    size="sm" 
                    variant={copied ? "default" : "secondary"}
                    onClick={handleShareWorkspace}
                    className="shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {currentWorkspace.isPublic 
                      ? 'This workspace is public and can be shared' 
                      : 'This workspace will be made public when you share it'}
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      <WorkspaceContent />
    </AppLayout>
  );
};

export default WorkspacePage;
