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
import { Input } from "@/components/ui/input";
import { generateVideoScript } from "../actions";
import { Loader2, Video, Users, Clock, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [videoType, setVideoType] = useState("promotional");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const highlights = formData.get("highlights") as string;
    const targetAudience = formData.get("targetAudience") as string;
    const duration = formData.get("duration") as string;

    try {
      const response = await generateVideoScript(
        videoType,
        highlights,
        targetAudience,
        duration
      );
      if (response.success) {
        setOutput(response.content);
      } else {
        setError(response.error || "Failed to generate video script");
      }
    } catch (err) {
      console.error("Error in video script generation:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 min-h-screen pb-8">
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="/tools/" className="flex items-center">
              <ChevronLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-xl font-semibold">Video Script Generator</h1>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Create compelling video scripts to showcase your school's values and
            achievements. This tool helps you generate professional scripts for
            various types of school promotional videos.
          </AlertDescription>
        </Alert>

        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoType">Video Type</Label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Select value={videoType} onValueChange={setVideoType}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select video type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">
                      School Promotional
                    </SelectItem>
                    <SelectItem value="facilities">
                      Campus & Facilities
                    </SelectItem>
                    <SelectItem value="academic">Academic Programs</SelectItem>
                    <SelectItem value="events">School Events</SelectItem>
                    <SelectItem value="testimonial">
                      Student/Parent Testimonials
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlights">Key Highlights</Label>
              <Textarea
                id="highlights"
                name="highlights"
                placeholder="Enter key points to highlight in the video..."
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Select name="targetAudience" defaultValue="parents">
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="students">
                      Prospective Students
                    </SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="all">General Audience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Video Duration (in seconds)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="number"
                  id="duration"
                  name="duration"
                  placeholder="Enter video duration in seconds"
                  required
                  min="30"
                  max="600"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Script
            </Button>
          </form>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {output && (
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-2">
                    Generated Video Script:
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
