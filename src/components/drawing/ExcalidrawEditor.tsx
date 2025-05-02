
import React, { useEffect, useState, useCallback } from 'react';
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
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
  const [hasChanges, setHasChanges] = useState(false);

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

  const saveDrawing = useCallback(() => {
    if (!excalidrawAPI || !onSave) return;
    
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    
    const drawingData = {
      elements,
      appState,
      files
    };
    
    // Call onSave with valid JSON data
    onSave(JSON.stringify(drawingData));
    setHasChanges(false);
  }, [excalidrawAPI, onSave]);

  // Save drawing initially when the excalidrawAPI is set
  useEffect(() => {
    if (excalidrawAPI && onSave && !readOnly) {
      // Wait for the API to be fully initialized
      setTimeout(() => saveDrawing(), 500);
    }
  }, [excalidrawAPI, onSave, readOnly, saveDrawing]);

  // Handle onChange event from Excalidraw with the correct parameter types
  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    if (onSave && !readOnly) {
      setHasChanges(true);
    }
  }, [onSave, readOnly]);

  // Create a wrapper with proper styling and positioning
  return (
    <div className="excalidraw-wrapper relative border rounded-md" style={{ 
      height: readOnly ? '500px' : '70vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialContent || undefined}
          viewModeEnabled={readOnly}
          onChange={handleChange}
        />
      </div>
      
      {!readOnly && onSave && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button 
            onClick={saveDrawing}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center"
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExcalidrawEditor;
