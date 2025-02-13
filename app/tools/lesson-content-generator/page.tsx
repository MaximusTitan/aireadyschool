"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Loader2 } from "lucide-react";
import { PdfDownloader } from "./components/PdfDownloader"; // New import

const generateText = async (
  topic: string,
  subject: string,
  grade: string,
  board: string,
  contentType: string,
  retries = 3,
): Promise<{ title: string; result: string; imageUrl?: string }> => {
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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [contentType, setContentType] = useState("");
  const [textContent, setTextContent] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const contentRef = useRef<HTMLDivElement>(null); // New ref for generated content

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/lesson-history");
      const data = await res.json();
      setHistory(data.lessons);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const generateContent = async () => {
    setIsLoading(true);
    setIsImageLoading(true);
    setTextContent("");
    setGeneratedImage(null);
    setLessonTitle("");

    try {
      const textData = await generateText(topic, subject, grade, board, contentType);
      setTextContent(textData.result);
      setLessonTitle(textData.title);
      setIsLoading(false);

      if (textData.imageUrl) {
        setGeneratedImage(textData.imageUrl);
      }

      fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleKeyPressed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateContent();
    }
  };

  const lessonsPerPage = 5;
  const displayedLessons = history.slice(
    (currentPage - 1) * lessonsPerPage,
    currentPage * lessonsPerPage
  );

  const handleHistoryClick = (lesson: any) => {
    setLessonTitle(lesson.title);
    setTextContent(lesson.content);
    setGeneratedImage(lesson.image_url || null);
    // Scroll smoothly to the generated content block
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage * lessonsPerPage < history.length) setCurrentPage(currentPage + 1);
  };

  // Add this new function to format the image URL
  const formatImageUrl = (url: string | null) => {
    if (!url) return "No image";
    try {
      const storageUrl = new URL(url);
      if (storageUrl.hostname.includes('supabase')) {
        return `Supabase Storage: ${storageUrl.pathname.split('/').pop()}`;
      }
      return "Image stored";
    } catch {
      return "Invalid URL";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
            Lesson Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="subjectInput" className="text-base font-semibold">Subject</Label>
                <Input
                  id="subjectInput"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textInput" className="text-base font-semibold">Topic</Label>
                <Input
                  id="textInput"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyPressed}
                  placeholder="Enter topic..."
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label htmlFor="gradeSelect" className="text-base font-semibold">Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-full h-11">
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
              <div className="space-y-2">
                <Label htmlFor="boardInput" className="text-base font-semibold">Educational Board</Label>
                <Input
                  id="boardInput"
                  type="text"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  placeholder="Enter educational board..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentTypeSelect" className="text-base font-semibold">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select content type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guided-notes">Guided Notes</SelectItem>
                    <SelectItem value="exemplar">Exemplar</SelectItem>
                    <SelectItem value="depth-of-knowledge">Depth of Knowledge Questions</SelectItem>
                    <SelectItem value="faqs">FAQs</SelectItem>
                    <SelectItem value="worksheets">Worksheets</SelectItem>
                    <SelectItem value="case-studies">Case Studies</SelectItem>
                    <SelectItem value="scenario-activities">Scenario Based Activities</SelectItem>
                    <SelectItem value="glossary">Glossary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={generateContent}
            disabled={!topic || !subject || !grade || !board || !contentType || isLoading}
            className="w-full h-12 text-lg font-semibold bg-neutral-900 hover:bg-neutral-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Create Lesson'
            )}
          </Button>

          {/* Generated Content Section */}
          {textContent && (
            <div ref={contentRef} className="mt-8 animate-in fade-in-50">
              <GeneratedContent
                text={textContent}
                imageUrl={generatedImage || undefined}
                title={lessonTitle}
                contentType={contentType}
                isImageLoading={isImageLoading}
              />
              <PdfDownloader
                lessonTitle={lessonTitle}
                textContent={textContent}
                imageUrl={generatedImage}
                className="w-full h-12 mt-4 bg-neutral-900 hover:bg-neutral-800"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Lesson History</CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {Math.ceil(history.length / lessonsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage * lessonsPerPage >= history.length}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {displayedLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => handleHistoryClick(lesson)}
                className="p-6 rounded-lg border-2 hover:border-neutral-400 cursor-pointer hover:bg-muted/50 transition-all"
              >
                <h3 className="text-xl font-semibold mb-3">{lesson.title}</h3>
                <div className="flex flex-col space-y-2">
                  <p className="text-base text-muted-foreground line-clamp-2">
                    {lesson.content}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground block">
                        Image: {formatImageUrl(lesson.image_url)}
                      </span>
                      <span className="text-sm text-muted-foreground block">
                        Created: {new Date(lesson.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <PdfDownloader
                      lessonTitle={lesson.title}
                      textContent={lesson.content}
                      imageUrl={lesson.image_url}
                      className="h-10 px-4 bg-neutral-900 hover:bg-neutral-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGenerator;
