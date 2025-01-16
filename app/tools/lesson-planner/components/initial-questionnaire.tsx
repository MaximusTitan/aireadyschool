"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuestionnaireProps {
  onComplete: (data: { subject: string; grade: string; topic: string }) => void;
}

interface InputItem {
  id: string;
  value: string;
  label: string;
}

export function InitialQuestionnaire({ onComplete }: QuestionnaireProps) {
  const [inputs, setInputs] = useState<InputItem[]>([
    { id: "subject", value: "", label: "Subject" },
    { id: "grade", value: "", label: "Grade" },
    { id: "topic", value: "", label: "Topic" },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[currentIndex]) {
      inputRefs.current[currentIndex]?.focus();
    }
  }, [currentIndex]);

  const handleInputChange = (id: string, value: string) => {
    setInputs((prevInputs) =>
      prevInputs.map((input) => (input.id === id ? { ...input, value } : input))
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index < inputs.length - 1) {
        setCurrentIndex(index + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    const formData = inputs.reduce(
      (acc, input) => ({ ...acc, [input.id]: input.value }),
      {}
    );
    if (Object.values(formData).every((value) => value !== "")) {
      onComplete(formData as { subject: string; grade: string; topic: string });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/tools">
          <ChevronLeft className="h-6 w-6 text-neutral-800 hover:text-neutral-600" />
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800">Lesson Planner</h1>
      </div>
      <Card className="ml-8 mt-10 max-w-6xl">
        <CardContent>
          <div className="space-y-4 mt-4">
            {inputs.map((input, index) => (
              <div key={input.id}>
                <Label htmlFor={input.id}>{input.label}</Label>
                <Input
                  id={input.id}
                  value={input.value}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full bg-black hover:bg-neutral-600 text-white"
          >
            Submit and Proceed
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
