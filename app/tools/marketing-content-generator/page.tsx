"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Megaphone,
  Video,
  Hash,
  Mail,
  TrendingUp,
  SearchIcon,
  Image,
} from "lucide-react";
import Link from "next/link";

export default function SchoolMarketingDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    {
      icon: <Megaphone className="w-10 h-10 text-blue-600" />,
      title: "School Event Announcements",
      description:
        "Generate engaging announcements for school events, activities, and important dates.",
      href: "/tools/marketing-content-generator/event-announcements",
    },
    {
      icon: <Video className="w-10 h-10 text-red-600" />,
      title: "School Promotional Video Script",
      description:
        "Create compelling video scripts to showcase your school's values and achievements.",
      href: "/tools/marketing-content-generator/video-script",
    },
    {
      icon: <Hash className="w-10 h-10 text-purple-600" />,
      title: "School Social Media Posts",
      description:
        "Generate engaging social media content to connect with students and parents.",
      href: "/tools/marketing-content-generator/social-media-posts",
    },
    {
      icon: <Mail className="w-10 h-10 text-green-600" />,
      title: "School Newsletter Generator",
      description:
        "Create informative newsletters to keep parents, students, and staff updated on school activities.",
      href: "/tools/marketing-content-generator/newsletter-generator",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-indigo-600" />,
      title: "Education Trend Analyzer",
      description: "Identify trending topics and approaches in education.",
      href: "/tools/marketing-content-generator/trend-analyzer",
    },
    {
      icon: <SearchIcon className="w-10 h-10 text-pink-600" />,
      title: "Education SEO Keywords",
      description:
        "Research keywords for school website optimization and content strategy.",
      href: "/tools/marketing-content-generator/keyword-research",
    },
    {
      icon: <Image className="w-10 h-10 text-orange-600" />,
      title: "School Marketing Poster",
      description:
        "Create professional posters for school events, admissions, and announcements.",
      href: "/tools/marketing-content-generator/marketing-poster",
    },
    {
      icon: <Video className="w-10 h-10 text-yellow-600" />,
      title: "YouTube Thumbnail Generator",
      description:
        "Create eye-catching thumbnails for your educational YouTube videos.",
      href: "/tools/marketing-content-generator/youtube-thumbnail-generator",
    },
  ];

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="container mx-auto px-4 py-4 flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-neutral-800">
              Marketing Content Generator
            </h1>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search tools..."
              className="w-full bg-white border-gray-300 pl-10 py-2 text-sm rounded-full placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <Link key={index} href={tool.href}>
              <Card className="group bg-white border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors duration-300">
                      {tool.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mt-4 relative z-10">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 relative z-10">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
