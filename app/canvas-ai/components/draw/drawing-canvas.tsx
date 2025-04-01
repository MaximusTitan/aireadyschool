"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createShapeId,
  Editor,
  Tldraw,
  TLUiEventContextType,
  useUiEvents,
} from "tldraw";
import { ErrorBoundary } from "./error-boundary";
import { TailwindShapeUtil } from "../../tldraw/tailwindShape";
import { TextInputShapeUtil } from "../../tldraw/textInputShape";
import { TextOutputShapeUtil } from "../../tldraw/textOutputShape";
import { ImageOutputShapeUtil } from "../../tldraw/imageOutputShape";
import { Type, Waves, MessageCircle, Image } from "lucide-react";

export function DrawingCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const event: TLUiEventContextType = useUiEvents();

  useEffect(() => {}, [event]);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleCreateTextNode = () => {
    if (!editor) return;

    const viewportBounds = editor.getViewportPageBounds();
    const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2;
    const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2;

    editor.createShape({
      type: "textInput",
      id: createShapeId(),
      x: centerX - 200,
      y: centerY - 100,
      props: {
        color: "white",
        w: 400,
        h: 200,
        text: "Hello, world!",
        fill: "solid",
      },
    });
  };

  const handleCreateGenerateBox = () => {
    if (!editor) return;

    const viewportBounds = editor.getViewportPageBounds();
    const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2;
    const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2;

    editor.createShape({
      type: "generate",
      id: createShapeId(),
      x: centerX - 200,
      y: centerY - 100,
      props: {
        w: 400,
        h: 200,
        color: "white",
        fill: "solid",
        isCodeView: false,
        size: "m",
      },
    });
  };

  const handleCreateTextOutputNode = () => {
    if (!editor) return;

    const viewportBounds = editor.getViewportPageBounds();
    const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2;
    const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2;

    editor.createShape({
      type: "textOutput",
      id: createShapeId(),
      x: centerX - 200,
      y: centerY - 100,
      props: {
        color: "violet",
        w: 400,
        h: 200,
        content: "",
        fill: "solid",
        isLoading: false,
        size: "m",
      },
    });
  };

  const handleCreateImageOutputNode = () => {
    if (!editor) return;

    const viewportBounds = editor.getViewportPageBounds();
    const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2;
    const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2;

    editor.createShape({
      type: "imageOutput",
      id: createShapeId(),
      x: centerX - 150,
      y: centerY - 150,
      props: {
        imageUrl: "",
        isLoading: false,
        aspectRatio: "square_hd",
        numImages: 1,
        numInferenceSteps: 5,
      },
    });
  };

  return (
    <ErrorBoundary>
      <div className="flex-1 relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-50 flex flex-col gap-2 bg-white/80 rounded-lg p-2 shadow-sm">
          <button
            onClick={handleCreateTextNode}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Type />
            <span>Text</span>
          </button>
          <button
            onClick={handleCreateTextOutputNode}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MessageCircle />
            <span>AI Response</span>
          </button>
          <button
            onClick={handleCreateImageOutputNode}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Image />
            <span>AI Image</span>
          </button>
          <button
            onClick={handleCreateGenerateBox}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Waves />
            <span>Tailwind</span>
          </button>
        </div>

        <Tldraw
          persistenceKey="chainwindcss-canvas"
          shapeUtils={[
            TextInputShapeUtil,
            TailwindShapeUtil,
            TextOutputShapeUtil,
            ImageOutputShapeUtil,
          ]}
          onMount={handleMount}
          options={{
            createTextOnCanvasDoubleClick: false,
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
