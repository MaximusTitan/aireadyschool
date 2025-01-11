"use client";

import { useState, useEffect } from "react";
import PresentationForm from "./components/PresentationForm";
import PresentationPreview from "./components/PresentationPreview";
import { Presentation, Slide } from "./types/presentation";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { useToast } from "@/hooks/use-toast";

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="p-4 bg-red-100 border border-red-400 rounded">
      <p className="font-bold text-red-800">Something went wrong:</p>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <button
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [presentation, setPresentation] = useState<Presentation | undefined>();
  const [imagesLoading, setImagesLoading] = useState(false);

  const handlePresentationGenerated = (newPresentation: Presentation) => {
    console.log("New presentation generated:", newPresentation);
    setPresentation(newPresentation);
  };

  const handleUpdateSlide = (slideId: string, updatedSlide: Slide) => {
    if (!presentation) return;

    console.log("Updating slide:", slideId, updatedSlide);
    setPresentation({
      ...presentation,
      slides: presentation.slides.map((slide) =>
        slide.id === slideId ? updatedSlide : slide
      ),
    });
  };

  const handleError = (error: unknown) => {
    console.error("Error in Home component:", error);
    toast({
      title: "Error",
      description:
        error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive",
    });
  };

  useEffect(() => {
    if (!presentation) return;
    setImagesLoading(true);
    let loadedCount = 0;
    presentation.slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image ?? "";
      img.onload = () => {
        loadedCount++;
        if (loadedCount === presentation.slides.length) {
          setImagesLoading(false);
        }
      };
    });
  }, [presentation]);

  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">
          AI-Powered Presentation Generator
        </h1>
        <PresentationForm onGenerated={handlePresentationGenerated} />
        {presentation && (
          <PresentationPreview
            presentation={presentation}
            onUpdateSlide={handleUpdateSlide}
            imagesLoading={imagesLoading}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}
