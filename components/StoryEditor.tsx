'use client'

import { useEffect, useRef } from 'react';
import EditorJS, { OutputData, ToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';

interface StoryEditorProps {
  data: string;
  onChange?: (data: OutputData) => void;
  readOnly?: boolean;
}

const StoryEditor = ({ data, onChange, readOnly = false }: StoryEditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initEditor = async () => {
      const EditorJS = (await import('@editorjs/editorjs')).default;
      
      if (!editorRef.current) {
        editorRef.current = new EditorJS({
          holder: 'story-editor',
          data: JSON.parse(data),
          readOnly,
          onChange: async () => {
            if (editorRef.current) {
              const outputData = await editorRef.current.save();
              if (outputData && onChange) {
                onChange(outputData);
              }
            }
          },
          tools: {
            header: {
              class: Header as unknown as ToolConstructable,
              inlineToolbar: true,
              config: {
                placeholder: 'Enter a header',
                levels: [1, 2, 3],
                defaultLevel: 1
              }
            }
          }
        });
      }
    };

    initEditor();

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    if (editorRef.current && data) {
      try {
        editorRef.current.render(JSON.parse(data));
      } catch (err) {
        console.error('Error rendering editor data:', err);
      }
    }
  }, [data]);

  return <div id="story-editor" className="story-editor" />;
};

export default StoryEditor;
