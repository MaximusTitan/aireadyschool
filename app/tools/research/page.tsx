"use client";
import Link from "next/link";
import { ResearchAssistant } from "./components/research-assistant";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { Inter } from "next/font/google";
import { ChevronLeft } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      role="alert"
      className="p-6 bg-gray-100 border border-gray-300 rounded"
    >
      <p className="font-bold text-gray-800">Something went wrong:</p>
      <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
        {error.message}
      </pre>
      {error.stack && (
        <pre className="text-xs text-red-500 mt-2 whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}
      <Button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

export default function Home() {
  return (
    <div className={`flex flex-col min-h-screen py-4 px-6 ${inter.className}`}>
      <h1 className="text-3xl font-bold mb-8 text-neutral-800 font-sans flex items-center">
        <Link href="/tools" className="mr-2">
          <ChevronLeft />
        </Link>
        AI Research Assistant
      </h1>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset the state of your app here
          console.log("Resetting app state");
        }}
        onError={(error, info) => {
          // Log the error to an error reporting service
          console.error("Caught an error:", error, info);
        }}
      >
        <ResearchAssistant />
      </ErrorBoundary>
      <Link href="/tools/research/history">
        <Button variant="outline" className="px-4 py-2 mt-8 ml-16">
          View Chat History
        </Button>
      </Link>
    </div>
  );
}
