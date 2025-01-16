import IEPForm from "./components/iep-form";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function Home() {
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
          <h1 className="text-3xl font-bold">IEP Generator</h1>
        </div>
        <IEPForm />
      </main>
    </ThemeProvider>
  );
}
