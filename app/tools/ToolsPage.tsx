"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageCircle, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

interface ToolCardProps {
  title: string;
  description: string;
  route: string;
  isHot?: boolean;
  isComingSoon?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  route,
  isHot = false,
  isComingSoon = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (!isComingSoon) {
      router.push(route);
    }
  };

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserRole(user.user_metadata.role ?? null);
      }
    };

    fetchUser();
  }, []);

  return (
    <Card
      className="group hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-purple-100/60 transition-all duration-200 cursor-pointer dark:bg-neutral-900 dark:border-neutral-800 dark:hover:from-neutral-900 dark:hover:to-purple-900/20"
      onClick={handleClick}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold dark:text-neutral-100">
            {title}
          </CardTitle>
          {isHot && (
            <span className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-600 rounded-full dark:bg-neutral-950 dark:text-neutral-300">
              HOT
            </span>
          )}
          {isComingSoon && (
            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-600 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {!isComingSoon && (
              <button className="text-xs px-3 py-1 bg-neutral-800 text-white rounded-full hover:bg-neutral-600 transition-colors dark:bg-neutral-600 dark:hover:bg-neutral-700">
                Try Now
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ChatMessage {
  text: string;
  isUser: boolean;
  naturalLanguageResponse?: string;
  error?: string;
}

const ToolsPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [defaultMessage, setDefaultMessage] = useState(
    "Hi, ask me anything about your company's data using natural language."
  );

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserRole(user.user_metadata.role ?? null);
      }
    };

    fetchUser();
  }, []);

  const categories: {
    [key: string]: {
      title: string;
      description: string;
      route: string;
      isHot?: boolean;
      isComingSoon?: boolean;
    }[];
  } = {
    Student: [
      {
        title: "Assessment Generator",
        description:
          "Create and share interactive multiple choice questions for students",
        route: "/tools/mcq-generator",
      },
      {
        title: "Study Plan Generator",
        description: "Plan your study schedule",
        route: "/tools/study-planner",
        isComingSoon: true,
      },
      {
        title: "Evaluator",
        description: "Evaluate student answers",
        route: "/tools/evaluator",
      },
      {
        title: "Text Tools",
        description:
          "Rewrite, proofread, translate, generate questions, expand, summarize texts",
        route: "/tools/text-tools",
      },
      {
        title: "Comic Strip Generator",
        description: "Generate comics",
        route: "/tools/comic-generator",
      },
      {
        title: "Research Assistant",
        description: "Get help with your research",
        route: "/tools/research",
      },
      {
        title: "Project Helper",
        description: "Get help with your projects",
        route: "/tools/project-helper",
      },
      {
        title: "Lesson Content Generator",
        description: "Generate lesson content",
        route: "/tools/lesson-content-generator",
      },
      {
        title: "YouTube Summary",
        description: "Generate questions and summaries from YouTube videos",
        route: "/tools/youtube-assistant",
      },
      {
        title: "Talk to PDF Docs",
        description:
          "Powerful RAG-based document chat system for intelligent document interactions",
        route: "/tools/chat-with-docs",
        isHot: true,
      },
      {
        title: "Image Generator",
        description: "Create stunning images with Flux AI technology",
        route: "/tools/image-generator",
        isHot: true,
      },
      {
        title: "Video Generator",
        description: "Generate videos from images",
        route: "/tools/video-generator",
      },
      {
        title: "Presentation Generator",
        description: "Create presentations",
        route: "/tools/presentation",
        isHot: true,
      },
      {
        title: "Video Story Generator",
        description: "Generate video stories from text",
        route: "/tools/video-story-generator",
        isComingSoon: true,
      },
    ],
    Teacher: [
      {
        title: "Lesson Plan Generator",
        description: "Create lesson plans",
        route: "/tools/lesson-planner",
      },
      {
        title: "Evaluator",
        description: "Evaluate student answers",
        route: "/tools/evaluator",
      },
      {
        title: "Text Tools",
        description:
          "Rewrite, proofread, translate, generate questions, expand, summarize texts",
        route: "/tools/text-tools",
      },
      {
        title: "Teachable Machine",
        description: "Train a machine learning model",
        route: "/tools/teachable-machine",
      },
      {
        title: "Assessment Generator",
        description: "Create interactive assessments",
        route: "/tools/mcq-generator",
      },
      {
        title: "Personalized Learning Plan",
        description: "Plan individualized education for students",
        route: "/tools/plp",
      },
      {
        title: "YouTube Summary",
        description: "Video summaries and questions",
        route: "/tools/youtube-assistant",
      },
      {
        title: "Talk to PDF Docs",
        description: "Document chat system",
        route: "/tools/chat-with-docs",
        isHot: true,
      },
      {
        title: "Assignment Generator",
        description: "Generate assignments",
        route: "/tools/assignment-generator",
      },
      {
        title: "Lesson Content Generator",
        description: "Create lesson content",
        route: "/tools/lesson-content-generator",
      },
      {
        title: "Image Generator",
        description: "Create stunning images",
        route: "/tools/image-generator",
        isHot: true,
      },
      {
        title: "Video Generator",
        description: "Generate videos from images",
        route: "/tools/video-generator",
      },
      {
        title: "Video Story Generator",
        description: "Generate video stories from text",
        route: "/tools/video-story-generator",
        isComingSoon: true,
      },
      {
        title: "Presentation Generator",
        description: "Create presentations",
        route: "/tools/presentation",
        isHot: true,
      },
    ],
    School: [
      {
        title: "Text Tools",
        description:
          "Rewrite, proofread, translate, generate questions, expand, summarize texts",
        route: "/tools/text-tools",
      },
      {
        title: "YouTube Summary",
        description: "Video summaries and questions",
        route: "/tools/youtube-assistant",
      },
      {
        title: "Talk to PDF Docs",
        description: "Document chat system",
        route: "/tools/chat-with-docs",
        isHot: true,
      },
      {
        title: "Image Generator",
        description: "Create stunning images",
        route: "/tools/image-generator",
        isHot: true,
      },
      {
        title: "Video Generator",
        description: "Generate videos from images",
        route: "/tools/video-generator",
      },
      {
        title: "Video Story Generator",
        description: "Generate video stories from text",
        route: "/tools/video-story-generator",
        isComingSoon: true,
      },
      {
        title: "Assignment Generator",
        description: "Generate assignments",
        route: "/tools/assignment-generator",
      },
      {
        title: "Lesson Content Generator",
        description: "Create lesson content",
        route: "/tools/lesson-content-generator",
      },
      {
        title: "Presentation Generator",
        description: "Create presentations",
        route: "/tools/presentation",
        isHot: true,
      },
      {
        title: "School Intelligence",
        description: "Get insights about your school",
        route: "/tools/school-intelligence",
        isComingSoon: true,
      },
    ],
  };

  const tools =
    userRole === "Admin"
      ? Object.values(categories)
          .flat()
          .filter(
            (tool, index, self) =>
              index === self.findIndex((t) => t.route === tool.route)
          )
      : (userRole ? categories[userRole] : []) || [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && messages.length === 0) {
      setMessages([{ text: defaultMessage, isUser: false }]);
    }
  };

  const sendMessage = async () => {
    if (message.trim()) {
      setMessages((prev) => [...prev, { text: message, isUser: true }]);
      setMessage("");

      try {
        const response = await fetch("/api/processSqlQuery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: message }),
        });
        const processedResult = await response.json();

        if (processedResult.success) {
          setMessages((prev) => [
            ...prev,
            {
              text:
                processedResult.naturalLanguageResponse ||
                "No response generated.",
              isUser: false,
              naturalLanguageResponse: processedResult.naturalLanguageResponse,
            },
          ]);
        } else {
          throw new Error(
            processedResult.error ||
              "Unknown error occurred while processing the query."
          );
        }
      } catch (error) {
        console.error("Error processing query:", error);
        setMessages((prev) => [
          ...prev,
          {
            text: `An error occurred while processing your query: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
            isUser: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(250,220,255,0.3)_35%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle,rgba(0,0,0,0.3)_0%,rgba(50,0,55,0.3)_35%,rgba(0,0,0,0.3)_100%)] dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-neutral-950 dark:text-neutral-100">
              AI Tools
            </h1>
            {userRole && (
              <span className="ml-4 text-sm text-neutral-600 dark:text-neutral-300">
                ({userRole})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-500 transition-colors dark:bg-neutral-500 dark:hover:bg-neutral-600">
              All Tools
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 h-4 w-4" />
              <Input
                className="pl-10 w-64 dark:bg-neutral-900 dark:border-neutral-800 dark:placeholder-neutral-400"
                placeholder="Search tools..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              route={tool.route}
              isHot={tool.isHot}
              isComingSoon={tool.isComingSoon}
            />
          ))}
        </div>
        {/* Chat Bubble */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={toggleChat}
            className="bg-purple-300 hover:bg-purple-400 text-white rounded-full p-3 shadow-lg transition-colors duration-200"
          >
            <MessageCircle size={24} />
          </button>
        </div>

        {/* Chat Dialog */}
        {isChatOpen && (
          <div className="fixed bottom-20 right-4 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
            <div className="p-4 border-b dark:border-neutral-700 font-semibold">
              Chat
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${
                    msg.isUser
                      ? "bg-neutral-100 dark:bg-neutral-700"
                      : msg.error
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                  }`}
                >
                  {msg.text}
                  {msg.error && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <p className="text-xs font-semibold mb-1">Error:</p>
                      <pre className="text-xs overflow-x-auto">{msg.error}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t dark:border-neutral-700 flex">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g; first email in chat_history?"
                className="flex-grow px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-l-lg focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-purple-300 hover:bg-purple-400 text-white px-4 rounded-r-lg transition-colors duration-200"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
