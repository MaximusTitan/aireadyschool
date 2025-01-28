"use client";

import { useState } from "react";
import type { Lesson as LessonType } from "../types/lessons";
import CodeEditor from "./CodeEditor";
import CodeOutput from "./CodeOutput";
import LearningTips from "./LearningTips";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LessonProps {
  lesson: LessonType;
  onComplete: (lessonId: string) => void;
}

export default function Lesson({ lesson, onComplete }: LessonProps) {
  const [code, setCode] = useState(lesson.initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: lesson.language,
          code: code,
        }),
      });

      const data = await response.json();
      setOutput(data.output);
    } catch (error) {
      console.error("Error running code:", error);
      setOutput("Error running code. Please try again.");
    }
    setIsRunning(false);
  };

  const checkCode = () => {
    if (code.trim() === lesson.answer.trim()) {
      setOutput("Congratulations! Your code is correct.");
      onComplete(lesson.id);
    } else {
      setOutput("Your code is not quite right. Keep trying!");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          <CardDescription>{lesson.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEditor
            code={code}
            setCode={setCode}
            language={lesson.language}
          />
          <div className="mt-4 flex justify-between">
            <div>
              <Button onClick={runCode} disabled={isRunning} className="mr-2">
                {isRunning ? (
                  "Running..."
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Run Code
                  </>
                )}
              </Button>
              <Button onClick={checkCode}>Check Code</Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? (
                <>
                  Hide Answer
                  <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Show Answer
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <CodeOutput output={output} />
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: showAnswer ? 1 : 0,
              height: showAnswer ? "auto" : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {showAnswer && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Answer:</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto">
                  {lesson.answer}
                </pre>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
      <LearningTips tips={lesson.tips} />
    </div>
  );
}
