"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ChevronLeft,
  Download,
  Image as ImageIcon,
  SendIcon,
  Expand,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { Pagination } from "@/components/ui/pagination-img-gen";
import { ImageModal } from "@/components/ui/image-modal";

// Existing aspect ratio map
const aspectRatioMap = {
  square_hd: "aspect-square",
  square: "aspect-square",
  portrait_4_3: "aspect-[3/4]",
  portrait_16_9: "aspect-[9/16]",
  landscape_4_3: "aspect-[4/3]",
  landscape_16_9: "aspect-[16/9]",
};

interface GeneratedImage {
  image_url: string; // Changed from url to match database column
  prompt: string;
  aspect_ratio: string; // Changed from aspectRatio to match database column
  created_at: string;
  bucket_path: string;
}

export default function Page() {
  // Add loading state for initial data fetch
  const [initialLoading, setInitialLoading] = useState(true);

  // Chat-related state
  const {
    messages,
    input,
    setInput,
    handleSubmit: handleChatSubmit,
    isLoading: isChatLoading,
  } = useChat({
    api: "/api/image-chat",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingImageRequests] = useState(() => new Set<string>());
  const [completedImages] = useState(() => new Set<string>());
  const [generatedImages, setGeneratedImages] = useState<
    Array<{
      url: string;
      prompt: string;
      aspectRatio: string;
    }>
  >([]);

  // Existing state
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState({
    image_size: "landscape_4_3",
    num_inference_steps: 1,
    num_images: 1,
    enable_safety_checker: true,
    style: "realistic_image",
  });
  const [activeTab, setActiveTab] = useState("regular");
  const { toast } = useToast();

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enhance user data fetch with loading state
  useEffect(() => {
    const fetchUserData = async () => {
      setInitialLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email ?? "guest@example.com");
          const { data: userData } = await supabase
            .from("users")
            .select("image_credits")
            .eq("user_id", user.id)
            .single();

          if (userData) {
            setCredits(userData.image_credits);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Add typing indicator for chat
  const [isTyping, setIsTyping] = useState(false);
  useEffect(() => {
    if (isChatLoading) {
      setIsTyping(true);
    } else {
      const timer = setTimeout(() => setIsTyping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isChatLoading]);

  // Handle image generation from chat
  const handleImageGeneration = async (
    toolCallId: string,
    params: {
      prompt: string;
      style: string;
      imageSize: string;
      numInferenceSteps: number;
      numImages: number;
      enableSafetyChecker: boolean;
    }
  ) => {
    if (
      pendingImageRequests.has(toolCallId) ||
      completedImages.has(toolCallId)
    ) {
      return;
    }

    setLoading(true);
    pendingImageRequests.add(toolCallId);

    try {
      const response = await fetch("/api/generate-recraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();

      if (data.images?.[0]) {
        setGeneratedImages((prev) => [
          ...prev,
          {
            url: data.images[0].url,
            prompt: params.prompt,
            aspectRatio: params.imageSize,
          },
        ]);
        setCredits(data.remainingCredits);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      pendingImageRequests.delete(toolCallId);
      completedImages.add(toolCallId);
    }
  };

  // Handle regular mode image generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description:
          "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    if (credits !== null && credits < settings.num_images) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${settings.num_images} credits to generate ${settings.num_images} image${settings.num_images > 1 ? "s" : ""}. You have ${credits} credits remaining.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-recraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: settings.style,
          imageSize: settings.image_size,
          numInferenceSteps: settings.num_inference_steps,
          numImages: settings.num_images,
          enableSafetyChecker: settings.enable_safety_checker,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      if (data.images?.length > 0) {
        const newImages = data.images.map((img: any) => ({
          url: img.url,
          prompt: prompt,
          aspectRatio: settings.image_size,
        }));
        setGeneratedImages((prev) => [...prev, ...newImages]);
        setCredits(data.remainingCredits);
        toast({
          title: "Success!",
          description: `Generated ${data.images.length} images successfully. ${data.remainingCredits} credits remaining.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl) return;

    try {
      setLoading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "generated-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhance image grid layout with dynamic sizing
  const getGridLayout = (numImages: number) => {
    if (numImages === 1) return "grid-cols-1 max-w-2xl mx-auto";
    if (numImages === 2) return "grid-cols-2 max-w-3xl mx-auto gap-6";
    return "grid-cols-2 gap-4";
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [previousImages, setPreviousImages] = useState<GeneratedImage[]>([]);
  const imagesPerPage = 6;

  // Add state for fullscreen modal
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );

  // Add function to fetch previous images
  const fetchPreviousImages = async (page: number) => {
    try {
      const supabase = createClient();
      const from = (page - 1) * imagesPerPage;
      const to = from + imagesPerPage - 1;

      // Get total count first
      const { count } = await supabase
        .from("generated_images")
        .select("*", { count: "exact", head: true })
        .eq("user_email", userEmail);

      // Then get paginated data
      const { data } = await supabase
        .from("generated_images")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (data) {
        setPreviousImages(data);
        setTotalImages(count || 0);
      }
    } catch (error) {
      console.error("Error fetching previous images:", error);
    }
  };

  // Update useEffect to fetch previous images when page changes
  useEffect(() => {
    if (userEmail && userEmail !== "guest@example.com") {
      fetchPreviousImages(currentPage);
    }
  }, [currentPage, userEmail]);

  // Add handler for page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Add handler for navigating between images in fullscreen
  const handleNavigateImage = (direction: "next" | "previous") => {
    if (!selectedImage) return;

    const currentIndex = previousImages.findIndex(
      (img) => img.image_url === selectedImage.image_url
    );

    if (direction === "next" && currentIndex < previousImages.length - 1) {
      setSelectedImage(previousImages[currentIndex + 1]);
    } else if (direction === "previous" && currentIndex > 0) {
      setSelectedImage(previousImages[currentIndex - 1]);
    }
  };

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
            Image Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create stunning AI-generated images with customizable styles, sizes, and settings for your educational content.
          </p>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="regular">Regular</TabsTrigger>
                <TabsTrigger value="chat">Buddy</TabsTrigger>
              </TabsList>

              <TabsContent value="regular">
                {/* Existing regular mode UI */}
                <Card className="border-neutral-500/20 shadow-lg transition-shadow hover:shadow-xl">
                  <CardHeader>
                    {credits !== null && (
                      <div className="text-sm text-neutral-500">
                        Available Credits: {credits}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prompt Input with character count */}
                    <div className="space-y-2">
                      <Label htmlFor="prompt" className="flex justify-between">
                        <span>Prompt</span>
                        <span className="text-sm text-neutral-500">
                          {prompt.length}/1000
                        </span>
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="A serene landscape with mountains..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                        className="h-32 transition-colors focus:border-neutral-500"
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Image Size */}
                      <div className="space-y-2">
                        <Label>Image Size</Label>
                        <Select
                          value={settings.image_size}
                          onValueChange={(value) =>
                            setSettings({ ...settings, image_size: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square_hd">Square HD</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="portrait_4_3">
                              3:4 Portrait
                            </SelectItem>
                            <SelectItem value="portrait_16_9">
                              9:16 Portrait
                            </SelectItem>
                            <SelectItem value="landscape_4_3">
                              4:3 Landscape
                            </SelectItem>
                            <SelectItem value="landscape_16_9">
                              16:9 Landscape
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Style */}
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={settings.style}
                          onValueChange={(value) =>
                            setSettings({ ...settings, style: value })
                          }
                        >
                          <SelectTrigger>
                              <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="realistic_image">
                                Realistic Image
                              </SelectItem>
                              <SelectItem value="digital_illustration">
                                Digital Illustration
                              </SelectItem>
                              <SelectItem value="vector_illustration">
                                Vector Illustration
                              </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Inference Steps */}
                      <div className="space-y-2">
                        <Label>
                          Inference Steps: {settings.num_inference_steps}
                        </Label>
                        <Slider
                          value={[settings.num_inference_steps]}
                          onValueChange={([value]) =>
                            setSettings({
                              ...settings,
                              num_inference_steps: value,
                            })
                          }
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Number of Images */}
                      <div className="space-y-2">
                        <Label>Number of Images: {settings.num_images}</Label>
                        <Slider
                          value={[settings.num_images]}
                          onValueChange={([value]) =>
                            setSettings({ ...settings, num_images: value })
                          }
                          min={1}
                          max={4}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Safety Checker */}
                      <div className="flex items-center justify-between">
                        <Label>Enable Safety Checker</Label>
                        <Switch
                          checked={settings.enable_safety_checker}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              enable_safety_checker: checked,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white min-w-52 transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Image
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="chat">
                <Card className="border-neutral-500/20 shadow-lg transition-shadow hover:shadow-xl">
                  <CardHeader>
                    {credits !== null && (
                      <div className="text-sm text-neutral-500">
                        Available Credits: {credits}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enhanced Chat UI */}
                    <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`
                              max-w-[85%] rounded-lg px-3 py-2
                              ${
                                message.role === "user"
                                  ? "bg-neutral-800 text-white"
                                  : "bg-neutral-100"
                              }
                              relative group
                            `}
                          >
                            <div className="text-sm">{message.content}</div>
                            {message.toolInvocations?.map((toolInvocation) => {
                              const { toolName, toolCallId, state } =
                                toolInvocation;

                              if (
                                state === "result" &&
                                toolName === "generateImage" &&
                                toolInvocation.result.pending
                              ) {
                                if (
                                  !pendingImageRequests.has(toolCallId) &&
                                  !completedImages.has(toolCallId)
                                ) {
                                  handleImageGeneration(toolCallId, {
                                    prompt: toolInvocation.result.prompt,
                                    style: toolInvocation.result.style,
                                    imageSize: toolInvocation.result.imageSize,
                                    numInferenceSteps: 1,
                                    numImages: 1,
                                    enableSafetyChecker: true,
                                  });
                                }
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-1 items-center text-neutral-500">
                          <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 p-2 rounded-lg bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                        disabled={isChatLoading}
                      />
                      <Button
                        type="submit"
                        disabled={isChatLoading || !input.trim()}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white"
                      >
                        <SendIcon className="w-4 h-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Modified Result Card - Shows only most recent image */}
            <Card className="border-neutral-500/20 shadow-lg">
              <CardHeader>
                <CardDescription className="text-lg">
                  Latest Generated Result
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="relative">
                    <div
                      className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg aspect-square`}
                    />
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="relative group">
                    <div
                      className={`${
                        aspectRatioMap[
                          generatedImages[0].aspectRatio as keyof typeof aspectRatioMap
                        ]
                      }`}
                    >
                      <img
                        src={generatedImages[0].url}
                        alt={generatedImages[0].prompt}
                        className="w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:brightness-75"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        onClick={() => handleDownload(generatedImages[0].url)}
                        className="transform scale-95 group-hover:scale-100 transition-transform"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                      <p className="text-white text-sm truncate">
                        {generatedImages[0].prompt}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-neutral-500">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <p>Generate an image to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Previous Images Section */}
        {previousImages.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Previous Generations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousImages.map((image, index) => (
                <div key={index} className="relative group">
                  <div
                    className={`${
                      aspectRatioMap[
                        image.aspect_ratio as keyof typeof aspectRatioMap
                      ] || "aspect-square"
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:brightness-75"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setSelectedImage(image)}
                      className="transform scale-95 group-hover:scale-100 transition-transform"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleDownload(image.image_url)}
                      className="transform scale-95 group-hover:scale-100 transition-transform"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="text-white text-sm truncate">{image.prompt}</p>
                    <p className="text-white/70 text-xs">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fullscreen Modal */}
            <ImageModal
              isOpen={!!selectedImage}
              onClose={() => setSelectedImage(null)}
              imageUrl={selectedImage?.image_url || ""}
              prompt={selectedImage?.prompt || ""}
              date={selectedImage?.created_at}
              onDownload={handleDownload}
              onPrevious={() => handleNavigateImage("previous")}
              onNext={() => handleNavigateImage("next")}
              hasPrevious={
                previousImages.findIndex(
                  (img) => img.image_url === selectedImage?.image_url
                ) > 0
              }
              hasNext={
                previousImages.findIndex(
                  (img) => img.image_url === selectedImage?.image_url
                ) < previousImages.length - 1
              }
            />

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalImages / imagesPerPage)}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
