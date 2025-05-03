
import React, { useState, useCallback, useRef } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Image, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

interface PageEditorProps {
  workspaceId: string;
  pageId: string;
  title: string;
  content: string;
  attachments: Array<{
    id: string;
    type: 'image';
    url: string;
    name: string;
    createdAt: string;
  }>;
  readOnly?: boolean;
}

const PageEditor: React.FC<PageEditorProps> = ({
  workspaceId,
  pageId,
  title: initialTitle,
  content: initialContent,
  attachments: initialAttachments,
  readOnly = false
}) => {
  const { updatePage, addAttachment, removeAttachment } = useWorkspace();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Quill editor modules and formats
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'code-block'],
      [{ 'header': [1, 2, 3, false] }],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'code-block'
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    
    try {
      await updatePage(workspaceId, pageId, {
        title,
        content
      });
      setHasChanges(false);
      toast.success("Page saved successfully");
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Failed to save page");
    }
  }, [workspaceId, pageId, title, content, updatePage, hasChanges]);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (result) {
          const imageData = result as string;
          await addAttachment(workspaceId, pageId, imageData, file.name);
          setHasChanges(true);
          toast.success("Image uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await removeAttachment(workspaceId, pageId, attachmentId);
      toast.success("Attachment removed");
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Failed to remove attachment");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.add('bg-gray-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('bg-gray-50');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('bg-gray-50');
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length) {
        await Promise.all(imageFiles.map(file => processFile(file)));
      }
    }
  };

  // Handle paste images
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            await processFile(blob);
          }
        }
      }
    }
  };

  return (
    <div 
      className="space-y-4"
      ref={dropzoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="text-xl font-semibold focus-visible:ring-1"
          readOnly={readOnly}
        />
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleImageClick}
              >
                <Image size={16} className="mr-2" />
                Add Image
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges}
                size="sm"
              >
                <Save size={16} className="mr-2" />
                {hasChanges ? 'Save' : 'Saved'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Attachments Section - Compact Gallery */}
      {initialAttachments.length > 0 && (
        <div className="border rounded-md p-3 bg-gray-50">
          <Label className="mb-2 block">Attachments</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {initialAttachments.map(attachment => (
              <Card key={attachment.id} className="overflow-hidden border shadow-sm">
                <CardContent className="p-1">
                  <div className="relative">
                    <Dialog>
                      <DialogTrigger asChild>
                        <img 
                          src={attachment.url} 
                          alt={attachment.name} 
                          className="w-full h-16 object-cover cursor-pointer"
                        />
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="text-sm">{attachment.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center items-center">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="max-w-full max-h-[60vh] object-contain"
                          />
                        </div>
                        {!readOnly && (
                          <div className="flex justify-end">
                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                              >
                                Delete
                              </Button>
                            </DialogClose>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {!readOnly && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Editor Section with dropzone support */}
      <div className={`border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          className={`h-[60vh] ${readOnly ? 'ql-disabled' : ''}`}
          readOnly={readOnly}
        />
      </div>
      
      {/* Dropzone indicator */}
      {!readOnly && (
        <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500">
          <Paperclip className="mx-auto h-6 w-6 mb-2" />
          <p>Drag and drop images here or paste from clipboard</p>
        </div>
      )}
    </div>
  );
};

export default PageEditor;
