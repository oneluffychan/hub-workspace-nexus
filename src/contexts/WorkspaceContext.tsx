
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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

  // Load workspaces from Supabase when user changes
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch workspaces for the current user
        const { data: workspacesData, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (workspacesError) {
          throw workspacesError;
        }

        // Transform workspace data and fetch content items for each workspace
        const workspacesWithItems = await Promise.all(
          workspacesData.map(async (workspace) => {
            // Fetch content items for this workspace
            const { data: itemsData, error: itemsError } = await supabase
              .from('content_items')
              .select('*')
              .eq('workspace_id', workspace.id)
              .order('created_at', { ascending: true });

            if (itemsError) {
              console.error(`Error fetching items for workspace ${workspace.id}:`, itemsError);
              return {
                id: workspace.id,
                name: workspace.name,
                createdAt: workspace.created_at,
                updatedAt: workspace.updated_at,
                items: []
              };
            }

            // Transform content items
            const items = itemsData.map(item => ({
              id: item.id,
              type: item.type as 'note' | 'image',
              title: item.title,
              content: item.content,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            }));

            // Return workspace with its items
            return {
              id: workspace.id,
              name: workspace.name,
              createdAt: workspace.created_at,
              updatedAt: workspace.updated_at,
              items
            };
          })
        );

        setWorkspaces(workspacesWithItems);
        
        // Set current workspace to the first one if available
        if (workspacesWithItems.length > 0) {
          setCurrentWorkspace(workspacesWithItems[0]);
        } else {
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

  // Create a new workspace
  const createWorkspace = async (name: string) => {
    if (!user) {
      toast.error("Please login to create a workspace");
      return;
    }
    
    setIsLoading(true);
    try {
      // Insert new workspace into Supabase
      const { data: newWorkspace, error } = await supabase
        .from('workspaces')
        .insert({ name, user_id: user.id })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Create new workspace object
      const workspaceWithItems: Workspace = {
        id: newWorkspace.id,
        name: newWorkspace.name,
        createdAt: newWorkspace.created_at,
        updatedAt: newWorkspace.updated_at,
        items: []
      };
      
      const updatedWorkspaces = [...workspaces, workspaceWithItems];
      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspace(workspaceWithItems);
      
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
      // Update workspace in Supabase
      const { error } = await supabase
        .from('workspaces')
        .update({ name: newName })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
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
      // Delete workspace from Supabase (cascade will delete content items)
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
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
      // Insert content item into Supabase
      const { data: newItem, error } = await supabase
        .from('content_items')
        .insert({
          workspace_id: workspaceId,
          type: item.type,
          title: item.title,
          content: item.content
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Create new content item object
      const contentItem: ContentItem = {
        id: newItem.id,
        type: newItem.type as 'note' | 'image',
        title: newItem.title,
        content: newItem.content,
        createdAt: newItem.created_at,
        updatedAt: newItem.updated_at
      };
      
      // Update local state
      const updatedWorkspaces = workspaces.map(workspace => {
        if (workspace.id === workspaceId) {
          return {
            ...workspace,
            items: [...workspace.items, contentItem],
            updatedAt: new Date().toISOString()
          };
        }
        return workspace;
      });
      
      setWorkspaces(updatedWorkspaces);
      
      // Update current workspace if it's the one being modified
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace({
          ...currentWorkspace,
          items: [...currentWorkspace.items, contentItem],
          updatedAt: new Date().toISOString()
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
      // Prepare updates for Supabase (convert camelCase to snake_case)
      const supabaseUpdates: Record<string, any> = {};
      if (updates.title) supabaseUpdates.title = updates.title;
      if (updates.content) supabaseUpdates.content = updates.content;
      if (updates.type) supabaseUpdates.type = updates.type;
      
      // Update content item in Supabase
      const { error } = await supabase
        .from('content_items')
        .update(supabaseUpdates)
        .eq('id', itemId)
        .eq('workspace_id', workspaceId);
        
      if (error) {
        throw error;
      }
      
      const timestamp = new Date().toISOString();
      
      // Update local state
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
      // Delete content item from Supabase
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId)
        .eq('workspace_id', workspaceId);
        
      if (error) {
        throw error;
      }
      
      const timestamp = new Date().toISOString();
      
      // Update local state
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
