"use client";

import { useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface StoryResponse {
  story: string;
  imageUrl: string;
}

export default function GenerateStory() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "story" | "image">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoryResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCurrentStep("story");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      genre: formData.get("genre"),
      ageGroup: formData.get("ageGroup"),
      tone: formData.get("tone") || "engaging",
      length: formData.get("length") || "medium",
    };

    try {
      setCurrentStep("story");
      const storyResponse = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!storyResponse.ok) throw new Error("Failed to generate story");
      const storyData = await storyResponse.json();

      // Extract a good scene from the story for image generation
      const firstParagraph = storyData.story.split("\n")[0];
      const imagePrompt = `${data.genre} style scene: ${firstParagraph.slice(0, 200)}`;

      setCurrentStep("image");
      const imageResponse = await fetch("/api/generate-story-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!imageResponse.ok) throw new Error("Failed to generate image");
      const imageData = await imageResponse.json();

      setResult({
        story: storyData.story,
        imageUrl: imageData.imageUrl,
      });

      // Scroll to result after a short delay to ensure rendering is complete
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      setError(
        typeof error === "string"
          ? error
          : "Failed to generate story. Please try again."
      );
      console.error(error);
    } finally {
      setLoading(false);
      setCurrentStep("idle");
    }
  };

  // Format the story as markdown
  const formatStoryAsMarkdown = (story: string) => {
    const paragraphs = story.split("\n");
    const title = paragraphs[0];
    const content = paragraphs.slice(1).join("\n\n");

    return `# ${title}\n\n${content}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 max-w-6xl mx-auto mb-8">
        <Link
          href="/tools"
          className="hover:bg-gray-100 p-2 rounded-full transition-all"
        >
          <ChevronLeft className="text-gray-900" />
        </Link>
        <h1 className="text-3xl font-bold">AI Story Generator</h1>
      </div>
      <div className="mb-12">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Story Title
            </label>
            <input
              name="title"
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
              required
            />
            <p className="mt-1 text-sm text-gray-500">Maximum 100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              maxLength={500}
              required
            />
            <p className="mt-1 text-sm text-gray-500">Maximum 500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <select
                name="genre"
                className="w-full p-3 border rounded-lg shadow-sm"
                required
              >
                <option value="fantasy">Fantasy</option>
                <option value="adventure">Adventure</option>
                <option value="mystery">Mystery</option>
                <option value="scifi">Science Fiction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Age Group
              </label>
              <select
                name="ageGroup"
                className="w-full p-3 border rounded-lg shadow-sm"
                required
              >
                <option value="children">Children</option>
                <option value="young-adult">Young Adult</option>
                <option value="adult">Adult</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Story Tone
              </label>
              <select
                name="tone"
                className="w-full p-3 border rounded-lg shadow-sm"
                required
              >
                <option value="engaging">Engaging</option>
                <option value="humorous">Humorous</option>
                <option value="dramatic">Dramatic</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Story Length
              </label>
              <select
                name="length"
                className="w-full p-3 border rounded-lg shadow-sm"
                required
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-5 h-5" />
                {currentStep === "story"
                  ? "Generating Story..."
                  : "Generating Image..."}
              </span>
            ) : (
              "Generate Story"
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="mt-12 space-y-8 animate-fadeIn">
          {result.imageUrl && (
            <div className="aspect-w-16 aspect-h-9 max-h-[600px] overflow-hidden rounded-xl">
              <img
                src={result.imageUrl}
                alt="Story illustration"
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>
                {formatStoryAsMarkdown(result.story)}
              </ReactMarkdown>
            </div>
          </article>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Story
            </button>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="max-w-3xl mx-auto mt-12 p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-lg text-gray-500">
            Your story will appear here after generation
          </p>
        </div>
      )}
    </div>
  );
}
