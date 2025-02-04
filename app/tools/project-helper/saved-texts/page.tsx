"use client";

import { useState, useEffect } from "react";
import { fetchSavedTexts, deleteText } from "../actions/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import PdfDownloadButton from "../components/PdfDownloadButton";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

type SavedText = {
  id: string;
  content: string;
  created_at: string;
};

export default function SavedTexts() {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedTexts();
  }, []);

  async function loadSavedTexts() {
    try {
      setError(null);
      const texts = await fetchSavedTexts();
      setSavedTexts(texts);
    } catch (error) {
      console.error("Error loading saved texts:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load saved texts. Please try again."
      );
    }
  }

  async function handleDeleteText(id: string) {
    try {
      await deleteText(id);
      await loadSavedTexts();
    } catch (error) {
      console.error("Error deleting text:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete text. Please try again."
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 py-8">
        <Link href="/tools/project-helper">
          <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400 cursor-pointer" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Saved Texts
        </h1>
      </div>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="space-y-4">
        {savedTexts.map((text) => (
          <Card key={text.id}>
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-4" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-6 mb-4" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-6 mb-4" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1" {...props} />
                    ),
                  }}
                >
                  {text.content}
                </ReactMarkdown>
              </div>
              <p className="text-sm text-gray-500">
                Created at: {new Date(text.created_at).toLocaleString()}
              </p>
              <div className="flex justify-between mt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteText(text.id)}
                >
                  Delete
                </Button>
                <PdfDownloadButton
                  projectName={`Saved Text ${text.id}`}
                  content={[{ title: "Saved Text", text: text.content }]}
                  isSavedText={true}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
