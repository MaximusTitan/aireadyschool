"use client";
import { createApp, getUserApps } from "@/app/actions/apps";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, InfoIcon, TextCursor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserApp {
  id: string;
  name: string;
  description: string;
  created_at: string;
  app_flows: Array<{ input_prompt: string }>;
}

export default function Builder() {
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  useEffect(() => {
    getUserApps()
      .then(setUserApps)
      .finally(() => setIsLoadingApps(false));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!appName.trim()) newErrors.name = "App name is required";
    if (!inputPrompt.trim()) newErrors.prompt = "AI prompt is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveApp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await createApp({
        name: appName,
        description,
        flow: { inputPrompt },
      });
      if (result) {
        toast.success("App created successfully!");
        window.location.href = `/apps/${result.id}`;
      }
    } catch (error) {
      toast.error("Failed to create app");
    } finally {
      setIsLoading(false);
    }
  };

  const insertInputTag = () => {
    const textarea = document.getElementById("prompt") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + "{input}" + text.substring(end);
    setInputPrompt(newText);
    // Set cursor position after the inserted tag
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 7;
      textarea.focus();
    }, 0);
  };

  const highlightInputTags = (text: string) => {
    return text.replace(
      /\{input\}/g,
      '<span class="text-rose-500 font-semibold">{input}</span>'
    );
  };

  return (
    <div className="bg-backgroundApp">
      <div className="container  mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">AI App Builder</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Create custom AI applications with natural language prompts. Your
            apps can process user input and generate AI-powered responses.
          </p>
        </div>

        <Card className="shadow-lg border-2 transition-colors">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="appName" className="text-sm font-semibold">
                    App Name *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Choose a unique name for your AI app
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  id="appName"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter app name..."
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                  placeholder="Describe what your AI app does..."
                />
                <p className="text-sm text-muted-foreground">
                  Help others understand what your app does
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt" className="text-sm font-semibold">
                    AI Prompt *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Click the button below or type {"{input}"} to add a user
                      input placeholder
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-500 min-h-[150px] ${
                      errors.prompt ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Example: You are a helpful assistant. User says: {input}. Provide a detailed response."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-3 right-3 text-xs"
                    onClick={insertInputTag}
                  >
                    <TextCursor className="h-4 w-4 mr-1" />
                    Insert {"{input}"}
                  </Button>
                </div>
                {errors.prompt && (
                  <p className="text-red-500 text-sm mt-1">{errors.prompt}</p>
                )}
                <div
                  className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg"
                  dangerouslySetInnerHTML={{
                    __html: highlightInputTags(
                      "Preview: " + (inputPrompt || "No prompt entered yet")
                    ),
                  }}
                />
              </div>
            </div>

            <Button
              onClick={saveApp}
              disabled={isLoading}
              className="w-fit h-10 text-sm font-semibold bg-rose-500 hover:bg-rose-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create App"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/50 border-b p-6">
            <CardTitle className="text-2xl font-bold">My Apps</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingApps ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userApps.length === 0 ? (
              <div className="text-center p-8 space-y-4">
                <p className="text-muted-foreground">
                  You haven't created any apps yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first AI app using the form above!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className="p-6 rounded-lg border-2 hover:border-neutral-400 cursor-pointer hover:bg-muted/50 transition-all"
                  >
                    <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
                    <p className="text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-muted-foreground">
                        Created: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        Open App →
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
