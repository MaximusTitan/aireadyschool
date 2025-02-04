"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Download, Send, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { downloadAsPDF, downloadAsDOC } from "../utils/fileDownload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorBoundary } from "react-error-boundary";
import { Message, ResearchEntry } from "../types";

const animations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInFromBottom {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-slide-in {
    animation: slideInFromBottom 0.3s ease-out;
  }
  .hover-pulse:hover {
    animation: pulse 0.3s ease-in-out;
  }
  .transition-all {
    transition: all 0.3s ease;
  }
`;

const centerPlaceholder = `
  .center-placeholder::placeholder {
    text-align: center;
  }
`;

interface ResearchAssistantProps {
  onContentUpdate: (content: string) => void;
  initialResearch?: ResearchEntry;
  onNewResearch: () => void;
}

export function ResearchAssistant({
  onContentUpdate,
  initialResearch,
  onNewResearch,
}: ResearchAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordLimit, setWordLimit] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModificationMode, setIsModificationMode] = useState(false);
  const [currentResearchId, setCurrentResearchId] = useState<string | null>(
    null
  );
  const [contentGenerated, setContentGenerated] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialResearch) {
      setMessages(initialResearch.conversation || []);
      setEmail(initialResearch.email || "");
      setCurrentResearchId(initialResearch.id || null);
      setContentGenerated(true);
    } else {
      setMessages([]);
      setEmail("");
      setCurrentResearchId(null);
      setContentGenerated(false);
    }
  }, [initialResearch]);

  useEffect(() => {
    const savedTitle = localStorage.getItem("researchTitle");
    if (savedTitle) {
      setPersistentTitle(savedTitle);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, chatContainerRef]); // Corrected dependency

  const saveTitleToLocalStorage = useCallback((title: string) => {
    localStorage.setItem("researchTitle", title);
    setPersistentTitle(title);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (wordLimit !== null && wordLimit < 150) {
      setError("Word limit should be either null or greater than 150.");
      return;
    }

    if (!input.trim()) {
      setError("Please enter a research topic");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setIsLoading(true);
      const newMessage: Message = { role: "user", content: input };
      setInput(""); // Clear input immediately after submission

      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [newMessage],
          email,
          ...(wordLimit !== null && { wordLimit }),
        }),
      });

      let data;
      let responseText;
      try {
        responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        throw new Error(`Failed to parse server response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.content) {
        throw new Error("No content received from the server");
      }

      const contentWithoutTitle = data.content.replace(/^#\s.*\n/, "").trim();
      const assistantMessage: Message = {
        role: "assistant",
        content: `${contentWithoutTitle}`,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        newMessage,
        assistantMessage,
      ]);
      onContentUpdate(assistantMessage.content);
      setCurrentResearchId(data.id);
      setContentGenerated(true);
      if (currentResearchId) {
        updateConversationHistory(data.id, [
          ...messages,
          newMessage,
          assistantMessage,
        ]);
      }
    } catch (error) {
      console.error("Error details:", error);
      let errorMessage =
        "An error occurred while processing your request. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!chatInput.trim()) {
      return;
    }

    try {
      setIsChatLoading(true);
      const userMessage: Message = { role: "user", content: chatInput };
      setMessages((prevMessages) => [...prevMessages, userMessage]);

      if (isModificationMode) {
        console.log("Calling modify content API");
        await handleModification(chatInput);
      } else {
        console.log("Calling research chat API");
        const response = await fetch("/api/research-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            initialContent: messages[messages.length - 1]?.content || "",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `API error: ${response.statusText}`);
        }

        if (!data.content) {
          throw new Error("No content received from the server");
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: data.content,
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      }

      // Save the updated conversation
      if (currentResearchId) {
        await updateConversationHistory(currentResearchId, messages);
      }

      setChatInput("");
      setIsModificationMode(false);
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      setError(errorMessage);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDownload = async (format: "pdf" | "doc", content: string) => {
    setIsDownloading(true);
    setError(null);
    try {
      const processedContent = processContent(content);
      if (format === "pdf") {
        await downloadAsPDF(processedContent);
      } else {
        await downloadAsDOC(processedContent);
      }
    } catch (error) {
      console.error(`Error downloading ${format.toUpperCase()}:`, error);
      let errorMessage = `Failed to download ${format.toUpperCase()}. Please try again.`;
      if (error instanceof Error) {
        errorMessage += ` Error: ${error.message}`;
      } else if (typeof error === "object" && error !== null) {
        errorMessage += ` Error: ${JSON.stringify(error)}`;
      }
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const processContent = (content: string) => {
    const lines = content.split("\n");
    const titleLine = lines.find((line) => line.startsWith("# "));
    const contentWithoutTitle = lines
      .filter((line) => !line.startsWith("# "))
      .join("\n");
    const processedContent = titleLine
      ? `${titleLine}\n\n${contentWithoutTitle}`
      : content;

    return processedContent
      .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace HTML entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
      .trim();
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const toggleModificationMode = () => {
    setIsModificationMode(!isModificationMode);
    setChatInput("");
  };

  const updateConversationHistory = async (
    id: string,
    conversation: Message[]
  ) => {
    try {
      const response = await fetch("/api/research", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          conversation: conversation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update conversation history");
      }
    } catch (error) {
      console.error("Error updating conversation history:", error);
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
        currentContent: messages[messages.length - 1]?.content || "",
        chatHistory: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    onContentUpdate(data.modifiedContent);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content: data.modifiedContent,
      },
    ]);
  };

  return (
    <>
      <style jsx global>
        {`
          .prose p[id^="ref"] {
            margin-bottom: 0.5em;
          }
          ${animations}
          ${centerPlaceholder}
          .prose a[href^="#ref"] {
            color: #2563eb;
            text-decoration: none;
          }
          .prose a[href^="#ref"]:hover {
            text-decoration: underline;
          }
          .prose a[href^="#ref"] {
            text-decoration: none;
          }
          .prose a[href^="#ref"]::before {
            content: "[";
          }
          .prose a[href^="#ref"]::after {
            content: "]";
          }
        `}
      </style>
      <style jsx global>{`
        .rounded-md,
        .rounded-lg,
        input,
        button {
          border-radius: 0.375rem !important;
        }
        .shadow-sm {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .bg-black {
          background-color: black !important;
        }
      `}</style>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        {contentGenerated ? (
          <div className="max-w-6xl mx-auto flex flex-col h-full p-4 shadow-lg rounded-lg overflow-hidden border border-black">
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col w-full">
                {error && (
                  <Alert
                    variant="destructive"
                    className="animate-slide-in mb-4"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="break-words">
                      {error}
                      {error ===
                        "Service temporarily unavailable. Please try again later." && (
                        <p className="mt-2">
                          The server might be experiencing high traffic or
                          maintenance. Please wait a few minutes and try again.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="bg-white rounded-lg p-4 mb-4 transition-all">
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3 w-2/3 mx-auto mb-4"
                  >
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                      required
                    />
                    <label
                      htmlFor="wordLimit"
                      className="text-sm font-medium text-gray-700 mb-1"
                    >
                      Word Limit (optional)
                    </label>
                    <Input
                      id="wordLimit"
                      type="number"
                      value={wordLimit === null ? "" : wordLimit}
                      onChange={(e) => {
                        const newValue =
                          e.target.value === ""
                            ? null
                            : Math.max(0, Number.parseInt(e.target.value, 10));
                        setWordLimit(newValue);
                      }}
                      placeholder="Word limit (optional)"
                      className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                    />
                    <label
                      htmlFor="prompt"
                      className="text-sm font-medium text-gray-700 mb-1"
                    >
                      Prompt
                    </label>
                    <Input
                      id="prompt"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter a research topic..."
                      disabled={isLoading}
                      className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim() || !email.trim()}
                      className="w-2/3 mx-auto transition-all hover:bg-gray-600 hover-pulse bg-gray-500 text-white rounded-md"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Researching
                        </>
                      ) : (
                        "Generate Research"
                      )}
                    </Button>
                  </form>
                  <div
                    ref={chatContainerRef}
                    className="mt-8 max-h-[60vh] overflow-y-auto pr-4"
                  >
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`
                          mb-8 
                          ${message.role === "user" ? "text-right" : "text-left"} 
                          animate-fade-in
                        `}
                      >
                        <div
                          className={`
                            inline-block p-5 rounded-xl max-w-[85%] border 
                            transition-all relative overflow-hidden
                            ${
                              message.role === "user"
                                ? "text-white border-blue-400 bg-gray-500"
                                : "border-gray-200 bg-gray-100"
                            }
                          `}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm font-medium text-white">
                              {message.content}
                            </p>
                          ) : (
                            <div
                              className="pr-10 pt-10 pb-4 relative"
                              style={{ wordWrap: "break-word" }}
                            >
                              {message.content ? (
                                <ReactMarkdown
                                  className="prose prose-sm max-w-none prose-headings:text-black prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:my-2 prose-li:my-0 prose-li:text-gray-800"
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    h1: ({ node, ...props }) => {
                                      // Filter out the "Modified Research Content" title
                                      const childArray = React.Children.toArray(
                                        props.children
                                      );
                                      if (
                                        childArray.length > 0 &&
                                        childArray[0] ===
                                          "Modified Research Content"
                                      ) {
                                        return null;
                                      }
                                      return (
                                        <h1
                                          {...props}
                                          className="text-3xl font-bold mb-6 text-black"
                                        />
                                      );
                                    },
                                    h2: ({ node, ...props }) => (
                                      <h2
                                        {...props}
                                        className="text-2xl font-bold mb-4 text-black"
                                      />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3
                                        {...props}
                                        className="text-xl font-bold mb-3 text-black"
                                      />
                                    ),
                                    h4: ({ node, ...props }) => (
                                      <h4
                                        {...props}
                                        className="text-lg font-bold mb-2 text-black"
                                      />
                                    ),
                                    h5: ({ node, ...props }) => (
                                      <h5
                                        {...props}
                                        className="text-base font-bold mb-1 text-black"
                                      />
                                    ),
                                    h6: ({ node, ...props }) => (
                                      <h6
                                        {...props}
                                        className="text-sm font-bold mb-1 text-black"
                                      />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p
                                        {...props}
                                        className="mb-4 transition-all hover:text-gray-900"
                                      />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul
                                        {...props}
                                        className="list-disc pl-5 mb-4"
                                      />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol
                                        {...props}
                                        className="list-decimal pl-5 mb-4"
                                      />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li
                                        {...props}
                                        className="mb-2 transition-all hover:text-gray-900"
                                      />
                                    ),
                                    a: ({ node, href, children, ...props }) => {
                                      const isCitation =
                                        href?.startsWith("#ref");
                                      return (
                                        <a
                                          {...props}
                                          href={href}
                                          target={
                                            isCitation ? "_self" : "_blank"
                                          }
                                          rel={
                                            isCitation
                                              ? ""
                                              : "noopener noreferrer"
                                          }
                                          className={`${isCitation ? "text-blue-600 no-underline" : "text-blue-600 underline"} hover:text-blue-800 cursor-pointer transition-all`}
                                        >
                                          {children}
                                        </a>
                                      );
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                <p className="text-gray-600">
                                  Generating research report...
                                </p>
                              )}
                              {message.role === "assistant" &&
                                message.content && (
                                  <div className="absolute top-2 right-2 flex space-x-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 bg-gray-500 text-white hover:bg-gray-600 transition-all rounded-full"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="animate-fade-in">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDownload(
                                              "pdf",
                                              message.content
                                            )
                                          }
                                          className="transition-all hover:bg-blue-100"
                                        >
                                          Download as PDF
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground bg-white p-4 rounded-lg shadow-md">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium">
                          Researching and generating report...
                        </span>
                      </div>
                    )}
                    {isChatLoading && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground bg-white p-4 rounded-lg shadow-md">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium">
                          Searching for information...
                        </span>
                      </div>
                    )}
                  </div>
                  {contentGenerated && (
                    <div className="mt-4 animate-fade-in">
                      <form
                        onSubmit={handleChatSubmit}
                        className="flex flex-col gap-3 mb-4"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={chatInput}
                            onChange={handleChatInputChange}
                            placeholder={
                              isModificationMode
                                ? "Enter modification instructions..."
                                : "Ask a question..."
                            }
                            disabled={isChatLoading}
                            className="flex-grow text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-lg border-gray-300 shadow-sm rounded-input-btn"
                          />
                          <Button
                            type="button"
                            onClick={toggleModificationMode}
                            className={`px-3 py-2 text-xs font-semibold ${
                              isModificationMode
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            } text-white rounded-lg transition-colors rounded-input-btn w-24 h-9`}
                          >
                            {isModificationMode ? (
                              <>
                                <Edit className="h-4 w-4 mr-1" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Edit className="h-4 w-4 mr-1" />
                                Modify
                              </>
                            )}
                          </Button>
                          <Button
                            type="submit"
                            disabled={isChatLoading || !chatInput.trim()}
                            className="px-3 py-2 text-xs font-semibold bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-colors rounded-input-btn w-24 h-9"
                          >
                            {isChatLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto h-auto">
            <div className="flex flex-col w-full h-auto">
              {error && (
                <Alert variant="destructive" className="animate-slide-in mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="break-words">
                    {error}
                    {error ===
                      "Service temporarily unavailable. Please try again later." && (
                      <p className="mt-2">
                        The server might be experiencing high traffic or
                        maintenance. Please wait a few minutes and try again.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <div className="bg-white rounded-lg p-4 mb-4 transition-all">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 w-2/3 mx-auto mb-4"
                >
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                    required
                  />
                  <label
                    htmlFor="wordLimit"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Word Limit (optional)
                  </label>
                  <Input
                    id="wordLimit"
                    type="number"
                    value={wordLimit === null ? "" : wordLimit}
                    onChange={(e) => {
                      const newValue =
                        e.target.value === ""
                          ? null
                          : Math.max(0, Number.parseInt(e.target.value, 10));
                      setWordLimit(newValue);
                    }}
                    placeholder="Word limit (optional)"
                    className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                  />
                  <label
                    htmlFor="prompt"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Prompt
                  </label>
                  <Input
                    id="prompt"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter a research topic..."
                    disabled={isLoading}
                    className="w-full text-sm text-left transition-all focus:ring-2 focus:ring-blue-500 rounded-md border-gray-300 shadow-sm"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || !email.trim()}
                    className="w-2/3 mx-auto transition-all hover:bg-gray-600 hover-pulse bg-gray-500 text-white rounded-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Researching
                      </>
                    ) : (
                      "Generate Research"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </>
  );
}

function setPersistentTitle(savedTitle: string) {
  throw new Error("Function not implemented.");
}
