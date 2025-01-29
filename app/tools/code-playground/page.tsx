import Link from "next/link";
import LearnToCode from "./components/LearnToCode";
import { ChevronLeft } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 py-8">
          <Link href="/tools">
            <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400 cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Learn to Code
          </h1>
        </div>
        <LearnToCode />
      </div>
    </main>
  );
}
