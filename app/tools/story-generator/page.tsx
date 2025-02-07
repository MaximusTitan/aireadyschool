"use client";

import { useState, useRef, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { StoryHistory } from "@/components/story/StoryHistory";
import { Story } from "@/types/story";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface StoryResponse {
  story: string;
  imageUrl: string;
  storyId?: number;
}

export default function GenerateStory() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "story" | "image">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoryResponse | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    loadUserStories();
  }, [currentPage]);

  const loadUserStories = async () => {
    const supabase = createClient();

    // Get total count
    const { count } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true });

    if (count) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    // Get paginated data
    const { data } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .range(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE - 1
      );

    if (data) {
      setStories(data);
    }
  };

  const handleLoadStory = (story: Story) => {
    setResult({
      story: story.story,
      imageUrl: story.image_url,
      storyId: story.id,
    });

    // Scroll to result
    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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
        body: JSON.stringify({
          prompt: imagePrompt,
          storyId: storyData.storyId,
        }),
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      <div className="flex items-center gap-3 max-w-6xl mx-auto mb-12">
        <Link
          href="/tools"
          className="hover:bg-gray-50 p-2 rounded-full transition-all"
        >
          <ChevronLeft className="text-gray-900" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          AI Story Generator
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
            <div>
              <label className="block text-sm font-medium mb-2">
                Story Title *
              </label>
              <input
                name="title"
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                  focus:ring-1 focus:ring-black focus:border-black transition-all"
                maxLength={100}
                required
                placeholder="Enter a captivating title"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                name="description"
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                  focus:ring-1 focus:ring-black focus:border-black transition-all"
                rows={4}
                maxLength={500}
                placeholder="Add some context or specific elements you'd like in your story"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Genre *
                </label>
                <select
                  name="genre"
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
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
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
                  required
                >
                  <option value="children">Children</option>
                  <option value="young-adult">Young Adult</option>
                  <option value="adult">Adult</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Story Tone
                </label>
                <select
                  name="tone"
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
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
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
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
              className="w-full bg-black hover:bg-gray-800 text-white p-4 rounded-lg 
                font-medium transition-colors disabled:opacity-50 disabled:hover:bg-black"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="w-5 h-5" />
                  {currentStep === "story"
                    ? "Crafting your story..."
                    : "Creating illustration..."}
                </span>
              ) : (
                "Generate Story"
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {result && (
          <div
            ref={resultRef}
            className="mt-16 space-y-12 animate-fadeIn max-w-4xl mx-auto print-content"
          >
            {result.imageUrl && (
              <div className="aspect-w-16 aspect-h-9 max-h-[600px] overflow-hidden rounded-xl border border-gray-100 shadow-lg print:shadow-none print:border-0">
                <img
                  src={result.imageUrl}
                  alt="Story illustration"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <article className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 print:shadow-none print:border-0 print:p-0">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {formatStoryAsMarkdown(result.story)}
                </ReactMarkdown>
              </div>
            </article>

            <div className="flex justify-center mt-8 no-print">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-6 py-3 text-sm font-medium 
                  text-gray-700 bg-white border border-gray-300 rounded-lg 
                  hover:bg-gray-50 transition-colors"
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
          <div className="max-w-2xl mx-auto mt-12 p-8 bg-gray-50 rounded-lg text-center border border-gray-100">
            <p className="text-lg text-gray-600">
              Your story will appear here after generation
            </p>
          </div>
        )}

        {/* History section */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Previous Stories</h2>
          <StoryHistory stories={stories} onLoadStory={handleLoadStory} />

          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => handlePageChange(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
