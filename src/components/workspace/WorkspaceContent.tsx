
import React, { useState, useRef } from 'react';
import { useWorkspace, ContentItem } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const WorkspaceContent: React.FC = () => {
  const { currentWorkspace, deleteContentItem, updateContentItem } = useWorkspace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editContent, setEditContent] = useState('');
  
  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center flex-col space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">No workspace selected</h2>
          <p className="text-gray-500 mt-2">Select or create a workspace to get started</p>
        </div>
      </div>
    );
  }
  
  if (currentWorkspace.items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">This workspace is empty</h2>
          <p className="text-gray-500 mt-2">Add content to get started</p>
        </div>
      </div>
    );
  }
  
  // Filter items based on search query
  const filteredItems = searchQuery
    ? currentWorkspace.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type === 'note' && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : currentWorkspace.items;
  
  const handleDelete = async () => {
    if (!itemToDelete || !currentWorkspace) return;
    
    try {
      await deleteContentItem(currentWorkspace.id, itemToDelete.id);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };
  
  const confirmDelete = (item: ContentItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const openPreview = (item: ContentItem) => {
    setPreviewItem(item);
  };
  
  const closePreview = () => {
    setPreviewItem(null);
  };

  const openEditor = (item: ContentItem) => {
    setEditingItem(item);
    setEditContent(item.content);
  };

  const closeEditor = () => {
    setEditingItem(null);
    setEditContent('');
  };

  const saveEditedContent = async () => {
    if (!editingItem || !currentWorkspace) return;

    try {
      await updateContentItem(currentWorkspace.id, editingItem.id, {
        ...editingItem,
        content: editContent,
        updatedAt: new Date().toISOString()
      });
      closeEditor();
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Quill editor modules and formats
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'code-block'],
      [{ 'header': [1, 2, 3, false] }],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image', 'code-block'
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No items match your search</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden h-[280px] flex flex-col">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-500 hover:text-destructive"
                    onClick={() => confirmDelete(item)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent 
                className="p-4 pt-2 flex-1 overflow-hidden cursor-pointer" 
                onClick={() => item.type === 'note' ? openEditor(item) : openPreview(item)}
              >
                {item.type === 'image' ? (
                  <div className="h-full flex items-center justify-center bg-gray-100 rounded">
                    <img
                      src={item.content}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-full overflow-hidden text-gray-600">
                    <div className="line-clamp-5" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-2 border-t text-xs text-gray-500">
                Updated {formatDate(item.updatedAt)}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card key={item.id} onClick={() => item.type === 'note' ? openEditor(item) : openPreview(item)}>
              <div className="p-3 flex items-center justify-between cursor-pointer">
                <div className="overflow-hidden">
                  <h3 className="text-base font-medium">{item.title}</h3>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="capitalize">{item.type}</span>
                    <span className="mx-1">•</span>
                    <span>Updated {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Item preview dialog */}
      {previewItem && (
        <Dialog open={!!previewItem} onOpenChange={() => closePreview()}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewItem.title}</DialogTitle>
            </DialogHeader>
            
            {previewItem.type === 'image' ? (
              <div className="flex justify-center my-4 bg-gray-50 rounded">
                <img
                  src={previewItem.content}
                  alt={previewItem.title}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="my-4 whitespace-pre-wrap text-gray-700" dangerouslySetInnerHTML={{ __html: previewItem.content }} />
            )}
            
            <DialogFooter>
              <p className="text-xs text-gray-500">
                Created: {formatDate(previewItem.createdAt)}
                {previewItem.createdAt !== previewItem.updatedAt && 
                  ` • Updated: ${formatDate(previewItem.updatedAt)}`}
              </p>
              <Button onClick={closePreview}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rich text editor dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && closeEditor()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit: {editingItem.title}</DialogTitle>
            </DialogHeader>
            
            <div className="my-4">
              <ReactQuill
                theme="snow"
                value={editContent}
                onChange={setEditContent}
                modules={modules}
                formats={formats}
                className="h-[50vh] mb-12"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeEditor}>Cancel</Button>
              <Button onClick={saveEditedContent}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkspaceContent;
