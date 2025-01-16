"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdditionalQuestionsProps {
  onComplete: (data: { duration: string; specificFocus: string }) => void;
}

interface InputItem {
  id: string;
  value: string;
  label: string;
  type: "input" | "textarea";
}

export function AdditionalQuestions({ onComplete }: AdditionalQuestionsProps) {
  const [inputs, setInputs] = useState<InputItem[]>([
    {
      id: "duration",
      value: "",
      label: "Lesson Duration (in minutes)",
      type: "input",
    },
    {
      id: "specificFocus",
      value: "",
      label: "Specific Focus Areas (optional)",
      type: "textarea",
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>(
    []
  );

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
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (index < inputs.length - 1) {
        setCurrentIndex(index + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    const formData = inputs.reduce<{ [key: string]: string }>(
      (acc, input) => ({ ...acc, [input.id]: input.value }),
      {}
    );
    if (formData.duration) {
      onComplete(formData as { duration: string; specificFocus: string });
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">
        Additional Information
      </h2>
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="space-y-4 mt-4">
            {inputs.map((input, index) => (
              <div
                key={input.id}
                className={index > currentIndex ? "hidden" : ""}
              >
                <Label htmlFor={input.id}>{input.label}</Label>
                {input.type === "input" ? (
                  <Input
                    id={input.id}
                    type="number"
                    value={input.value}
                    onChange={(e) =>
                      handleInputChange(input.id, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="mt-1"
                  />
                ) : (
                  <Textarea
                    id={input.id}
                    value={input.value}
                    onChange={(e) =>
                      handleInputChange(input.id, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="mt-1"
                    placeholder="Enter any specific areas you want to focus on in this lesson"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full bg-black hover:bg-neutral-600 text-white"
          >
            Start Planning
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
