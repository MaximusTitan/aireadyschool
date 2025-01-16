"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/client"; // Added

const supabase = createClient(); // Added

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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
        fetchChatHistory(user.email); // Fetch history on load
      } else {
        setError("User not authenticated");
      }
    };
    fetchUser();
  }, []);

  const fetchChatHistory = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/chat-history?email=${encodeURIComponent(email)}`
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

  return (
    <Card className="w-full max-w-2xl p-4">
      <CardContent className="p-4">
        {error && <p className="text-gray-500 mb-4">{error}</p>}

        <ScrollArea className="h-[60vh] p-4 bg-gray-50 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="mb-6 p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="font-bold text-sm text-gray-700">
                  {new Date(session.timestamp).toLocaleString()}
                </p>
                <p className="mt-2 font-semibold text-gray-800">Prompt:</p>
                <p className="mt-1 text-gray-700">{session.prompt}</p>
                <p className="mt-2 font-semibold text-gray-800">Response:</p>
                <div className="mt-1 prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{session.response}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              {userEmail && !loading
                ? "No chat history found for this email."
                : "User email not available."}
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
