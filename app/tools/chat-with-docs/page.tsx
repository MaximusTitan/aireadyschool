"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setLoading(true);
    const file = e.target.files[0];
    setFile(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          content: `File "${file.name}" uploaded successfully!`,
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        { role: "system", content: "Error uploading file." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get response");
      }

      if (!result.hasContext) {
        setChat((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "No relevant documents found. Please try uploading a document first or rephrase your question.",
          },
        ]);
      }

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          content:
            error instanceof Error ? error.message : "Error getting response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-neutral-950 shadow-lg">
      <CardHeader className="border-b dark:border-neutral-800">
        <CardTitle className="text-rose-500">Chat With Docs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "p-4 rounded-lg max-w-[80%]",
                msg.role === "user"
                  ? "ml-auto bg-rose-500 text-white"
                  : msg.role === "assistant"
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "bg-neutral-200 dark:bg-neutral-800 italic"
              )}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="animate-spin text-rose-500" />
            </div>
          )}
        </div>
        <div className="p-4 border-t dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="dark:border-neutral-800 dark:hover:bg-neutral-800"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Doc
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question about your document..."
                className="flex-1 dark:bg-neutral-800 dark:border-neutral-800"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-rose-500 hover:bg-rose-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
