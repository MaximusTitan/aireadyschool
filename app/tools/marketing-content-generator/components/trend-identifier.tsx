"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateTrends } from "../actions";
import { Loader2 } from "lucide-react";

export function TrendIdentifier() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const topic = formData.get("topic") as string;

    const response = await generateTrends(topic);

    setLoading(false);
    if (response.success) {
      setOutput(response.content);
    } else {
      setError(response.error || "Something went wrong");
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="topic">Topic or Keyword</Label>
          <Textarea
            id="topic"
            name="topic"
            placeholder="Enter a topic or keyword to identify trends..."
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Trends
        </Button>
      </form>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {output && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Trending Topics:</h3>
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
                <h3 className="font-semibold mb-2">Relevant Hashtags:</h3>
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
                        className="bg-gray-100"
                      >
                        {hashtag.trim()}
                      </Badge>
                    ))}
                </div>
              </div>
              {output.includes("Explanation:") && (
                <div>
                  <h3 className="font-semibold mb-2">Explanation:</h3>
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
  );
}
