// app/page.tsx
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
import { Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

type Operation =
  | "rewrite"
  | "proofread"
  | "translate"
  | "questions"
  | "expand"
  | "summarize";

export default function TextTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [operation, setOperation] = useState<Operation>("rewrite");
  const [loading, setLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("spanish");

  const processText = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          operation,
          targetLanguage:
            operation === "translate" ? targetLanguage : undefined,
        }),
      });

      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      console.error("Error processing text:", error);
      setOutput("An error occurred while processing your text.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-4 flex items-center space-x-2">
        <Link
          href="/tools"
          className="text-neutral-500 hover:text-neutral-700 "
        >
          <ChevronLeft />
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800">Text Tools</h1>
      </div>
      <div className="max-w-6xl mx-auto space-y-8 x-auto px-2 py-8">
        <div className="border border-neutral-200 rounded-md p-6 md:p-8 max-w-6xl mx-auto">
          <div className="flex gap-4 items-center mb-4">
            <Select
              value={operation}
              onValueChange={(value) => setOperation(value as Operation)}
            >
              <SelectTrigger className="w-[200px] bg-white dark:bg-neutral-800">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rewrite">Rewrite</SelectItem>
                <SelectItem value="proofread">Proofread</SelectItem>
                <SelectItem value="translate">Translate</SelectItem>
                <SelectItem value="questions">Generate Questions</SelectItem>
                <SelectItem value="expand">Expand</SelectItem>
                <SelectItem value="summarize">Summarize</SelectItem>
              </SelectContent>
            </Select>

            {operation === "translate" && (
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-[200px] bg-white dark:bg-neutral-800">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dark:bg-neutral-800">
              <CardHeader>
                <CardTitle>Input Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your text here..."
                  className="min-h-[200px] dark:bg-neutral-800"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="dark:bg-neutral-800">
              <CardHeader>
                <CardTitle>Output Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Processed text will appear here..."
                  className="min-h-[200px] dark:bg-neutral-800"
                  value={output}
                  readOnly
                />
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-4">
            <Button
              onClick={processText}
              disabled={loading || !input.trim()}
              className="bg-neutral-500 hover:bg-neutral-600 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processing..." : "Process Text"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
