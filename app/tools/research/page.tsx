"use client";
import Link from "next/link";
import { ResearchAssistant } from "./components/research-assistant";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
    <div className={`flex flex-col min-h-screen py-2 ${inter.className}`}>
      <h1 className="text-4xl font-bold mb-8 bg-rose-500 bg-clip-text text-transparent font-sans">
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
      <Link href="/history" className="mt-4">
        <Button variant="outline">View Chat History</Button>
      </Link>
    </div>
  );
}
