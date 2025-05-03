
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, FileText } from 'lucide-react';
import { Page } from '@/contexts/WorkspaceContext';

type SharedWorkspace = {
  id: string;
  name: string;
  created_at: string;
  is_public: boolean;
  pages: Page[];
};

const SharedWorkspace: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;
      
      try {
        // Fetch the workspace
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .eq('is_public', true)
          .single();
        
        if (workspaceError) {
          throw workspaceError;
        }
        
        if (!workspaceData) {
          setError('Workspace not found or not accessible');
          setLoading(false);
          return;
        }
        
        // Fetch public pages
        const { data: pagesData, error: pagesError } = await supabase
          .from('pages')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        
        if (pagesError) {
          throw pagesError;
        }
        
        const pages: Page[] = pagesData ? pagesData.map(page => ({
          id: page.id,
          title: page.title,
          content: page.content || "",
          createdAt: page.created_at,
          attachments: [],
          isPublic: true
        })) : [];
        
        setWorkspace({
          ...workspaceData,
          pages
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching workspace:', err);
        setError(err.message || 'Failed to load workspace');
        setLoading(false);
      }
    };
    
    fetchWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error || 'Workspace not found or not accessible'}</p>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2" size={16} />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-sm text-gray-500">
            Shared workspace • {new Date(workspace.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2" size={16} />
            Go Home
          </Link>
        </Button>
      </header>
      
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Public Pages</h2>
        
        {workspace.pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No public pages available</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspace.pages.map(page => (
              <Link 
                key={page.id} 
                to={`/share/page/${page.id}`}
                className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition-colors flex items-center"
              >
                <FileText className="text-gray-500 mr-3" />
                <div>
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(page.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedWorkspace;
