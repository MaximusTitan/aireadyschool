"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateMarketingPoster } from "../actions";
import {
  Loader2,
  Download,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Globe,
  ChevronLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [posterType, setPosterType] = useState("event");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setImageUrl(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const venue = formData.get("venue") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const schoolWebsite = formData.get("schoolWebsite") as string;

    try {
      const response = await generateMarketingPoster({
        posterType,
        content: {
          title,
          subtitle,
          description,
          date,
          venue,
          ...(phoneNumber && { phoneNumber }),
          ...(schoolWebsite && { schoolWebsite }),
        },
        style: "digital_illustration",
      });

      if (response.success && response.content) {
        setImageUrl(response.content);
      } else {
        setError(
          response.error || "Failed to generate poster. Please try again."
        );
      }
    } catch (err) {
      console.error("Error generating poster:", err);
      setError("An unexpected error occurred. Please try again later.");
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
          <h1 className="text-xl font-semibold">Marketing Poster Generator</h1>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Create professional posters for school marketing, including events,
            admissions, and announcements. This tool uses AI to generate digital
            illustrations based on your input, helping you create eye-catching
            visual content.
          </AlertDescription>
        </Alert>

        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="posterType">Poster Type</Label>
              <Select value={posterType} onValueChange={setPosterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select poster type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">School Event</SelectItem>
                  <SelectItem value="admission">Admission Campaign</SelectItem>
                  <SelectItem value="announcement">
                    General Announcement
                  </SelectItem>
                  <SelectItem value="achievement">
                    Academic Achievement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter the main title for your poster"
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                name="subtitle"
                placeholder="Enter a subtitle or tagline (optional)"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a brief description or additional details"
                className="min-h-[100px]"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input id="date" name="date" type="date" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="venue"
                    name="venue"
                    placeholder="Enter the venue (if applicable)"
                    maxLength={100}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Enter contact phone number"
                    maxLength={20}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolWebsite">School Website (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="schoolWebsite"
                    name="schoolWebsite"
                    placeholder="Enter school website"
                    maxLength={100}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Poster
            </Button>
          </form>

          {imageUrl && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt="Generated school marketing poster"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => window.open(imageUrl, "_blank")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Poster
                    </Button>
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
