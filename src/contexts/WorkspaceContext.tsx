
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Define the types
export type Attachment = {
  id: string;
  type: "image";
  url: string;
  name: string;
  createdAt: string;
};

export type Page = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  attachments: Attachment[];
  isPublic?: boolean;
};

export type ContentItem = {
  type: "note" | "image";
  title: string;
  content: string;
};

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  items: string[];
  pages: Page[];
  currentPageId?: string;
  isPublic?: boolean;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  createWorkspace: (name: string) => Promise<void>;
  renameWorkspace: (id: string, newName: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (id: string) => void;
  createPage: (workspaceId: string, title: string) => Promise<string>;
  updatePage: (
    workspaceId: string,
    pageId: string,
    updates: Partial<Page>
  ) => Promise<void>;
  deletePage: (workspaceId: string, pageId: string) => Promise<void>;
  selectPage: (workspaceId: string, pageId: string) => void;
  addAttachment: (
    workspaceId: string,
    pageId: string,
    imageData: string,
    name: string
  ) => Promise<void>;
  removeAttachment: (
    workspaceId: string,
    pageId: string,
    attachmentId: string
  ) => Promise<void>;
  addContentItem: (
    workspaceId: string, 
    item: ContentItem
  ) => Promise<void>;
  togglePagePublic: (
    workspaceId: string,
    pageId: string, 
    isPublic: boolean
  ) => Promise<void>;
  toggleWorkspacePublic: (
    workspaceId: string, 
    isPublic: boolean
  ) => Promise<void>;
  getPageById: (pageId: string) => Page | null;
  getWorkspaceById: (workspaceId: string) => Workspace | null;
  navigateToWorkspace: (workspaceId: string) => void;
  navigateToPage: (workspaceId: string, pageId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data, error } = await supabase
          .from("workspaces")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching workspaces:", error);
          return;
        }

        if (data) {
          const workspaceData: Workspace[] = await Promise.all(
            data.map(async (workspace) => {
              const { data: pagesData, error: pagesError } = await supabase
                .from("pages")
                .select("*")
                .eq("workspace_id", workspace.id)
                .order("created_at", { ascending: false });

              if (pagesError) {
                console.error("Error fetching pages:", pagesError);
                return {
                  id: workspace.id,
                  name: workspace.name,
                  createdAt: workspace.created_at,
                  items: [], // Items column doesn't exist in the table, use empty array
                  pages: [],
                  currentPageId: undefined,
                  isPublic: workspace.is_public || false,
                };
              }

              const pages: Page[] = pagesData
                ? pagesData.map((page) => ({
                    id: page.id,
                    title: page.title,
                    content: page.content || "",
                    createdAt: page.created_at,
                    attachments: [], // Attachments need to be fetched separately
                    isPublic: page.is_public || false,
                  }))
                : [];

              // Fetch attachments for each page
              for (const page of pages) {
                const { data: attachmentsData } = await supabase
                  .from("attachments")
                  .select("*")
                  .eq("page_id", page.id);
                
                if (attachmentsData) {
                  page.attachments = attachmentsData.map(att => ({
                    id: att.id,
                    type: att.type as "image",
                    url: att.url,
                    name: att.name || "",
                    createdAt: att.created_at,
                  }));
                }
              }

              return {
                id: workspace.id,
                name: workspace.name,
                createdAt: workspace.created_at,
                items: [], // Items column doesn't exist in the table, use empty array
                pages: pages,
                currentPageId: undefined,
                isPublic: workspace.is_public || false,
              };
            })
          );
          setWorkspaces(workspaceData);
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };

    fetchWorkspaces();
  }, []);

  // Function to create a new workspace
  const createWorkspace = async (name: string): Promise<void> => {
    const newId = uuidv4();
    const newWorkspace: Workspace = {
      id: newId,
      name,
      createdAt: new Date().toISOString(),
      items: [],
      pages: [],
    };

    try {
      const { error } = await supabase.from("workspaces").insert([
        {
          id: newWorkspace.id,
          name: newWorkspace.name,
          user_id: "3eb91ee4-dbcc-4691-a83a-3e5c0a364f09", // This should be dynamically set from auth context
          is_public: false,
        },
      ]);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) => [...prevWorkspaces, newWorkspace]);
      toast.success("Workspace created successfully");
      navigateToWorkspace(newId);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
    }
  };

  // Function to rename a workspace
  const renameWorkspace = async (
    id: string,
    newName: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: newName })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((workspace) =>
          workspace.id === id ? { ...workspace, name: newName } : workspace
        )
      );
      
      toast.success("Workspace renamed successfully");
    } catch (error) {
      console.error("Error renaming workspace:", error);
      toast.error("Failed to rename workspace");
    }
  };

  // Function to delete a workspace
  const deleteWorkspace = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("workspaces").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.filter((workspace) => workspace.id !== id)
      );
      
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(null);
        navigate('/');
      }
      
      toast.success("Workspace deleted successfully");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
    }
  };

  // Function to select a workspace
  const selectWorkspace = (id: string) => {
    const selectedWorkspace = workspaces.find((workspace) => workspace.id === id);
    setCurrentWorkspace(selectedWorkspace || null);
  };

  const createPage = async (workspaceId: string, title: string): Promise<string> => {
    const newPageId = uuidv4();
    const newPage: Page = {
      id: newPageId,
      title: title,
      content: "",
      createdAt: new Date().toISOString(),
      attachments: [],
      isPublic: false,
    };

    try {
      const { error } = await supabase.from("pages").insert([
        {
          id: newPage.id,
          workspace_id: workspaceId,
          title: newPage.title,
          content: newPage.content,
          is_public: false,
        },
      ]);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;

          return {
            ...workspace,
            pages: [...workspace.pages, newPage],
            currentPageId: newPageId, // Auto-select the new page
          };
        });
      });
      
      toast.success("Page created successfully");
      return newPageId;
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
      return "";
    }
  };

  const updatePage = async (
    workspaceId: string,
    pageId: string,
    updates: Partial<Page>
  ): Promise<void> => {
    try {
      // Optimistically update the page in the local state
      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;

          return {
            ...workspace,
            pages: workspace.pages.map((page) => {
              if (page.id !== pageId) return page;

              return {
                ...page,
                ...updates,
              };
            }),
          };
        });
      });

      // Construct the update object for Supabase
      const supabaseUpdates: any = {};

      if (updates.title !== undefined) {
        supabaseUpdates.title = updates.title;
      }
      if (updates.content !== undefined) {
        supabaseUpdates.content = updates.content;
      }
      if (updates.isPublic !== undefined) {
        supabaseUpdates.is_public = updates.isPublic;
      }

      // Update the page in Supabase
      const { error } = await supabase
        .from("pages")
        .update(supabaseUpdates)
        .eq("id", pageId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error("Failed to update page");
    }
  };

  const deletePage = async (workspaceId: string, pageId: string) => {
    try {
      const { error } = await supabase.from("pages").delete().eq("id", pageId);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;
          
          const updatedPages = workspace.pages.filter(page => page.id !== pageId);
          const updatedCurrentPageId = workspace.currentPageId === pageId
            ? (updatedPages.length > 0 ? updatedPages[0].id : undefined)
            : workspace.currentPageId;

          return {
            ...workspace,
            pages: updatedPages,
            currentPageId: updatedCurrentPageId,
          };
        });
      });
      
      toast.success("Page deleted successfully");
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Failed to delete page");
    }
  };

  const selectPage = (workspaceId: string, pageId: string) => {
    setWorkspaces((prevWorkspaces) => {
      return prevWorkspaces.map((workspace) => {
        if (workspace.id !== workspaceId) return workspace;

        return {
          ...workspace,
          currentPageId: pageId,
        };
      });
    });
  };

  const addAttachment = async (
    workspaceId: string,
    pageId: string,
    imageData: string,
    name: string
  ): Promise<void> => {
    try {
      const newAttachment: Attachment = {
        id: uuidv4(),
        type: "image",
        url: imageData,
        name: name,
        createdAt: new Date().toISOString(),
      };

      // Insert the attachment directly in the attachments table
      const { error } = await supabase.from("attachments").insert([{
        id: newAttachment.id,
        page_id: pageId,
        url: imageData,
        name: name,
        type: "image"
      }]);
      
      if (error) {
        throw error;
      }

      // Optimistically update the local state
      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;

          return {
            ...workspace,
            pages: workspace.pages.map((page) => {
              if (page.id !== pageId) return page;

              return {
                ...page,
                attachments: [...page.attachments, newAttachment],
              };
            }),
          };
        });
      });
      
      toast.success("Attachment added successfully");
    } catch (error) {
      console.error("Error adding attachment:", error);
      toast.error("Failed to add attachment");
    }
  };

  const removeAttachment = async (
    workspaceId: string,
    pageId: string,
    attachmentId: string
  ): Promise<void> => {
    try {
      // Delete the attachment from the attachments table
      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachmentId);
      
      if (error) {
        throw error;
      }

      // Optimistically update the local state
      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;

          return {
            ...workspace,
            pages: workspace.pages.map((page) => {
              if (page.id !== pageId) return page;

              return {
                ...page,
                attachments: page.attachments.filter(
                  (attachment) => attachment.id !== attachmentId
                ),
              };
            }),
          };
        });
      });
      
      toast.success("Attachment removed successfully");
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Failed to remove attachment");
    }
  };

  // Add content item function
  const addContentItem = async (
    workspaceId: string, 
    item: ContentItem
  ): Promise<void> => {
    try {
      // Implement database logic here if needed
      console.log("Adding content item:", item);
      
      // Optimistic update of the UI
      setWorkspaces((prevWorkspaces) => {
        return prevWorkspaces.map((workspace) => {
          if (workspace.id !== workspaceId) return workspace;
          
          // For note type items, create a new page
          if (item.type === "note") {
            const newPageId = uuidv4();
            const newPage: Page = {
              id: newPageId,
              title: item.title,
              content: item.content,
              createdAt: new Date().toISOString(),
              attachments: [],
              isPublic: false,
            };
            
            // Add to database
            supabase.from("pages").insert([
              {
                id: newPage.id,
                workspace_id: workspaceId,
                title: newPage.title,
                content: newPage.content,
                is_public: false,
              }
            ]).then(({ error }) => {
              if (error) console.error("Error creating page from content item:", error);
            });
            
            return {
              ...workspace,
              pages: [...workspace.pages, newPage],
              currentPageId: newPageId,
            };
          }
          
          // For image type items
          else if (item.type === "image") {
            // Create a new page with image attachment
            const newPageId = uuidv4();
            const newAttachment: Attachment = {
              id: uuidv4(),
              type: "image",
              url: item.content,
              name: item.title,
              createdAt: new Date().toISOString(),
            };
            
            const newPage: Page = {
              id: newPageId,
              title: item.title,
              content: "",
              createdAt: new Date().toISOString(),
              attachments: [newAttachment],
              isPublic: false,
            };
            
            // Add to database
            supabase.from("pages").insert([
              {
                id: newPage.id,
                workspace_id: workspaceId,
                title: newPage.title,
                content: newPage.content,
                is_public: false,
              }
            ]).then(({ pageError }) => {
              if (pageError) {
                console.error("Error creating page with image:", pageError);
                return;
              }
              
              // Insert attachment
              supabase.from("attachments").insert([{
                id: newAttachment.id,
                page_id: newPageId,
                url: newAttachment.url,
                name: newAttachment.name,
                type: "image"
              }]).then(({ attachError }) => {
                if (attachError) console.error("Error creating attachment:", attachError);
              });
            });
            
            return {
              ...workspace,
              pages: [...workspace.pages, newPage],
              currentPageId: newPageId,
            };
          }
          
          return workspace;
        });
      });
      
      toast.success(`${item.type === "note" ? "Note" : "Image"} added successfully`);
    } catch (error) {
      console.error("Error adding content item:", error);
      toast.error(`Failed to add ${item.type}`);
    }
  };
  
  // Toggle page public/private status
  const togglePagePublic = async (
    workspaceId: string,
    pageId: string,
    isPublic: boolean
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("pages")
        .update({ is_public: isPublic })
        .eq("id", pageId);
        
      if (error) throw error;
      
      setWorkspaces(prevWorkspaces => 
        prevWorkspaces.map(workspace => {
          if (workspace.id !== workspaceId) return workspace;
          
          return {
            ...workspace,
            pages: workspace.pages.map(page => {
              if (page.id !== pageId) return page;
              return { ...page, isPublic };
            })
          };
        })
      );
      
      toast.success(`Page is now ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error("Error updating page visibility:", error);
      toast.error("Failed to update page visibility");
    }
  };
  
  // Toggle workspace public/private status
  const toggleWorkspacePublic = async (
    workspaceId: string,
    isPublic: boolean
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ is_public: isPublic })
        .eq("id", workspaceId);
        
      if (error) throw error;
      
      setWorkspaces(prevWorkspaces => 
        prevWorkspaces.map(workspace => {
          if (workspace.id !== workspaceId) return workspace;
          return { ...workspace, isPublic };
        })
      );
      
      toast.success(`Workspace is now ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error("Error updating workspace visibility:", error);
      toast.error("Failed to update workspace visibility");
    }
  };
  
  // Helper methods for routing
  const getPageById = (pageId: string): Page | null => {
    for (const workspace of workspaces) {
      const page = workspace.pages.find(p => p.id === pageId);
      if (page) return page;
    }
    return null;
  };
  
  const getWorkspaceById = (workspaceId: string): Workspace | null => {
    return workspaces.find(w => w.id === workspaceId) || null;
  };
  
  const navigateToWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    navigate(`/workspace/${workspaceId}`);
  };
  
  const navigateToPage = (workspaceId: string, pageId: string) => {
    selectWorkspace(workspaceId);
    selectPage(workspaceId, pageId);
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    selectWorkspace,
    createPage,
    updatePage,
    deletePage,
    selectPage,
    addAttachment,
    removeAttachment,
    addContentItem,
    togglePagePublic,
    toggleWorkspacePublic,
    getPageById,
    getWorkspaceById,
    navigateToWorkspace,
    navigateToPage,
  };

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
};
