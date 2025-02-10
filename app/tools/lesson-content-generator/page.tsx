"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneratedContent } from "./components/GeneratedContent";

const generateText = async (
  topic: string,
  subject: string,
  grade: string,
  board: string,
  contentType: string,
  retries = 3,
): Promise<{ title: string; result: string }> => {
  try {
    const textResponse = await fetch("/api/generate-lesson-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, subject, grade, board, contentType }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      throw new Error(errorData.message || "Failed to generate text");
    }
    const textData = await textResponse.json();

    if (!textData.title || !textData.result) {
      if (retries > 0) {
        console.log("Invalid response format, retrying...");
        return generateText(
          topic,
          subject,
          grade,
          board,
          contentType,
          retries - 1,
        );
      } else {
        throw new Error("Failed to generate a response in the valid format");
      }
    }
    return textData;
  } catch (error) {
    if (retries > 0) {
      console.log(` ${error} retrying...`);
      return generateText(
        topic,
        subject,
        grade,
        board,
        contentType,
        retries - 1,
      );
    } else {
      throw new Error("Failed to generate a response in the valid format");
    }
  }
};

const generateImage = async (prompt: string): Promise<string> => {
  const imageResponse = await fetch("/api/generate-fal-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!imageResponse.ok) {
    const errorData = await imageResponse.json();
    throw new Error(errorData.error || "Failed to generate image");
  }

  const imageData = await imageResponse.json();
  return imageData.result;
};

const ContentGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [contentType, setContentType] = useState("");
  const [textContent, setTextContent] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");

  const generateContent = async () => {
    setIsLoading(true);
    setTextContent("");
    setGeneratedImage(null);
    setLessonTitle("");

    try {
      // Generate text
      const textData = await generateText(
        topic,
        subject,
        grade,
        board,
        contentType,
      );
      setTextContent(textData.result);
      setLessonTitle(textData.title);

      // Generate image using the lesson title
      const imageUrl = await generateImage(textData.title);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPressed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateContent();
    }
  };

  return (
    <Card className="content-generator-card w-full max-w-5xl mx-auto rounded-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          Lesson Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="content-block space-y-4">
        <div>
          <Label htmlFor="subjectInput" className="text-sm">
            Subject
          </Label>
          <Input
            id="subjectInput"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject.."
            className="text-input mt-1"
          />
        </div>
        <div>
          <Label htmlFor="textInput" className="text-sm">
            Topic
          </Label>
          <Input
            id="textInput"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyPressed}
            placeholder="Ask me about any topic..."
            className="text-input mt-1"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gradeSelect" className="text-sm">
              Grade
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select grade..." />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Grade {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="boardInput" className="text-sm">
              Educational Board
            </Label>
            <Input
              id="boardInput"
              type="text"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder="Enter educational board..."
              className="text-input mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contentTypeSelect" className="text-sm">
              Content Type
            </Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select content type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guided-notes">Guided Notes</SelectItem>
                <SelectItem value="exemplar">Exemplar</SelectItem>
                <SelectItem value="depth-of-knowledge">
                  Depth of Knowledge Questions
                </SelectItem>
                <SelectItem value="faqs">FAQs</SelectItem>
                <SelectItem value="worksheets">Worksheets</SelectItem>
                <SelectItem value="case-studies">Case Studies</SelectItem>
                <SelectItem value="scenario-activities">
                  Scenario Based Activities
                </SelectItem>
                <SelectItem value="glossary">Glossary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={generateContent}
          className="w-full mt-6 transition-all"
          disabled={
            !topic || !subject || !grade || !board || !contentType || isLoading
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Generating...
            </div>
          ) : (
            "Create Lesson"
          )}
        </Button>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          textContent && (
            <GeneratedContent
              text={textContent}
              imageUrl={generatedImage || undefined}
              title={lessonTitle}
              contentType={contentType}
            />
          )
        )}
      </CardContent>
    </Card>
  );
};

export default ContentGenerator;
