"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateKeywords } from "../actions";
import { Loader2, Search, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "../common/Header";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<
    Array<{
      keyword: string;
      relevance: number;
      type: string;
      difficulty: string;
    }>
  >([]);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const topic = formData.get("topic") as string;

    try {
      const response = await generateKeywords(topic);
      if (response.success) {
        setOutput(JSON.parse(response.content));
      } else {
        setError(response.error || "Failed to generate keywords");
      }
    } catch (err) {
      console.error("Error in keyword research:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Header 
        title="SEO Keyword Research"
        description="Optimize your school's online presence with data-driven keyword research and content strategy recommendations."
      />
      <div className="container mx-auto px-4 max-w-6xl">          <div className="space-y-6 pb-8">
            <div className="px-4">
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Education Topic</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-gray-400" />
                      <Textarea
                        id="topic"
                        name="topic"
                        placeholder="Enter a topic related to your school or education..."
                        required
                        className="min-h-[100px] pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate SEO Keywords
                  </Button>
                </form>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                {output.length > 0 && (
                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <div className="prose max-w-none">
                        <h3 className="text-lg font-semibold mb-2">
                          SEO Keyword Research Results:
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Keyword
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Relevance
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Type
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Difficulty
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {output.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.keyword}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.relevance.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.difficulty}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
