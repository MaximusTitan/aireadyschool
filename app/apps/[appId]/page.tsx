"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import ReactMarkdown from "react-markdown";
import { getApp } from "@/app/actions/apps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";

interface App {
  id: string;
  name: string;
  description: string;
  flow: {
    inputPrompt: string;
  };
}

export default function AppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = use(params);
  const [app, setApp] = useState<App | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
    getApp(appId)
      .then((data) => {
        if (!data) {
          setError("App not found");
          return;
        }
        setApp(data);
      })
      .catch(() => setError("Failed to load app"));
  }, [appId]);

  const runFlow = async () => {
    if (!app?.flow?.inputPrompt) {
      console.error("App or flow configuration is missing");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/app-openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: app.flow.inputPrompt.replace("{input}", input),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setResult(data.text);
    } catch (error) {
      console.error("Failed to generate text: ", error);
      setError("Failed to generate response");
      setResult("");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/tools/builder">Return to Builder</Link>
        </Button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">{app.name}</h1>
          <p className="text-muted-foreground text-lg">{app.description}</p>
        </div>
        <Link
          href="https://aireadyschool.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <p className="text-base text-neutral-600 font-semibold">Built with</p>
          <Image
            src="/newLogo.png"
            alt="AI Ready School Logo"
            width={100}
            height={37}
            className="h-auto"
          />
        </Link>
      </div>

      <Card className="shadow-lg border-2">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input" className="text-base font-semibold">
              Your Input
            </Label>
            <div className="flex gap-4">
              <input
                id="input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                placeholder="Type your input here..."
                onKeyDown={(e) => e.key === "Enter" && !loading && runFlow()}
              />
              <Button
                onClick={runFlow}
                disabled={loading || !input.trim()}
                className="h-12 text-base font-semibold bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Run"
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Result</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-2">{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg border prose prose-rose max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
