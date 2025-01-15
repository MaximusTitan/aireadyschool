import { ModeToggle } from "./components/mode-toggle";
import IEPForm from "./components/iep-form";
import { ThemeProvider } from "next-themes";

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">IEP Generator</h1>
          <ModeToggle />
        </div>
        <IEPForm />
      </main>
    </ThemeProvider>
  );
}
