"use client";

import { useState } from "react";
import PresentationForm from "./components/PresentationForm";
import PresentationPreview from "./components/PresentationPreview";
import { Presentation, Slide } from "./types/presentation";
import { toast } from "@/hooks/use-toast";
import { ErrorBoundary } from "react-error-boundary";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="p-4 bg-red-100 border border-red-400 rounded">
      <p className="font-bold text-red-800">Something went wrong:</p>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <button
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  );
}

export default function Home() {
  const [presentation, setPresentation] = useState<Presentation | undefined>();

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

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <div className="flex h-16 items-center space-x-2 ml-8">
        <Link href="/tools" className="text-neutral-500 hover:text-neutral-700">
          <ChevronLeft className="h-6 w-6 text-neutral-800" />
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800">
          Presentation Generator
        </h1>
      </div>
      <main className="container max-w-6xl mx-auto p-4 border border-neutral-200 rounded-lg mt-8">
        <PresentationForm onGenerated={handlePresentationGenerated} />
        {presentation && (
          <PresentationPreview
            presentation={presentation}
            onUpdateSlide={handleUpdateSlide}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}
