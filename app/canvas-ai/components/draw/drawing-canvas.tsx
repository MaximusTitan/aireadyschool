"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  createShapeId,
  Editor,
  Tldraw,
  TLUiEventContextType,
  useUiEvents,
  TLStoreWithStatus,
  createTLStore,
  loadSnapshot,
} from "tldraw";
import { ErrorBoundary } from "./error-boundary";
import { TailwindShapeUtil } from "../../tldraw/tailwindShape";
import { TextInputShapeUtil } from "../../tldraw/textInputShape";
import { TextOutputShapeUtil } from "../../tldraw/textOutputShape";
import { ImageOutputShapeUtil } from "../../tldraw/imageOutputShape";
import { Type, Waves, MessageCircle, Image, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  generateDocumentId,
  getUserId,
  saveDocumentState,
  saveSessionState,
  getSnapshot as getSupabaseSnapshot,
} from "../../lib/canvas-persistence";

// This inner component uses useSearchParams and must be used within a Suspense boundary
export function DrawingCanvasInner() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [store, setStore] = useState<TLStoreWithStatus>({ status: "loading" });
  const [documentId, setDocumentId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Add debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const event: TLUiEventContextType = useUiEvents();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const docId = searchParams.get("id") || generateDocumentId();
    const uid = getUserId();

    setDocumentId(docId);
    setUserId(uid);

    if (!searchParams.get("id")) {
      router.replace(`?id=${docId}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!documentId || !userId) return;

    let cancelled = false;

    async function loadDocument() {
      try {
        const snapshot = await getSupabaseSnapshot(documentId, userId);

        if (cancelled) return;

        const newStore = createTLStore();

        // Instead of trying to manipulate the snapshot structure,
        // let's just start with a fresh store if no valid snapshot exists
        if (snapshot && snapshot.document) {
          try {
            // Get the schema from the new store to ensure it has all required properties
            const schema = newStore.schema.serialize();

            // Create a properly formatted snapshot object using the schema from the store
            const properSnapshot = {
              store: snapshot.document,
              schema: schema,
            };

            // Log for debugging
            console.log("Loading snapshot with schema:", schema);

            loadSnapshot(newStore, properSnapshot);
          } catch (err) {
            console.error("Error loading snapshot:", err);
            // Continue with empty store on error
          }
        }

        setStore({
          store: newStore,
          status: "synced-local",
        });
      } catch (err) {
        console.error("Failed to load document:", err);
        // Create an empty store as fallback
        const emptyStore = createTLStore();
        setStore({
          store: emptyStore,
          status: "synced-local",
        });
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId, userId]);

  const handleMount = useCallback(
    (editor: Editor) => {
      setEditor(editor);

      const unlistenChanges = editor.store.listen(
        () => {
          if (documentId && userId && !isSaving) {
            // Clear any existing timer to avoid multiple save requests
            if (saveTimerRef.current) {
              clearTimeout(saveTimerRef.current);
            }

            // Set a new timer for saving after 5 seconds of inactivity
            saveTimerRef.current = setTimeout(async () => {
              setIsSaving(true);
              try {
                const snapshot = editor.store.getSnapshot();
                // Save the store data and schema version
                await saveDocumentState(documentId, snapshot.store);
                await saveSessionState(documentId, userId, snapshot.store);
              } catch (err) {
                console.error("Auto-save failed:", err);
              } finally {
                setIsSaving(false);
                saveTimerRef.current = null;
              }
            }, 5000);
          }
        },
        { scope: "document", source: "user" }
      );

      return () => {
        // Clean up the timer when unmounting
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        unlistenChanges();
      };
    },
    [documentId, userId, isSaving]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!editor || !documentId || !userId) return;

    setIsSaving(true);
    try {
      const snapshot = editor.store.getSnapshot();
      await saveDocumentState(documentId, snapshot.store);
      await saveSessionState(documentId, userId, snapshot.store);
      alert("Canvas saved successfully!");
    } catch (err) {
      console.error("Failed to save canvas:", err);
      alert("Failed to save canvas");
    } finally {
      setIsSaving(false);
    }
  };

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
    <>
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
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={isSaving}
        >
          <Save />
          <span>{isSaving ? "Saving..." : "Save"}</span>
        </button>
      </div>

      <Tldraw
        store={store}
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
    </>
  );
}

// The main wrapper component that doesn't use useSearchParams directly
export function DrawingCanvas() {
  return (
    <ErrorBoundary>
      <div className="flex-1 relative">
        <DrawingCanvasInner />
      </div>
    </ErrorBoundary>
  );
}
