
import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Trash2, Search, Plus, File, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollapsibleSidebarProps {
  onCreatePage: () => void;
  onSelectPage: (pageId: string) => void;
  onDeleteClick: (pageId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredPages: Array<{
    id: string;
    title: string;
  }>;
  currentPageId: string | undefined;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  onCreatePage,
  onSelectPage,
  onDeleteClick,
  searchQuery,
  setSearchQuery,
  filteredPages,
  currentPageId
}) => {
  const { workspaces, currentWorkspace, navigateToWorkspace } = useWorkspace();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={`bg-white border-r transition-all h-full ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-2 border-b">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Pages</h3>
              <Button variant="ghost" size="sm" onClick={onCreatePage} className="h-7 w-7">
                <Plus size={16} />
              </Button>
            </div>
          )}
          
          {collapsed ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreatePage} 
              className="h-7 w-full flex justify-center mb-2"
            >
              <Plus size={16} />
            </Button>
          ) : (
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2 h-8"
            />
          )}
          
          {/* Workspace quick selector - show only if not collapsed */}
          {!collapsed && (
            <select 
              className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentWorkspace?.id || ""}
              onChange={(e) => {
                if (e.target.value) {
                  navigateToWorkspace(e.target.value);
                }
              }}
            >
              <option value="" disabled>Select workspace</option>
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {filteredPages.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              {!collapsed && "No pages found"}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredPages.map(page => (
                <div 
                  key={page.id} 
                  className={`relative group flex items-center rounded-md ${
                    currentPageId === page.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => onSelectPage(page.id)}
                    className={`flex items-center py-1 px-2 w-full text-left ${collapsed ? 'justify-center' : ''}`}
                  >
                    <File size={16} className={collapsed ? '' : 'mr-2'} />
                    {!collapsed && (
                      <span className="truncate">{page.title}</span>
                    )}
                  </button>
                  
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 absolute right-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(page.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer with collapse toggle */}
        <div className="border-t p-2">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex justify-center items-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} className="mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
          
          {!collapsed && (
            <div className="mt-1 text-xs text-center text-gray-500">
              Workspace Hub v1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
