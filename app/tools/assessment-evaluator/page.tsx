"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AssessmentEvaluator } from "./components/evaluator";

export default function Home() {
  return (
    <div className="bg-backgroundApp">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            Assessment Evaluator
          </h1>
          <p className="text-muted-foreground text-lg">
            Evaluate answers quickly and accurately, providing instant feedback
            and grading.
          </p>
        </div>
        <AssessmentEvaluator />
      </div>
    </div>
  );
}
