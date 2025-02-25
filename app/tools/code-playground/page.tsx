import Link from "next/link";
import LearnToCode from "./components/LearnToCode";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Code Playground</h1>
          <p className="text-muted-foreground text-lg">
            Learn coding concepts with an interactive playground and AI-powered
            guidance for better understanding.
          </p>
        </div>

        <LearnToCode />
      </div>
    </main>
  );
}
