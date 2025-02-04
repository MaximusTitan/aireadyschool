import { Button } from "@/components/ui/button";

export function ErrorFallback({
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
