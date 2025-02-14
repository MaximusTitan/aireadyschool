"use client";
import { useState, useRef, useEffect } from "react";
import { FaUser, FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { formatTime } from "@/app/utils/dateFormat";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello there! I'm an AI tutor. Ask me anything about any subject.",
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
    const userMessage = {
      text: inputText,
      isBot: false,
      timestamp: currentTime,
    };

    setInputText(""); // Moved here to clear input immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/learn-science", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputText,
          messages: messages.concat(userMessage),
        }),
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
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-4 h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col">
        <div className="bg-neutral-800 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-extrabold">AI Tutor</h1>
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
                    className={`p-2 rounded-lg ${
                      message.isBot
                        ? "bg-neutral-100 text-neutral-800"
                        : "bg-white text-neutral-800 border border-neutral-200"
                    }`}
                  >
                    <ReactMarkdown
                      className={`prose prose-lg max-w-none ${
                        !message.isBot && "prose-neutral"
                      }`}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-0.5 text-base">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc ml-4 mb-0.5 text-base">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal ml-4 mb-0.5 text-base">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-0.5 text-base">{children}</li>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-extrabold mb-0.5">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold mb-0.5">
                            {children}
                          </h2>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
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
              placeholder="Ask anything about any subject..."
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
