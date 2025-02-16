import { AssignmentEvaluator } from "./components/assignment-evaluator";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto mt-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="hover:opacity-75">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl text-neutral-800 font-bold mb-1">
          Assignment Evaluator
        </h1>
      </div>
      <AssignmentEvaluator />
    </main>
  );
}
