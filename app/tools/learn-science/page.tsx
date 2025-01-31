"use client";
import { useState, useRef, useEffect } from "react";
import { FaUser, FaRobot } from "react-icons/fa";
import { formatTime } from "@/app/utils/dateFormat";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string; // Changed from Date to string
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your Science teacher. I'm here to help you learn Science concepts in an interactive way. What would you like to learn about today?",
      isBot: true,
      timestamp: formatTime(new Date()), // Format timestamp at creation
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const currentTime = formatTime(new Date());

    setMessages((prev) => [
      ...prev,
      {
        text: inputText,
        isBot: false,
        timestamp: currentTime,
      },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/system-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.text,
          isBot: true,
          timestamp: formatTime(new Date()),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          isBot: true,
          timestamp: formatTime(new Date()),
        },
      ]);
    } finally {
      setIsLoading(false);
      setInputText("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col">
        <div className="bg-neutral-800 text-white p-4 rounded-t-lg">
          <h1 className="text-xl font-bold">Science Learning Assistant</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex max-w-[80%] ${message.isBot ? "flex-row" : "flex-row-reverse"}`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.isBot
                      ? "bg-neutral-100 mr-2"
                      : "bg-neutral-800 ml-2"
                  }`}
                >
                  {message.isBot ? (
                    <FaRobot className="text-neutral-600" />
                  ) : (
                    <FaUser className="text-white" />
                  )}
                </div>
                <div
                  className={`flex flex-col ${message.isBot ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      message.isBot
                        ? "bg-neutral-100 text-neutral-800"
                        : "bg-neutral-800 text-white"
                    }`}
                  >
                    {message.text}
                  </div>
                  <span className="text-xs text-neutral-500 mt-1">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-neutral-500">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4 bg-neutral-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Ask anything about Science..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 
                transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
