import PLPForm from "./components/plp-form";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalized Learning Plan - AI Ready School",
  description:
    "Plan personalized education for students with disabilities using our PLP generator. Create, edit, and download PLPs in minutes.",
};

export default function Home() {
  const isPLPFormLoaded = true; // Add your condition here

  if (!isPLPFormLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="container mx-auto py-8 px-4">
        <div className="flex mb-8 items-center">
          <Link
            href="/tools"
            className="mr-2 text-neutral-500 hover:text-neutral-700 "
          >
            <ChevronLeft />
          </Link>
          <h1 className="text-3xl font-bold">PLP Generator</h1>
        </div>
        <PLPForm />
      </main>
    </ThemeProvider>
  );
}
