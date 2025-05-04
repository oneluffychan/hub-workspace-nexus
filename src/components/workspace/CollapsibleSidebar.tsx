
import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Trash2, Search, Plus, File } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar';

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
  const { workspaces, currentWorkspace, selectWorkspace, navigateToWorkspace } = useWorkspace();

  return (
    <Sidebar variant="inset" className="bg-white border-r" defaultCollapsed={false}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <h3 className="font-medium text-sm">Pages</h3>
          <Button variant="ghost" size="sm" onClick={onCreatePage} className="h-7 w-7">
            <Plus size={16} />
          </Button>
        </div>
        
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mx-2 mb-2 h-8"
        />
        
        {/* Workspace quick selector */}
        <div className="px-2 pb-2">
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
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {filteredPages.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No pages found
          </div>
        ) : (
          <SidebarMenu>
            {filteredPages.map(page => (
              <SidebarMenuItem key={page.id}>
                <SidebarMenuButton 
                  isActive={currentPageId === page.id}
                  onClick={() => onSelectPage(page.id)}
                  tooltip={page.title}
                >
                  <File size={16} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{page.title}</span>
                </SidebarMenuButton>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover/menu-item:opacity-100 h-6 w-6 p-0 absolute right-1 top-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(page.id);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <div className="p-2 text-xs text-center text-gray-500">
          <SidebarTrigger className="mb-2 w-full border rounded-md py-1 px-2">
            {({ collapsed }) => (
              <span>{collapsed ? "Expand" : "Collapse"} Sidebar</span>
            )}
          </SidebarTrigger>
          <div className="mt-1">Workspace Hub v1.0</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CollapsibleSidebar;
