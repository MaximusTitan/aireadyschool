"use client";

import React, { useState } from "react";
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
            <span className="px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-600 rounded-full dark:bg-rose-950 dark:text-rose-300">
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
            <button className="text-xs px-3 py-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors dark:bg-rose-600 dark:hover:bg-rose-700">
              Try Now
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ToolsPage = () => {
  const tools = [
    {
      title: "Chat With Docs",
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
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      isHot: true,
    },
    {
      title: "Text Tools",
      description:
        "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
    },
    {
      title: "MCQ Generator",
      description:
        "Create and share interactive multiple choice questions for students",
      route: "/tools/mcq-generator",
    },
    {
      title: "Lesson Plan Creator",
      description: "Create lesson plans",
      route: "/tools/lesson-planner",
    },
    {
      title: "Comic Generator",
      description: "Generate comics",
      route: "/tools/comic-generator",
    },
    {
      title: "YouTube Assistant",
      description: "Generate questions and summaries from YouTube videos",
      route: "/tools/youtube-assistant",
    },
    {
      title: "Talk with Buddy",
      description: "Chat with an AI buddy",
      route: "/tools/audiobot",
    },
    {
      title: "Personalized Lessons",
      description: "Create personalized lessons for students",
      route: "/tools/personalized-lessons",
    },
    {
      title: "Research Assistant",
      description: "Get help with your research",
      route: "/tools/research-assistant",
    },
    {
      title: "Study Planner",
      description: "Plan your study schedule",
      route: "/tools/study-planner",
    },
    {
      title: "Evaluator",
      description: "Evaluate student answers",
      route: "/tools/evaluator",
    },
    {
      title: "Project Helper",
      description: "Get help with your projects",
      route: "/tools/project-helper",
    },
    {
      title: "Individualized Education Planner",
      description: "Plan individualized education for students",
      route: "/tools/individualized-education-planner",
    },
    {
      title: "Content Generator",
      description: "Image, Video and Story Generator",
      route: "/tools/content-generator",
    },
    {
      title: "Marketing Content Generator",
      description: "Generate marketing content",
      route: "/tools/marketing-content-generator",
    },
    {
      title: "Report Generator",
      description: "Generate reports",
      route: "/tools/report-generator",
    },
    {
      title: "School Intelligence",
      description: "Get insights about your school",
      route: "/tools/school-intelligence",
    },
  ];

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
            <button className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors dark:bg-rose-600 dark:hover:bg-rose-700">
              All Tools
            </button>
            <button className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800">
              Favorites
            </button>
            <button className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800">
              Recent
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
