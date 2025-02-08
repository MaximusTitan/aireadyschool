"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface ChatSession {
  id: string;
  email: string;
  prompt: string;
  response: string;
  timestamp: string;
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const fetchChatHistory = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/research-chat-history?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      const data = await response.json();
      setSessions(data.chatHistory);
    } catch (err) {
      setError("Error fetching chat history. Please try again.");
      console.error("Error fetching chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      fetchChatHistory(email);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              required
              className="flex-grow"
            />
            <Button type="submit">Fetch History</Button>
          </div>
        </form>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <ScrollArea className="h-[60vh] prose prose-sm max-w-none">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="mb-6 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-bold text-sm text-muted-foreground">
                  {new Date(session.timestamp).toLocaleString()}
                </p>
                <p className="mt-2 font-semibold">Prompt:</p>
                <p className="mt-1">{session.prompt}</p>
                <p className="mt-2 font-semibold">Response:</p>
                <div className="mt-1 prose prose-sm max-w-none">
                  <ReactMarkdown>{session.response}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              {email && !loading
                ? "No chat history found for this email."
                : "Enter your email and click 'Fetch History' to view your chat history."}
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
