"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ResearchAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //const [noSearchResults, setNoSearchResults] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    //setNoSearchResults(false)

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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput("");

      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          email,
        }),
      });

      let data: any;
      let responseText: string = "";
      try {
        responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        console.error("Raw response:", responseText);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        console.error("Server response:", data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        console.error("Unsuccessful response:", data);
        throw new Error(data.error || "Failed to process research request");
      }

      //if (data.noSearchResults) {
      //  setNoSearchResults(true)
      //}

      if (!data.content) {
        console.error("Missing content in response:", data);
        throw new Error("No content received from the server");
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: data.content,
        },
      ]);
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
      setMessages((prevMessages) => prevMessages.slice(0, -1)); // Remove the failed message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </Alert>
        )}
        {/*noSearchResults && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Specific Research Found</AlertTitle>
            <AlertDescription>
              We couldn't find recent research on this topic. The response is based on general knowledge.
            </AlertDescription>
          </Alert>
        )*/}
        <ScrollArea className="h-[70vh] mb-4 p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-inner">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-6 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-5 rounded-xl shadow-lg max-w-[85%] border ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400"
                    : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm font-medium">{message.content}</p>
                ) : (
                  <ReactMarkdown className="prose prose-sm max-w-none prose-headings:text-blue-600 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:text-black prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:my-2 prose-li:my-0 prose-li:text-black">
                    {message.content}
                  </ReactMarkdown>
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
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email..."
            className="flex-grow py-3 px-4 text-base border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg shadow-sm transition-all duration-200 ease-in-out"
            required
          />
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a research topic..."
            disabled={isLoading}
            className="flex-grow py-6 px-4 text-lg border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg shadow-sm transition-all duration-200 ease-in-out"
            required
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || !email.trim()}
            className="w-full py-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching
              </>
            ) : (
              "Research"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
