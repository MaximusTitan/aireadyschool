"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { initSupabase } from "@/utils/supabase";
import { categories } from "../config/toolCategories";

interface ToolCardProps {
  title: string;
  description: string;
  route: string;
  isHot?: boolean;
  isComingSoon?: boolean;
  icon: LucideIcon;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  route,
  isHot = false,
  isComingSoon = false,
  icon: Icon,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (!isComingSoon) {
      router.push(route);
    }
  };

  return (
    <Card
      className={`group border border-neutral-200 relative overflow-hidden hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:to-rose-100/60 
      transition-all duration-300 ease-in-out cursor-pointer 
      dark:bg-neutral-900 dark:border-neutral-800 dark:hover:from-neutral-900 dark:hover:to-rose-900/20
      ${isComingSoon ? "opacity-75" : ""}`}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-100/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            {title}
          </CardTitle>
          <Icon className="w-6 h-6 text-rose-500" />
        </div>
        <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-300 transition-colors line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="flex justify-end">
          {!isComingSoon && (
            <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <button
                className="text-xs px-4 py-1.5 bg-neutral-800 text-white rounded-full 
                hover:bg-rose-500 hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                dark:bg-neutral-700 dark:hover:bg-rose-600"
              >
                Try Now →
              </button>
            </div>
          )}
        </div>
        {isHot && (
          <span className="absolute bottom-0 left-0 px-2 py-1 ml-4 mb-4 text-xs font-semibold bg-rose-100 text-rose-600 rounded-full dark:bg-rose-900/50 dark:text-rose-300 animate-pulse">
            HOT
          </span>
        )}
        {isComingSoon && (
          <span className="absolute bottom-0 right-0 px-2 py-1 mr-2 mb-2 text-xs font-semibold bg-yellow-100 text-yellow-600 rounded-full dark:bg-yellow-900/50 dark:text-yellow-300">
            Coming Soon
          </span>
        )}
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

interface Tool {
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  isHot?: boolean;
  isComingSoon?: boolean;
}

type CategoryName = "Learning" | "Research" | "Creative" | "Tech" | "Marketing";

const ToolsPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [defaultMessage, setDefaultMessage] = useState(
    "Hi, ask me anything about your company's data using natural language."
  );
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null);
  const [supabaseKey, setSupabaseKey] = useState<string | null>(null);
  const [isPluginClicked, setIsPluginClicked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const getAllToolsWithCategories = useMemo(() => {
    const allTools: Record<CategoryName, Tool[]> = {
      Learning: [],
      Research: [],
      Creative: [],
      Tech: [],
      Marketing: [],
    };

    // For Admin, gather all tools from all roles and categories
    Object.values(categories).forEach((roleCategories) => {
      Object.entries(roleCategories).forEach(([category, categoryTools]) => {
        // Add tools to their respective categories, avoiding duplicates
        if (category in allTools) {
          // Type guard
          const categoryName = category as CategoryName;
          categoryTools.forEach((tool: Tool) => {
            if (
              !allTools[categoryName]?.some((t: Tool) => t.route === tool.route)
            ) {
              allTools[categoryName].push(tool);
            }
          });
        }
      });
    });

    return allTools;
  }, []);

  const tools = useMemo(() => {
    if (userRole === "Admin") {
      // For Admin, return all tools from all categories
      return Object.values(getAllToolsWithCategories).flat() as Tool[];
    }
    return userRole
      ? (Object.values(categories[userRole] || {}).flat() as Tool[])
      : [];
  }, [userRole, getAllToolsWithCategories]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryName | "All">(
    "All"
  );
  const categoryOptions: (CategoryName | "All")[] = [
    "All",
    "Learning",
    "Research",
    "Creative",
    "Tech",
    "Marketing",
  ];

  const filteredTools = useMemo(() => {
    let filtered = tools;

    if (searchQuery) {
      filtered = filtered.filter(
        (tool: Tool) =>
          tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeCategory !== "All") {
      if (userRole === "Admin") {
        // For Admin, filter based on the getAllToolsWithCategories structure
        filtered =
          getAllToolsWithCategories[activeCategory as CategoryName] || [];
      } else if (userRole && categories[userRole]) {
        filtered = filtered.filter((tool: Tool) => {
          return categories[userRole][activeCategory as CategoryName]?.some(
            (t: Tool) => t.route === tool.route
          );
        });
      }
    }

    return filtered;
  }, [tools, searchQuery, activeCategory, userRole, getAllToolsWithCategories]);

  const hasCategoryTools = (category: CategoryName | "All") => {
    if (category === "All") return true;

    if (userRole === "Admin") {
      return getAllToolsWithCategories[category]?.length > 0;
    }

    if (userRole && categories[userRole]) {
      return categories[userRole][category]?.length > 0;
    }

    return false;
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
        const response = await fetch(
          isPluginClicked ? "/api/query-database" : "/api/processSqlQuery",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: message,
              supabaseUrl: supabaseUrl,
              supabaseKey: supabaseKey,
            }),
          }
        );
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

  const handleDatabaseSelection = async (database: string) => {
    setSelectedDatabase(database);

    // Fetch the corresponding supabase_url and anon_key for the selected database
    const supabase = createClient();
    const { data, error } = await supabase
      .from("connected_db")
      .select("supabase_url, anon_key")
      .eq("database_name", database)
      .single();

    if (error) {
      console.error("Error fetching database details:", error);
    } else if (data) {
      setSupabaseUrl(data.supabase_url);
      setSupabaseKey(data.anon_key);
      // Initialize Supabase with the fetched URL and key
      initSupabase(data.supabase_url, data.anon_key);
    }
  };

  useEffect(() => {
    const fetchDatabases = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("connected_db")
        .select("database_name");
      if (error) {
        console.error("Error fetching databases:", error);
      } else {
        setDatabases(data.map((db) => db.database_name));
      }
    };

    fetchDatabases();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f3f2] bg-cover bg-center bg-no-repeat dark:bg-[radial-gradient(circle,rgba(0,0,0,0.3)_0%,rgba(55,0,20,0.3)_35%,rgba(0,0,0,0.3)_100%)] dark:bg-neutral-950">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex mb-4 pt-4">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-neutral-950 dark:text-neutral-100">
              AI Apps
            </h1>
            {userRole && (
              <span className="ml-4 text-sm text-neutral-600 dark:text-neutral-300 self-end mb-1">
                ({userRole})
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {categoryOptions.map(
                (category) =>
                  hasCategoryTools(category) && (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeCategory === category
                          ? "bg-neutral-800 text-white dark:bg-neutral-500"
                          : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {category}
                    </button>
                  )
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 h-4 w-4" />
              <Input
                className="pl-10 w-64 bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:placeholder-neutral-400"
                placeholder="Search tools..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              route={tool.route}
              isHot={tool.isHot}
              isComingSoon={tool.isComingSoon}
              icon={tool.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
