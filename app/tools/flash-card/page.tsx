import { FlashcardGenerator } from "./components/flashcard-generator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Flashcard Generator</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <FlashcardGenerator />
      </main>
    </div>
  );
}
