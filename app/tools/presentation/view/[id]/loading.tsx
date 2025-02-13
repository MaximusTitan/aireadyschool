import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Spinner className="h-8 w-8" />
      <span className="ml-2">Loading presentation...</span>
    </div>
  );
}
