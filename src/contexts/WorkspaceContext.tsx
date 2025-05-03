import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

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
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  createWorkspace: (name: string) => Promise<void>;
  renameWorkspace: (id: string, newName: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (id: string) => void;
  createPage: (workspaceId: string, title: string) => Promise<void>;
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

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data, error } = await supabase
          .from("workspaces")
          .select("*")
          .order("createdAt", { ascending: false });

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
                .eq("workspaceId", workspace.id)
                .order("createdAt", { ascending: false });

              if (pagesError) {
                console.error("Error fetching pages:", pagesError);
                return { ...workspace, pages: [] };
              }

              const pages: Page[] = pagesData
                ? pagesData.map((page) => ({
                    id: page.id,
                    title: page.title,
                    content: page.content,
                    createdAt: page.createdAt,
                    attachments: page.attachments
                      ? (JSON.parse(page.attachments) as Attachment[])
                      : [],
                  }))
                : [];

              return {
                id: workspace.id,
                name: workspace.name,
                createdAt: workspace.createdAt,
                items: workspace.items,
                pages: pages,
                currentPageId: workspace.currentPageId,
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
          createdAt: newWorkspace.createdAt,
          items: [],
        },
      ]);

      if (error) {
        throw error;
      }

      setWorkspaces((prevWorkspaces) => [...prevWorkspaces, newWorkspace]);
    } catch (error) {
      console.error("Error creating workspace:", error);
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
    } catch (error) {
      console.error("Error renaming workspace:", error);
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
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  // Function to select a workspace
  const selectWorkspace = (id: string) => {
    const selectedWorkspace = workspaces.find((workspace) => workspace.id === id);
    setCurrentWorkspace(selectedWorkspace || null);
  };

  const createPage = async (workspaceId: string, title: string) => {
    const newPageId = uuidv4();
    const newPage: Page = {
      id: newPageId,
      title: title,
      content: "",
      createdAt: new Date().toISOString(),
      attachments: [],
    };

    try {
      const { error } = await supabase.from("pages").insert([
        {
          id: newPage.id,
          workspaceId: workspaceId,
          title: newPage.title,
          content: newPage.content,
          createdAt: newPage.createdAt,
          attachments: JSON.stringify([]), // Initialize as empty array
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
          };
        });
      });
    } catch (error) {
      console.error("Error creating page:", error);
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
      const supabaseUpdates: Partial<{
        title: string;
        content: string;
        attachments: string; // Store attachments as a JSON string
      }> = {};

      if (updates.title !== undefined) {
        supabaseUpdates.title = updates.title;
      }
      if (updates.content !== undefined) {
        supabaseUpdates.content = updates.content;
      }
      if (updates.attachments !== undefined) {
        supabaseUpdates.attachments = JSON.stringify(updates.attachments); // Serialize attachments to JSON
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

          return {
            ...workspace,
            pages: workspace.pages.filter((page) => page.id !== pageId),
          };
        });
      });
    } catch (error) {
      console.error("Error deleting page:", error);
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

      // Get current attachments for updating in supabase
      const currentWorkspace = workspaces.find(
        (workspace) => workspace.id === workspaceId
      );
      const currentPage = currentWorkspace?.pages.find((page) => page.id === pageId);
      const currentAttachments = currentPage?.attachments || [];

      // Update the attachment in supabase
      await supabase
        .from("pages")
        .update({
          attachments: JSON.stringify([...currentAttachments, newAttachment]),
        })
        .eq("id", pageId);
    } catch (error) {
      console.error("Error adding attachment:", error);
      throw error;
    }
  };

  const removeAttachment = async (
    workspaceId: string,
    pageId: string,
    attachmentId: string
  ): Promise<void> => {
    try {
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

      // Get current attachments for updating in supabase
      const currentWorkspace = workspaces.find(
        (workspace) => workspace.id === workspaceId
      );
      const currentPage = currentWorkspace?.pages.find((page) => page.id === pageId);
      const currentAttachments = currentPage?.attachments || [];

      // Update the attachment in supabase
      await supabase
        .from("pages")
        .update({
          attachments: JSON.stringify(
            currentAttachments.filter((attachment) => attachment.id !== attachmentId)
          ),
        })
        .eq("id", pageId);
    } catch (error) {
      console.error("Error removing attachment:", error);
      throw error;
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
            };
            
            // Add to database
            supabase.from("pages").insert([
              {
                id: newPage.id,
                workspaceId,
                title: newPage.title,
                content: newPage.content,
                createdAt: newPage.createdAt,
                attachments: JSON.stringify([]),
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
            };
            
            // Add to database
            supabase.from("pages").insert([
              {
                id: newPage.id,
                workspaceId,
                title: newPage.title,
                content: newPage.content,
                createdAt: newPage.createdAt,
                attachments: JSON.stringify([newAttachment]),
              }
            ]).then(({ error }) => {
              if (error) console.error("Error creating page with image:", error);
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
    } catch (error) {
      console.error("Error adding content item:", error);
    }
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
  };

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
};
