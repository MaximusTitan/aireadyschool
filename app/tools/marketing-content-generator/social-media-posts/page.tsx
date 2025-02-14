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
import { generateSocialMediaPost } from "../actions";
import {
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Hash,
  ChevronLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState("facebook");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const postType = formData.get("postType") as string;

    try {
      const response = await generateSocialMediaPost(
        platform,
        postType,
        content
      );
      if (response.success) {
        setOutput(response.content);
      } else {
        setError(response.error || "Failed to generate social media post");
      }
    } catch (err) {
      console.error("Error in social media post generation:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const platformIcons = {
    facebook: <Facebook className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6 min-h-screen pb-8">
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="/tools/" className="flex items-center">
              <ChevronLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-xl font-semibold">Social Media Post Generator</h1>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Create engaging social media content to connect with students and
            parents. This tool helps you generate platform-specific posts for
            various school-related topics and events.
          </AlertDescription>
        </Alert>

        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Social Media Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(platformIcons).map(([key, icon]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center">
                        {icon}
                        <span className="ml-2 capitalize">{key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postType">Post Type</Label>
              <Select name="postType" defaultValue="announcement">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">
                    Event Announcement
                  </SelectItem>
                  <SelectItem value="achievement">
                    Student Achievement
                  </SelectItem>
                  <SelectItem value="facilities">School Facilities</SelectItem>
                  <SelectItem value="activities">School Activities</SelectItem>
                  <SelectItem value="admission">Admission Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-gray-400" />
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Enter the main content or key points for your post..."
                  required
                  className="min-h-[100px] pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Post
            </Button>
          </form>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {output && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-2">
                    Generated Social Media Post:
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
