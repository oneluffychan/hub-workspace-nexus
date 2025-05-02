
import React, { useState, useCallback, useRef } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Image, Copy, Paste, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const imageData = e.target.result as string;
          const attachment = await addAttachment(workspaceId, pageId, imageData, file.name);
          if (attachment) {
            setHasChanges(true);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await removeAttachment(workspaceId, pageId, attachmentId);
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Failed to remove attachment");
    }
  };

  const handleCopyToClipboard = () => {
    try {
      navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''));
      toast.success("Content copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      setHasChanges(true);
      toast.success("Content pasted from clipboard");
    } catch (error) {
      console.error("Error pasting from clipboard:", error);
      toast.error("Failed to paste from clipboard");
    }
  };

  return (
    <div className="space-y-4">
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
                onClick={handleCopyToClipboard}
              >
                <Copy size={16} className="mr-2" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePasteFromClipboard}
              >
                <Paste size={16} className="mr-2" />
                Paste
              </Button>
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

      {/* Attachments Section */}
      {initialAttachments.length > 0 && (
        <div className="border rounded-md p-4 bg-gray-50">
          <Label className="mb-2 block">Attachments</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialAttachments.map(attachment => (
              <Card key={attachment.id} className="overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative">
                    <img 
                      src={attachment.url} 
                      alt={attachment.name} 
                      className="w-full h-32 object-cover"
                    />
                    {!readOnly && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs truncate">{attachment.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Editor Section */}
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
    </div>
  );
};

export default PageEditor;
