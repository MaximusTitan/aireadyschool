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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";

// Existing aspect ratio map
const aspectRatioMap = {
  square_hd: "aspect-square",
  square: "aspect-square",
  portrait_4_3: "aspect-[3/4]",
  portrait_16_9: "aspect-[9/16]",
  landscape_4_3: "aspect-[4/3]",
  landscape_16_9: "aspect-[16/9]",
};

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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            href="/tools"
            className="transition-colors hover:text-neutral-600"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-200 dark:to-neutral-400">
            Image Playground
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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

          {/* Result Card - Now shown regardless of active tab */}
          <Card className="border-neutral-500/20 shadow-lg">
            <CardHeader>
              <CardDescription className="text-lg">
                Generated Results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div
                  className={`grid ${getGridLayout(settings.num_images)} gap-4`}
                >
                  {Array(settings.num_images)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="relative">
                        <div
                          className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg ${
                            aspectRatioMap[
                              settings.image_size as keyof typeof aspectRatioMap
                            ]
                          }`}
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="h-2 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : generatedImages.length > 0 ? (
                <div
                  className={`grid ${getGridLayout(generatedImages.length)} gap-4`}
                >
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div
                        className={`${aspectRatioMap[image.aspectRatio as keyof typeof aspectRatioMap]}`}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:brightness-75"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          onClick={() => handleDownload(image.url)}
                          className="transform scale-95 group-hover:scale-100 transition-transform"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm truncate">
                          {image.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-neutral-500">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p>Your generated images will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
