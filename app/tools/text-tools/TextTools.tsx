"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, Copy, Check } from "lucide-react";
import Link from "next/link";

type Operation =
  | "rewrite"
  | "proofread"
  | "translate"
  | "questions"
  | "expand"
  | "summarize";

const countWords = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

const operationDescriptions = {
  rewrite:
    "Rewrite the text while keeping the same meaning but using different words and structure",
  proofread: "Check and correct spelling, grammar, and punctuation errors",
  translate: "Translate the text into your selected target language",
  expand:
    "Make the text longer by adding more details and elaborating on the ideas",
  summarize:
    "Create a shorter version that captures the main points of the text",
  questions: "Generate questions based on the text content",
} as const;

export default function TextTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [operation, setOperation] = useState<Operation>("summarize");
  const [loading, setLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [targetWords, setTargetWords] = useState(100);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ message: string, type: string } | null>(null);

  const processText = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setOutput("");
    
    try {
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          operation,
          targetLanguage:
            operation === "translate" ? targetLanguage : undefined,
          targetWords: ["expand", "summarize"].includes(operation)
            ? targetWords
            : undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError({ 
          message: data.error || "An error occurred while processing your text", 
          type: data.errorType || "unknown_error"
        });
        return;
      }
      
      setOutput(data.result);
    } catch (error) {
      console.error("Error processing text:", error);
      setError({ 
        message: "Network error or server unavailable", 
        type: "network_error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const inputWordCount = countWords(input);
  const outputWordCount = countWords(output);

  return (
    <div className="min-h-screen dark:bg-neutral-900">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Text Tools</h1>
          <p className="text-muted-foreground text-lg">
            Transform your text with AI-powered tools for rewriting,
            proofreading, translation, and more.
          </p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 md:p-8 bg-white dark:bg-neutral-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
            <div className="space-y-2 flex-1">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Operation
              </label>
              <Select
                value={operation}
                onValueChange={(value) => setOperation(value as Operation)}
              >
                <SelectTrigger className="w-[200px] bg-white dark:bg-neutral-700">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summarize">📊 Summarize</SelectItem>
                  <SelectItem value="expand">📈 Expand</SelectItem>
                  <SelectItem value="translate">🌍 Translate</SelectItem>
                  <SelectItem value="rewrite">✍️ Rewrite</SelectItem>
                  <SelectItem value="proofread">📝 Proofread</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                {operationDescriptions[operation]}
              </p>
            </div>

            {(operation === "expand" || operation === "summarize") && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  Target Words
                </label>
                <input
                  type="number"
                  value={targetWords}
                  onChange={(e) =>
                    setTargetWords(Math.max(1, parseInt(e.target.value) || 0))
                  }
                  className="w-[100px] rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 px-3 py-2"
                />
              </div>
            )}

            {operation === "translate" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  Target Language
                </label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger className="w-[200px] bg-white dark:bg-neutral-700">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
                    <SelectItem value="french">🇫🇷 French</SelectItem>
                    <SelectItem value="german">🇩🇪 German</SelectItem>
                    <SelectItem value="italian">🇮🇹 Italian</SelectItem>
                    <SelectItem value="portuguese">🇵🇹 Portuguese</SelectItem>
                    <SelectItem value="chinese">🇨🇳 Chinese</SelectItem>
                    <SelectItem value="japanese">🇯🇵 Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border dark:border-neutral-700">
              <CardHeader className="border-b dark:border-neutral-700">
                <CardTitle>Input Text</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-500">
                    Word count: {inputWordCount}
                  </span>
                </div>
                <Textarea
                  placeholder="Enter your text here..."
                  className="min-h-[300px] bg-transparent resize-none focus:ring-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="border dark:border-neutral-700">
              <CardHeader className="border-b dark:border-neutral-700">
                <div className="flex justify-between items-center">
                  <CardTitle>Output Text</CardTitle>
                  {output && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-8 w-8 p-0"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className={`pt-4 relative ${loading ? "opacity-50" : ""}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-500">
                    Word count: {outputWordCount}
                  </span>
                </div>
                
                {error ? (
                  <div className="min-h-[300px] flex flex-col items-center justify-center">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 w-full max-w-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>{error.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Processed text will appear here..."
                    className="min-h-[300px] bg-transparent resize-none"
                    value={output}
                    readOnly
                  />
                )}
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6">
            <Button
              onClick={processText}
              disabled={loading || !input.trim()}
              className="bg-neutral-800 hover:bg-neutral-900 text-white px-8 py-2 text-lg font-medium transition-colors"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Processing..." : "Process Text"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
