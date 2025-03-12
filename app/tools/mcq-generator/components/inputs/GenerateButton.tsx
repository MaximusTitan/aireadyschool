import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  isLoading: boolean;
  className?: string;
}

export default function GenerateButton({
  isLoading,
  className,
}: GenerateButtonProps) {
  return (
    <Button
      type="submit"
      className={`w-full ${className}`}
      disabled={isLoading}
    >
      {isLoading ? "Generating..." : "Generate Assessment"}
    </Button>
  );
}
