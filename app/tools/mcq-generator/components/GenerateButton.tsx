import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  isLoading: boolean;

  className?: string;
}

export default function GenerateButton({ isLoading }: GenerateButtonProps) {
  return (
    <Button type="submit" className="w-full bg-rose-500" disabled={isLoading}>
      {isLoading ? "Generating..." : "Generate Assessment"}
    </Button>
  );
}
