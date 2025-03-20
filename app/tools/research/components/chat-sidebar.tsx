"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  X,
  MessageCircle,
  AlertCircle,
  PlusCircle,
  User,
  Bot,
  Send,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatSidebarProps {
  initialContent: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMainContent: (newContent: string) => void;
  onNewResearch: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatSidebar({
  initialContent,
  isOpen,
  onClose,
  onUpdateMainContent,
  onNewResearch,
}: ChatSidebarProps) {
  // Store messages in localStorage to persist across research sessions for the same content
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load previous messages for this content from localStorage
    const contentHash = hashContent(initialContent);
    const savedMessages = localStorage.getItem(`chat_messages_${contentHash}`);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return Array.isArray(parsed) ? parsed : [getWelcomeMessage()];
      } catch (e) {
        return [getWelcomeMessage()];
      }
    } else {
      return [getWelcomeMessage()];
    }
  });
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to create a simple hash of content for storage
  const hashContent = (content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };
  
  const getWelcomeMessage = (): Message => ({
    role: "assistant",
    content: "Hello! I'm here to help you with any questions you might have about the research content. You can also ask me to modify the content by activating modify mode."
  });

  // Save messages to localStorage when they change
  useEffect(() => {
    if (initialContent && messages.length > 0) {
      const contentHash = hashContent(initialContent);
      localStorage.setItem(`chat_messages_${contentHash}`, JSON.stringify(messages));
    }
  }, [messages, initialContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const toggleModifyMode = () => {
    setIsModifyMode(!isModifyMode);
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) return;

    // Create user message from input
    const userMessage: Message = { role: "user", content: input };
    
    // Immediately add user message to chat
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Clear input field right away to give immediate feedback
    setInput("");
    
    // Scroll to bottom to show new message
    setTimeout(scrollToBottom, 50);

    try {
      setIsLoading(true);

      if (isModifyMode) {
        await handleModification(userMessage.content);
        setIsModifyMode(false);
      } else {
        await handleNormalChat(userMessage);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleModification = async (instruction: string) => {
    // Send all previous messages to maintain context
    const response = await fetch("/api/modify-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instruction,
        currentContent: initialContent,
        chatHistory: messages, // Send full chat history for context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    onUpdateMainContent(data.modifiedContent);
    
    // Add assistant message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content:
          "I've updated the main content based on your instructions. Is there anything else you'd like me to do?",
      },
    ]);
  };

  const handleNormalChat = async (userMessage: Message) => {
    // Include entire message history for context
    const response = await fetch("/api/research-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...messages, userMessage], // Send full chat history
        initialContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Add assistant message
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: data.content },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg flex flex-col z-40 border-l border-gray-200">
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold">Research Chat</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {!initialContent ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Research Open</AlertTitle>
            <AlertDescription>
              Please open an existing research or create a new one to use the
              chat assistant.
            </AlertDescription>
          </Alert>
          <Button onClick={onNewResearch} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Research
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-grow p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message, index) => (
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
                    <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-rose-100" : "bg-blue-100"}`}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-rose-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-blue-600" />
                      )}
                      <AvatarFallback>
                        {message.role === "user" ? "U" : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div
                      className={`p-3 rounded-lg shadow-sm ${
                        message.role === "user"
                          ? "bg-rose-50 text-gray-800 rounded-tr-none"
                          : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                      }`}
                    >
                      <ReactMarkdown
                        className="prose prose-sm max-w-none prose-p:my-0 prose-p:leading-normal break-words whitespace-pre-wrap overflow-hidden"
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
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm max-w-[80%] animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSubmit}>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    isModifyMode
                      ? "Enter modification instructions..."
                      : "Ask a question..."
                  }
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                      }
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  onClick={toggleModifyMode}
                  variant={isModifyMode ? "destructive" : "secondary"}
                  size="sm"
                  className={isModifyMode ? "" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}
                >
                  {isModifyMode ? "Cancel Modify" : "Modify Content"}
                </Button>
                {isModifyMode && (
                  <span className="text-sm text-rose-600 font-medium animate-pulse">
                    Modify mode active
                  </span>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
