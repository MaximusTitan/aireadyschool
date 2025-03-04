"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateNewsletter } from "../actions";
import { Loader2, Mail, Users, FileText, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "../common/Header";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [newsletterType, setNewsletterType] = useState("general");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const audience = formData.get("audience") as string;

    try {
      const response = await generateNewsletter(
        newsletterType,
        content,
        audience
      );
      if (response.success) {
        setOutput(response.content);
      } else {
        setError(response.error || "Failed to generate newsletter");
      }
    } catch (err) {
      console.error("Error in newsletter generation:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <Header
        title="Newsletter Generator"
        description="Create engaging newsletters to keep your school community informed and connected with automated content generation."
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mx-auto bg-white dark:bg-neutral-800 p-6 rounded-lg border dark:border-neutral-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletterType">Newsletter Type</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Select
                  value={newsletterType}
                  onValueChange={setNewsletterType}
                >
                  <SelectTrigger className="w-full pl-10">
                    <SelectValue placeholder="Select newsletter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Update</SelectItem>
                    <SelectItem value="academic">Academic Focus</SelectItem>
                    <SelectItem value="events">Upcoming Events</SelectItem>
                    <SelectItem value="achievements">
                      Student Achievements
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Newsletter Content</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" />
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Enter the main content or key points for your newsletter..."
                  required
                  className="min-h-[150px] pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Primary Audience</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Select name="audience" defaultValue="all">
                  <SelectTrigger className="w-full pl-10">
                    <SelectValue placeholder="Select primary audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All (Parents, Students, Staff)
                    </SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Newsletter
            </Button>
          </form>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {output && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-2">
                    Generated Newsletter:
                  </h3>
                  <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200">
                    {output}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
