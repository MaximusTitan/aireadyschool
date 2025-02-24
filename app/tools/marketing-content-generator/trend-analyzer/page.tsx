"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateTrends } from "../actions";
import { Loader2, TrendingUp, Hash, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const topic = formData.get("topic") as string;

    try {
      const response = await generateTrends(topic);
      if (response.success) {
        setOutput(response.content);
      } else {
        setError(response.error || "Failed to generate trends");
      }
    } catch (err) {
      console.error("Error in trend analysis:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            Education Trend Analyzer
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay up-to-date with the latest educational trends and innovations to inform your school's strategies and curriculum.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 p-6 rounded-lg border dark:border-neutral-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Education Topic</Label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-3 text-gray-400" />
                <Textarea
                  id="topic"
                  name="topic"
                  placeholder="Enter an education topic or area to analyze trends..."
                  required
                  className="min-h-[100px] pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Trends
            </Button>
          </form>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {output && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Trending Topics:
                    </h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {output
                        .split("\n")
                        .filter((line) => line.trim().startsWith("-"))
                        .map((topic, index) => (
                          <li key={index} className="text-gray-800">
                            {topic.trim().substring(2)}
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Relevant Hashtags:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {output
                        .split("\n")
                        .find((line) => line.includes("#"))
                        ?.split(" ")
                        .filter((word) => word.startsWith("#"))
                        .map((hashtag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gray-100 flex items-center"
                          >
                            <Hash className="w-3 h-3 mr-1" />
                            {hashtag.trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  {output.includes("Explanation:") && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Explanation:
                      </h3>
                      <p className="text-gray-700">
                        {output.split("Explanation:")[1].trim()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
