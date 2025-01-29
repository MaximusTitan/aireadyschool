"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextInput } from "./text-input";
import { FlashcardList } from "./flashcard-list";
import { StudyMode } from "./study-mode";
import { TestMode } from "./TestMode";
import { Brain } from "lucide-react";
import type { Flashcard } from "../types/flashcard";

export function FlashcardGenerator() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentTab, setCurrentTab] = useState("generate");

  const handleFlashcardsGenerated = (newFlashcards: Flashcard[]) => {
    setFlashcards((prev) => [...prev, ...newFlashcards]);
    setCurrentTab("study");
  };

  return (
    <Card className="p-6 bg-white">
      <div className="flex items-center mb-6">
        <Brain className="w-8 h-8 mr-2 text-black" />
        <h2 className="text-2xl font-bold text-gray-800">
          Flashcard Generator
        </h2>
      </div>
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 rounded-lg">
          <TabsTrigger
            value="generate"
            className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="study"
            className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Study
          </TabsTrigger>
          <TabsTrigger
            value="test"
            className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Test
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            All Flashcards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <TextInput onFlashcardsGenerated={handleFlashcardsGenerated} />
        </TabsContent>

        <TabsContent value="study">
          <StudyMode flashcards={flashcards} />
        </TabsContent>

        <TabsContent value="test">
          <TestMode flashcards={flashcards} />
        </TabsContent>

        <TabsContent value="all">
          <FlashcardList
            flashcards={flashcards}
            setFlashcards={setFlashcards}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
