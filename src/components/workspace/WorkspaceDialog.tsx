import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export type WorkspaceDialogMode = 'create' | 'rename' | 'delete' | 'add-item';

interface WorkspaceDialogProps {
  mode: WorkspaceDialogMode;
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

const WorkspaceDialog: React.FC<WorkspaceDialogProps> = ({ 
  mode, 
  isOpen, 
  onClose, 
  workspaceId 
}) => {
  const { workspaces, createWorkspace, renameWorkspace, deleteWorkspace, currentWorkspace, addContentItem } = useWorkspace();
  
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'note' | 'image'>('note');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  
  useEffect(() => {
    if (mode === 'rename' && workspaceId) {
      const workspace = workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        setName(workspace.name);
      }
    } else {
      setName('');
    }
  }, [mode, workspaceId, workspaces]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        if (!name.trim()) return;
        await createWorkspace(name);
      } else if (mode === 'rename' && workspaceId) {
        if (!name.trim()) return;
        await renameWorkspace(workspaceId, name);
      } else if (mode === 'delete' && workspaceId) {
        await deleteWorkspace(workspaceId);
      } else if (mode === 'add-item' && currentWorkspace) {
        if (itemType === 'note') {
          if (!noteTitle.trim() || !noteContent.trim()) return;
          await addContentItem(currentWorkspace.id, {
            type: 'note',
            title: noteTitle,
            content: noteContent,
          });
        } else if (itemType === 'image' && imagePreview) {
          if (!imageTitle.trim()) return;
          await addContentItem(currentWorkspace.id, {
            type: 'image',
            title: imageTitle,
            content: imagePreview,
          });
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Dialog action error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  if (mode === 'delete') {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workspace and all of its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  if (mode === 'add-item') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Create a new note or upload an image.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="note" className="w-full" onValueChange={(value) => setItemType(value as 'note' | 'image')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="note">Note</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="note" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="noteTitle">Title</Label>
                <Input
                  id="noteTitle"
                  placeholder="Enter note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noteContent">Content</Label>
                <div className="min-h-[300px]">
                  <ReactQuill
                    theme="snow"
                    value={noteContent}
                    onChange={setNoteContent}
                    modules={modules}
                    formats={formats}
                    className="h-[250px] mb-12"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="image" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="imageTitle">Title</Label>
                <Input
                  id="imageTitle"
                  placeholder="Enter image title"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
              </div>
              
              {imagePreview && (
                <div className="mt-4 border rounded overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto max-h-48 object-contain bg-gray-100"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || (
                itemType === 'note' ? (!noteTitle || !noteContent) : 
                (!imageTitle || !imagePreview)
              )}
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' 
              ? 'Create Workspace' 
              : 'Rename Workspace'
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new workspace to organize your content.'
              : 'Enter a new name for your workspace.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Workspace Name
            </Label>
            <Input
              id="name"
              placeholder="Enter workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting 
              ? (mode === 'create' ? 'Creating...' : 'Renaming...') 
              : (mode === 'create' ? 'Create' : 'Rename')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceDialog;
