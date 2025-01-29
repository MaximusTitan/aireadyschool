"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Flashcard } from "../types/flashcard";

interface TextInputProps {
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void;
}

export function TextInput({ onFlashcardsGenerated }: TextInputProps) {
  const [text, setText] = useState("");
  const [cardCount, setCardCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFlashcards = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, cardCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      if (!Array.isArray(data)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }

      onFlashcardsGenerated(data);
      setText("");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4 space-y-4 bg-gray-50">
        <Textarea
          placeholder="Paste your text here to generate flashcards..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] bg-white border-gray-300 focus:border-black focus:ring-black text-gray-900"
          disabled={isGenerating}
        />
        <div className="flex items-center space-x-2">
          <Label htmlFor="card-count" className="text-gray-700">
            Number of cards:
          </Label>
          <Input
            id="card-count"
            type="number"
            min={1}
            max={10}
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            className="w-20 bg-white border-gray-300 focus:border-black focus:ring-black text-gray-900"
          />
        </div>
        <Button
          onClick={generateFlashcards}
          disabled={isGenerating || !text.trim()}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Flashcards"
          )}
        </Button>
      </Card>
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
