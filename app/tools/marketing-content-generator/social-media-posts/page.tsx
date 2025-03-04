"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            Social Media Post Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create engaging social media content to connect with your school
            community and share important updates effectively.
          </p>
        </div>

        <div className="mx-auto bg-white dark:bg-neutral-800 p-6 rounded-lg border dark:border-neutral-700">
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
