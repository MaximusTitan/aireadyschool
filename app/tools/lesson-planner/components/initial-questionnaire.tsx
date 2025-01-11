"use client";

import React, { useState, useRef, useEffect } from "react";
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-rose-500">
          Lesson Planner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inputs.map((input, index) => (
            <div
              key={input.id}
              className={index > currentIndex ? "hidden" : ""}
            >
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
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        >
          Submit and Proceed
        </Button>
      </CardFooter>
    </Card>
  );
}
