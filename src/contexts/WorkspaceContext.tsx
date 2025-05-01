
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface ContentItem {
  id: string;
  type: 'note' | 'image';
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: ContentItem[];
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<void>;
  renameWorkspace: (id: string, newName: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (id: string) => void;
  addContentItem: (workspaceId: string, item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContentItem: (workspaceId: string, itemId: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (workspaceId: string, itemId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspaces from localStorage when user changes
  useEffect(() => {
    const loadWorkspaces = () => {
      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setIsLoading(false);
        return;
      }

      try {
        const key = `workspaces-${user.id}`;
        const storedWorkspaces = localStorage.getItem(key);
        
        if (storedWorkspaces) {
          const parsedWorkspaces = JSON.parse(storedWorkspaces);
          setWorkspaces(parsedWorkspaces);
          
          // Set current workspace to the first one if available
          if (parsedWorkspaces.length > 0) {
            setCurrentWorkspace(parsedWorkspaces[0]);
          }
        } else {
          // Initialize with an empty workspaces array
          setWorkspaces([]);
          setCurrentWorkspace(null);
        }
      } catch (error) {
        console.error("Error loading workspaces:", error);
        toast.error("Failed to load workspaces");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkspaces();
  }, [user]);

  // Save workspaces to localStorage whenever they change
  useEffect(() => {
    if (user && workspaces) {
      const key = `workspaces-${user.id}`;
      localStorage.setItem(key, JSON.stringify(workspaces));
    }
  }, [workspaces, user]);

  // Create a new workspace
  const createWorkspace = async (name: string) => {
    if (!user) {
      toast.error("Please login to create a workspace");
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate a new workspace
      const timestamp = new Date().toISOString();
      const newWorkspace: Workspace = {
        id: `ws-${Math.random().toString(36).substring(2, 9)}`,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
        items: []
      };
      
      const updatedWorkspaces = [...workspaces, newWorkspace];
      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspace(newWorkspace);
      
      toast.success(`Workspace "${name}" created`);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  // Rename an existing workspace
  const renameWorkspace = async (id: string, newName: string) => {
    setIsLoading(true);
    try {
      const updatedWorkspaces = workspaces.map(workspace => {
        if (workspace.id === id) {
          return {
            ...workspace,
            name: newName,
            updatedAt: new Date().toISOString()
          };
        }
        return workspace;
      });
      
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being renamed
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace({
          ...currentWorkspace,
          name: newName,
          updatedAt: new Date().toISOString()
        });
      }
      
      toast.success(`Workspace renamed to "${newName}"`);
    } catch (error) {
      console.error("Error renaming workspace:", error);
      toast.error("Failed to rename workspace");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a workspace
  const deleteWorkspace = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedWorkspaces = workspaces.filter(workspace => workspace.id !== id);
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being deleted
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null);
      }
      
      toast.success("Workspace deleted");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
    } finally {
      setIsLoading(false);
    }
  };

  // Select a workspace
  const selectWorkspace = (id: string) => {
    const workspace = workspaces.find(ws => ws.id === id);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  // Add a new content item (note or image) to a workspace
  const addContentItem = async (workspaceId: string, item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const newItem: ContentItem = {
        id: `item-${Math.random().toString(36).substring(2, 9)}`,
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const updatedWorkspaces = workspaces.map(workspace => {
        if (workspace.id === workspaceId) {
          return {
            ...workspace,
            items: [...workspace.items, newItem],
            updatedAt: timestamp
          };
        }
        return workspace;
      });
      
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being modified
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace({
          ...currentWorkspace,
          items: [...currentWorkspace.items, newItem],
          updatedAt: timestamp
        });
      }
      
      toast.success(`${item.type === 'note' ? 'Note' : 'Image'} added to workspace`);
    } catch (error) {
      console.error("Error adding content item:", error);
      toast.error(`Failed to add ${item.type}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a content item in a workspace
  const updateContentItem = async (workspaceId: string, itemId: string, updates: Partial<ContentItem>) => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      const updatedWorkspaces = workspaces.map(workspace => {
        if (workspace.id === workspaceId) {
          return {
            ...workspace,
            items: workspace.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  ...updates,
                  updatedAt: timestamp
                };
              }
              return item;
            }),
            updatedAt: timestamp
          };
        }
        return workspace;
      });
      
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being modified
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace({
          ...currentWorkspace,
          items: currentWorkspace.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                ...updates,
                updatedAt: timestamp
              };
            }
            return item;
          }),
          updatedAt: timestamp
        });
      }
      
      toast.success("Item updated");
    } catch (error) {
      console.error("Error updating content item:", error);
      toast.error("Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a content item from a workspace
  const deleteContentItem = async (workspaceId: string, itemId: string) => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      const updatedWorkspaces = workspaces.map(workspace => {
        if (workspace.id === workspaceId) {
          return {
            ...workspace,
            items: workspace.items.filter(item => item.id !== itemId),
            updatedAt: timestamp
          };
        }
        return workspace;
      });
      
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being modified
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace({
          ...currentWorkspace,
          items: currentWorkspace.items.filter(item => item.id !== itemId),
          updatedAt: timestamp
        });
      }
      
      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting content item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      isLoading,
      createWorkspace,
      renameWorkspace,
      deleteWorkspace,
      selectWorkspace,
      addContentItem,
      updateContentItem,
      deleteContentItem
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
