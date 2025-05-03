
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Attachment } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

type SharedPage = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  workspace_id: string;
  is_public: boolean;
  attachments: Attachment[];
};

const SharedPage: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const [page, setPage] = useState<SharedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) return;
      
      try {
        // Fetch the page
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('id', pageId)
          .eq('is_public', true)
          .single();
        
        if (pageError) {
          throw pageError;
        }
        
        if (!pageData) {
          setError('Page not found or not accessible');
          setLoading(false);
          return;
        }
        
        // Fetch attachments
        const { data: attachmentsData } = await supabase
          .from('attachments')
          .select('*')
          .eq('page_id', pageId);
        
        const attachments: Attachment[] = attachmentsData ? attachmentsData.map(att => ({
          id: att.id,
          type: att.type as "image",
          url: att.url,
          name: att.name || "",
          createdAt: att.created_at,
        })) : [];
        
        setPage({
          ...pageData,
          attachments
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching page:', err);
        setError(err.message || 'Failed to load page');
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [pageId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error || 'Page not found or not accessible'}</p>
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
          <h1 className="text-2xl font-bold">{page.title}</h1>
          <p className="text-sm text-gray-500">
            Shared page • {new Date(page.created_at).toLocaleDateString()}
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
        {/* Page content */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
        
        {/* Attachments */}
        {page.attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.attachments.map(attachment => (
                <div key={attachment.id} className="border rounded-md overflow-hidden">
                  <img 
                    src={attachment.url} 
                    alt={attachment.name} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-2 bg-gray-50">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedPage;
