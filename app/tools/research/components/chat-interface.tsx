"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ResearchEntry } from "../types";

interface ChatInterfaceProps {
  selectedResearch?: ResearchEntry;
  onSubmitQuery: (query: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInterface({ selectedResearch, onSubmitQuery, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  
  // Reset input and expanded messages when selectedResearch changes
  useEffect(() => {
    if (!selectedResearch) {
      setInput("");
      setExpandedMessages({});
      console.log("Clearing chat state - new research initiated");
    }
  }, [selectedResearch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedResearch?.conversation]);

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // Small delay to ensure the DOM has updated
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    setInput("");

    // Let the parent handle adding the message to the conversation
    await onSubmitQuery(query);
  };

  // Render with explicit null check
  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      {/* Chat messages area */}
      <ScrollArea className="flex-1 p-4">
        {selectedResearch && selectedResearch.conversation && selectedResearch.conversation.length > 0 ? (
          <div className="space-y-4">
            {selectedResearch.conversation.map((message, index) => {
              const messageId = `msg-${index}`;
              const isExpanded = expandedMessages[messageId] || false;
              const needsExpansion = message.role === "assistant" && message.content.length > 150;

              return (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className={`h-8 w-8 flex-shrink-0 flex items-center justify-center bg-white border ${message.role === "user" ? "border-rose-500" : "border-rose-500"}`}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Bot className="h-4 w-4 text-rose-500" />
                      )}
                    </Avatar>

                    <div
                      className={`p-3 rounded-lg shadow-sm ${
                        message.role === "user"
                          ? "bg-rose-50 text-gray-800 rounded-tr-none"
                          : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                      }`}
                    >
                      {message.role === "assistant" && needsExpansion ? (
                        <div className="relative">
                          <div className={`prose prose-sm max-w-none overflow-hidden ${!isExpanded ? 'line-clamp-3' : ''}`}>
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                  />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleMessageExpansion(messageId)}
                            className="text-xs text-gray-500 hover:text-gray-700 mt-1 flex items-center"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" /> 
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" /> 
                                Show more
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <ReactMarkdown
                          className="prose prose-sm max-w-none"
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start a new conversation</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg mt-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            <p className="text-sm text-gray-500">Researching...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a research question..."
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}