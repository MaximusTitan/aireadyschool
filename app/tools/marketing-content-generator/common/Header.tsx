import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
