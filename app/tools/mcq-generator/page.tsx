"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

const MCQGeneratorPage = () => {
  const [formData, setFormData] = useState({
    grade: "",
    topic: "",
    numberOfQuestions: "",
  });

  interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset states when inputs change
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setError(null);
    setSubmitted(false);
  };

  const validateForm = () => {
    if (!formData.grade.trim()) return "Please enter a grade level";
    if (!formData.topic.trim()) return "Please enter a topic";
    if (!formData.numberOfQuestions.trim())
      return "Please enter number of questions";
    if (
      isNaN(Number(formData.numberOfQuestions)) ||
      Number(formData.numberOfQuestions) < 1
    ) {
      return "Please enter a valid number of questions";
    }
    if (Number(formData.numberOfQuestions) > 10) {
      return "Please enter a maximum of 10 questions";
    }
    return null;
  };

  const generateQuestions = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.questions && !Array.isArray(data.questions)) {
        throw new Error("Invalid response format");
      }

      setQuestions(data.questions);
      setAnswers({});
      setScore(null);
      setSubmitted(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate questions"
      );
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    setScore((correct / questions.length) * 100);
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-rose-500">
            Multiple Choice Question Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="grade">Grade Level</Label>
              <Input
                id="grade"
                name="grade"
                placeholder="Enter grade (e.g., 10)"
                value={formData.grade}
                onChange={handleInputChange}
                className="dark:bg-neutral-800"
              />
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="Enter topic (e.g., World War II)"
                value={formData.topic}
                onChange={handleInputChange}
                className="dark:bg-neutral-800"
              />
            </div>
            <div>
              <Label htmlFor="numberOfQuestions">
                Number of Questions (Max 10)
              </Label>
              <Input
                id="numberOfQuestions"
                name="numberOfQuestions"
                type="number"
                min="1"
                max="10"
                placeholder="Enter number of questions"
                value={formData.numberOfQuestions}
                onChange={handleInputChange}
                className="dark:bg-neutral-800"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={generateQuestions}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions
              </>
            ) : (
              "Generate Questions"
            )}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-rose-500">
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-4">
                <p className="font-medium">
                  {index + 1}. {question.question}
                </p>
                <RadioGroup
                  onValueChange={(value) => handleAnswerSelect(index, value)}
                  value={answers[index]}
                  className="space-y-2"
                >
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`q${index}-opt${optIndex}`}
                        disabled={submitted}
                      />
                      <Label
                        htmlFor={`q${index}-opt${optIndex}`}
                        className={`
                          ${submitted && option === question.correctAnswer ? "text-green-500 font-medium" : ""}
                          ${submitted && answers[index] === option && option !== question.correctAnswer ? "text-red-500 line-through" : ""}
                        `}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {submitted && (
                  <div className="text-sm text-neutral-500">
                    {answers[index] === question.correctAnswer ? (
                      <p className="text-green-500">Correct!</p>
                    ) : (
                      <p className="text-red-500">
                        Incorrect. The correct answer is:{" "}
                        {question.correctAnswer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!submitted && questions.length > 0 && (
              <Button
                onClick={calculateScore}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                disabled={Object.keys(answers).length !== questions.length}
              >
                Submit Answers
              </Button>
            )}
            {score !== null && (
              <div className="text-center mt-4 space-y-4">
                <p className="text-2xl font-bold">
                  Your Score: {score.toFixed(1)}%
                </p>
                <Button
                  onClick={() => {
                    setQuestions([]);
                    setAnswers({});
                    setScore(null);
                    setSubmitted(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try Another Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MCQGeneratorPage;
