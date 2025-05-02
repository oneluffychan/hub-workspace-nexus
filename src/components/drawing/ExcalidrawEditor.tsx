
import React, { useEffect, useState } from 'react';
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export type DrawingData = {
  elements: any[];
  appState: any;
  files: any;
};

interface ExcalidrawEditorProps {
  initialData?: string;
  onSave?: (data: string) => void;
  readOnly?: boolean;
}

const ExcalidrawEditor: React.FC<ExcalidrawEditorProps> = ({ 
  initialData, 
  onSave,
  readOnly = false
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [initialContent, setInitialContent] = useState<DrawingData | null>(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      try {
        const parsedData = JSON.parse(initialData);
        setInitialContent(parsedData);
      } catch (error) {
        console.error('Error parsing initial data:', error);
      }
    }
  }, [initialData]);

  const saveDrawing = async () => {
    if (!excalidrawAPI || !onSave) return;
    
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    
    const drawingData = {
      elements,
      appState,
      files
    };
    
    // Call onSave even if the drawing is empty, we just need valid JSON
    onSave(JSON.stringify(drawingData));
  };

  // Save drawing automatically when the excalidrawAPI is set and on every change
  useEffect(() => {
    if (excalidrawAPI && onSave && !readOnly) {
      // Initial save to make sure we have content
      saveDrawing();
    }
  }, [excalidrawAPI, onSave, readOnly]);

  // Handle onChange event from Excalidraw
  const handleChange = () => {
    if (onSave && !readOnly) {
      saveDrawing();
    }
  };

  return (
    <div className="excalidraw-wrapper relative border rounded-md" style={{ height: readOnly ? '500px' : '70vh' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialContent || undefined}
        viewModeEnabled={readOnly}
        onChange={handleChange}
      />
      
      {!readOnly && onSave && (
        <div className="absolute bottom-4 right-4">
          <Button 
            onClick={saveDrawing}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Drawing
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExcalidrawEditor;
