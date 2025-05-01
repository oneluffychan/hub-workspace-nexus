
import React, { useEffect, useState, useRef } from 'react';
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";

interface ExcalidrawEditorProps {
  initialData?: string;
  onSave?: (data: string) => void;
  readOnly?: boolean;
}

const ExcalidrawEditor: React.FC<ExcalidrawEditorProps> = ({ initialData, onSave, readOnly = false }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialContent, setInitialContent] = useState<{ elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles } | null>(null);
  
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
    
    const drawingData = { elements, appState, files };
    onSave(JSON.stringify(drawingData));
  };

  return (
    <div className="excalidraw-wrapper" style={{ height: readOnly ? '500px' : '70vh' }}>
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        initialData={initialContent || undefined}
        viewModeEnabled={readOnly}
      />
      {!readOnly && onSave && (
        <div className="absolute bottom-4 right-4">
          <button 
            onClick={saveDrawing}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center"
          >
            Save Drawing
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcalidrawEditor;
