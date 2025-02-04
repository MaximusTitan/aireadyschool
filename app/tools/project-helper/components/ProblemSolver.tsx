"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { generateChatResponse } from "../actions/ai";
import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Message } from "../types";

interface AssistantData {
  topic: string;
  specificGoals: string;
  timeAvailable: string;
}

export default function ProblemSolver({
  assistantData,
}: {
  assistantData?: AssistantData;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const chatContainer = document.querySelector(".overflow-y-auto");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (assistantData) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Hello! I'm your project assistant for the project about ${assistantData.topic}. Your specific learning goals are: ${assistantData.specificGoals}. You have ${assistantData.timeAvailable} available for this project. How can I help you get started?`,
        },
      ]);
    } else {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Hello! I'm your project assistant. How can I help you today?",
        },
      ]);
    }
  }, [assistantData]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const assistantResponse = await generateChatResponse(updatedMessages);
      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: assistantResponse,
        },
      ];
      setMessages(finalMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        "An error occurred while processing your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-[600px] overflow-hidden">
      <Card className="flex-grow overflow-hidden mb-4">
        <CardContent className="p-4 h-full overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"} w-full`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.role === "user" ? "bg-gray-100" : "bg-gray-300"
                } text-gray-800 ${message.role === "user" ? "ml-auto text-left" : "mr-auto"} max-w-[80%]`}
              >
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your project..."
          className="flex-grow resize-none"
          rows={2}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(input);
            }
          }}
        />
        <Button onClick={() => handleSendMessage(input)} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
