"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Flashcard } from "../types/flashcard";

interface FlashcardListProps {
  flashcards: Flashcard[];
  setFlashcards: (flashcards: Flashcard[]) => void;
}

export function FlashcardList({
  flashcards,
  setFlashcards,
}: FlashcardListProps) {
  const handleDelete = (id: string) => {
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Answer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <TableRow key={flashcard.id}>
              <TableCell>{flashcard.question}</TableCell>
              <TableCell>{flashcard.answer}</TableCell>
              <TableCell>{flashcard.type}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(flashcard.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
