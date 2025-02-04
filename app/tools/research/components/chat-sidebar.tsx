"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  X,
  MessageCircle,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you with any questions you might have about the research content.You can also ask me to modify the content by activating modify mode",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModifyMode, setIsModifyMode] = useState(false);

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

    try {
      setIsLoading(true);
      const userMessage: Message = { role: "user", content: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");

      if (isModifyMode) {
        await handleModification(input);
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
    const response = await fetch("/api/modify-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instruction,
        currentContent: initialContent,
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
    const response = await fetch("/api/research-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...messages, userMessage],
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

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: data.content },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Research Chat</h2>
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
          <div>
            {/* Add a button to open past research if you have that functionality */}
            {/* <Button onClick={onOpenPastResearch}>Open Past Research</Button> */}
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-grow p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg shadow max-w-[85%] ${
                    message.role === "user" ? "bg-white text-black" : "bg-white"
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
            ))}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </ScrollArea>
          <form onSubmit={handleSubmit} className="p-4 border-t">
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
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={toggleModifyMode}
                variant={isModifyMode ? "destructive" : "secondary"}
              >
                {isModifyMode ? "Cancel Modify" : "Modify Content"}
              </Button>
              {isModifyMode && (
                <span className="text-sm text-muted-foreground">
                  Modify mode active
                </span>
              )}
            </div>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </form>
        </>
      )}
    </div>
  );
}
