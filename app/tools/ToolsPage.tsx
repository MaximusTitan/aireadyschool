"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  route,
  isHot = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(route);
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
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer dark:bg-neutral-900 dark:border-neutral-800"
      onClick={handleClick}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold dark:text-neutral-100">
            {title}
          </CardTitle>
          {isHot && (
            <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-600 rounded-full dark:bg-purple-950 dark:text-purple-300">
              HOT
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
            <button className="text-xs px-3 py-1 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors dark:bg-purple-600 dark:hover:bg-purple-700">
              Try Now
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ToolsPage = () => {
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

  const categories: {
    [key: string]: {
      title: string;
      description: string;
      route: string;
      isHot?: boolean;
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
        title: "Assessment Generator",
        description: "Create interactive assessments",
        route: "/tools/mcq-generator",
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
        title: "Individualized Education Planner",
        description: "Plan individualized education for students",
        route: "/tools/iep",
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
      },
      {
        title: "Presentation Generator",
        description: "Create presentations",
        route: "/tools/presentation",
        isHot: true,
      },
      {
        title: "Marketing Content Generator",
        description: "Generate marketing content",
        route: "/tools/marketing-content-generator",
      },
      {
        title: "School Intelligence",
        description: "Get insights about your school",
        route: "/tools/school-intelligence",
      },
    ],
  };

  const tools =
    userRole === "Admin"
      ? Object.values(categories).flat()
      : (userRole ? categories[userRole] : []) || [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-100">
            AI Tools
            {userRole && (
              <span className="ml-4 text-sm text-neutral-600 dark:text-neutral-300">
                ({userRole})
              </span>
            )}
          </h1>
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

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors dark:bg-purple-500 dark:hover:bg-purple-600">
              All Tools
            </button>
          </div>
          <Select defaultValue="popular">
            <SelectTrigger className="w-[180px] dark:border-neutral-800 dark:bg-neutral-900">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              route={tool.route}
              isHot={tool.isHot}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
