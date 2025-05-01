
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { FolderPlus, Folder } from 'lucide-react';
import WorkspaceDialog from '@/components/workspace/WorkspaceDialog';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const handleWorkspaceAction = (id: string, action: 'rename' | 'delete') => {
    setSelectedWorkspaceId(id);
    if (action === 'rename') {
      setIsRenameOpen(true);
    } else if (action === 'delete') {
      setIsDeleteOpen(true);
    }
  };
  
  return (
    <>
      <aside className="w-64 bg-white border-r h-screen flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Workspace Hub</h2>
          <p className="text-sm text-gray-500">Organize your content</p>
        </div>
        
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">WORKSPACES</h3>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsCreateOpen(true)}
          >
            <FolderPlus size={16} />
          </Button>
        </div>
        
        <div className="overflow-auto flex-1">
          {workspaces.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 mb-3">
                No workspaces yet. Create your first one!
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setIsCreateOpen(true)}
              >
                <FolderPlus size={16} className="mr-1" />
                New Workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {workspaces.map((workspace) => (
                <div 
                  key={workspace.id} 
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md group ${
                    currentWorkspace?.id === workspace.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    className="flex items-center flex-grow text-left overflow-hidden"
                    onClick={() => selectWorkspace(workspace.id)}
                  >
                    <Folder size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {workspace.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({workspace.items.length})
                    </span>
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => handleWorkspaceAction(workspace.id, 'rename')}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleWorkspaceAction(workspace.id, 'delete')}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 mt-auto border-t">
          <p className="text-xs text-center text-gray-500">
            v1.0.0 Workspace Hub
          </p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className="w-full bg-white border-b md:hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">Workspace Hub</h2>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsCreateOpen(true)}
          >
            <FolderPlus size={16} />
          </Button>
        </div>
        
        {workspaces.length > 0 && (
          <>
            <Separator />
            <div className="flex overflow-x-auto gap-2 p-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={`flex-shrink-0 px-3 py-1 rounded-full border text-sm ${
                    currentWorkspace?.id === workspace.id 
                      ? 'bg-primary text-white border-primary' 
                      : 'hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => selectWorkspace(workspace.id)}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
      
      {/* Dialogs */}
      <WorkspaceDialog 
        mode="create"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      
      {isRenameOpen && selectedWorkspaceId && (
        <WorkspaceDialog 
          mode="rename"
          workspaceId={selectedWorkspaceId}
          isOpen={isRenameOpen}
          onClose={() => {
            setIsRenameOpen(false);
            setSelectedWorkspaceId(null);
          }}
        />
      )}
      
      {isDeleteOpen && selectedWorkspaceId && (
        <WorkspaceDialog 
          mode="delete"
          workspaceId={selectedWorkspaceId}
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedWorkspaceId(null);
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
