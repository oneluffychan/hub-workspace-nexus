
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import WorkspaceContent from "@/components/workspace/WorkspaceContent";
import { Button } from "@/components/ui/button";
import { Share2, Globe, Lock, Copy, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const WorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { selectWorkspace, getWorkspaceById, toggleWorkspacePublic, currentWorkspace } = useWorkspace();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
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
        selectWorkspace(workspaceId);
      } else {
        navigate('/');
      }
    }
  }, [workspaceId, selectWorkspace, navigate, getWorkspaceById]);

  const handleToggleWorkspacePublic = () => {
    if (!currentWorkspace) return;
    toggleWorkspacePublic(currentWorkspace.id, !currentWorkspace.isPublic);
  };

  const copyShareLink = () => {
    if (!currentWorkspace) return;
    
    const shareUrl = `${window.location.origin}/share/workspace/${currentWorkspace.id}`;
    
    if (!currentWorkspace.isPublic) {
      toggleWorkspacePublic(currentWorkspace.id, true);
      toast.success('Workspace is now public and can be shared');
    }
    
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast.success('Share link copied to clipboard');
  };

  if (loading || !workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      {currentWorkspace && (
        <div className="p-4 flex justify-end space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center space-x-1"
            onClick={handleToggleWorkspacePublic}
          >
            {currentWorkspace.isPublic ? (
              <>
                <Globe size={16} className="mr-2" />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock size={16} className="mr-2" />
                <span>Private</span>
              </>
            )}
          </Button>
          
          <Popover open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                size="sm" 
                className="flex items-center space-x-1"
              >
                <Share2 size={16} className="mr-2" />
                <span>Share</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Share Workspace</h4>
                  <p className="text-sm text-muted-foreground">
                    Share this workspace with others.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Workspace Link</span>
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
                        onClick={copyShareLink}
                        className="shrink-0"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {currentWorkspace.isPublic ? 'Anyone with the link can view this workspace' : 'Make this workspace public to share it'}
                      </span>
                      <Button
                        size="sm"
                        variant={currentWorkspace.isPublic ? "default" : "outline"}
                        className="h-6"
                        onClick={handleToggleWorkspacePublic}
                      >
                        {currentWorkspace.isPublic ? "Public" : "Private"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <WorkspaceContent />
    </AppLayout>
  );
};

export default WorkspacePage;
