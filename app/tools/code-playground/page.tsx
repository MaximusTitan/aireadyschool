import LearnToCode from "./components/LearnToCode";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-6 text-center py-8 text-gray-800 dark:text-gray-100">
          Learn to Code
        </h1>
        <LearnToCode />
      </div>
    </main>
  );
}
