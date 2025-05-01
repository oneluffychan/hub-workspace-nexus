
import React from 'react';
import { UserButton } from '@/components/auth/UserButton';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Grid2x2, List, PlusSquare } from 'lucide-react';
import { useState } from 'react';
import WorkspaceDialog from '@/components/workspace/WorkspaceDialog';

interface HeaderProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  const { currentWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  return (
    <header className="border-b bg-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-medium">
          {currentWorkspace ? currentWorkspace.name : 'Select a workspace'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="border rounded-md flex overflow-hidden">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none px-2"
            onClick={() => setViewMode('grid')}
          >
            <Grid2x2 size={18} />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none px-2"
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </Button>
        </div>
        
        <Button 
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="flex items-center"
          disabled={!currentWorkspace}
        >
          <PlusSquare size={16} className="mr-1" />
          Add Item
        </Button>
        
        <UserButton />
      </div>
      
      {isCreateOpen && (
        <WorkspaceDialog 
          mode="add-item"
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
