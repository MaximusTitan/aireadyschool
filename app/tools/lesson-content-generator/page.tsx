"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContentBlock } from "./components/ContentBlock";
import { GeneratedContent } from "./components/GeneratedContent";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const generateText = async function (
  prompt: string,
  retries = 3
): Promise<{ title: string; result: string }> {
  try {
    const textResponse = await fetch("/api/generate-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!textResponse.ok) {
      // Check if response is not ok
      const errorData = await textResponse.json();
      throw new Error(errorData.message || "Failed to generate text");
    }

    const textData = await textResponse.json();

    if (!textData.title || !textData.result) {
      if (retries > 0) {
        console.log("Invalid response format, retrying...");
        return generateText(prompt, retries - 1);
      } else {
        throw new Error("Failed to generate a response in the valid format");
      }
    }
    return textData;
  } catch (error) {
    if (retries > 0) {
      console.log("Error generating text, retrying...");
      return generateText(prompt, retries - 1);
    } else {
      throw error;
    }
  }
};

const generateImage = async function (prompt: string): Promise<string> {
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

const ContentGenerator = function () {
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textContent, setTextContent] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");

  const generateContent = async function () {
    setIsLoading(true);
    setTextContent("");
    setGeneratedImage(null);
    setLessonTitle("");

    try {
      // Generate text
      const textData = await generateText(textInput);
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
    <div>
      <div className="flex items-center space-x-2 ml-6 mt-8">
        <Link href="/tools">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800">
          Lesson Content Generator
        </h1>
      </div>
      <Card className="w-full max-w-6xl mx-auto mt-8">
        <ContentBlock
          title="Ask me anything: "
          description="What would you like to learn about today?"
        >
          <div className="p-4">
            <Label htmlFor="textInput"> Please enter your question:</Label>
            <Input
              id="textInput"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyPressed}
              placeholder="Start Typing here..."
              className="text-input mb-4 text-black"
            />
            <Button
              onClick={generateContent}
              disabled={!textInput || isLoading}
              variant="default"
              className="generate-button mb-4"
            >
              Create Lesson
            </Button>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              textContent && (
                <GeneratedContent
                  text={textContent}
                  imageUrl={generatedImage || undefined}
                  title={lessonTitle}
                />
              )
            )}
          </div>
        </ContentBlock>
      </Card>
    </div>
  );
};

export default ContentGenerator;
