import React from "react";
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
  isHot?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  isHot = false,
}) => (
  <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
    <CardHeader className="space-y-1">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {isHot && (
          <span className="px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-600 rounded-full">
            HOT
          </span>
        )}
      </div>
      <CardDescription className="text-sm text-gray-500">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex justify-end">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-xs px-3 py-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors">
            Try Now
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ToolsPage = () => {
  const tools = [
    {
      title: "Chat With Docs",
      description:
        "Powerful RAG-based document chat system for intelligent document interactions",
      isHot: true,
    },
    {
      title: "Image Generator",
      description: "Create stunning images with Flux AI technology",
      isHot: true,
    },
    {
      title: "Text Tools",
      description:
        "Rewrite, proofread, translate, generate questions, expand, summarize texts",
    },
    {
      title: "MCQ Generator",
      description:
        "Create and share interactive multiple choice questions for students",
    },
    {
      title: "YouTube Assistant",
      description: "Generate questions and summaries from YouTube videos",
    },
    {
      title: "Custom ChatBot",
      description: "Build your own chatbot with customizable system prompts",
    },
    {
      title: "Idea Generator",
      description: "Generate and expand creative ideas for your projects",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10 w-64"
                placeholder="Search tools..."
                type="search"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
              All Tools
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Favorites
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Recent
            </button>
          </div>
          <Select defaultValue="popular">
            <SelectTrigger className="w-[180px]">
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
          {tools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              isHot={tool.isHot}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
