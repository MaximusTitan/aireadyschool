"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateChatResponse } from "../actions/ai";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ProblemSolver({
  assistantData,
}: {
  assistantData: any;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your project assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (assistantData) {
      const initialMessage = `I'm working on a project about ${assistantData.topic}. My specific learning goals are: ${assistantData.specificGoals}. I have ${assistantData.timeAvailable} available for this project. Can you help me get started?`;
      handleSendMessage(initialMessage);
    }
  }, [assistantData]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const userMessage: Message = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const assistantResponse = await generateChatResponse([
        ...messages,
        userMessage,
      ]);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantResponse },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Could you please try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <Card className="flex-grow mb-4">
        <CardContent className="p-4">
          <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
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
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your project..."
          className="flex-grow"
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
