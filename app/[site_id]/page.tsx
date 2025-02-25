import React from "react";
import {
  ChevronRight,
  Book,
  Image as LucideImage,
  FileText,
  Layout,
  Video,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { readSiteById } from "@/utils/actions/readSiteById";
import { notFound } from "next/navigation";
import PublicPortfolio from "../portfolio/components/PublicPortfolio";

interface PageParams {
  site_id: string;
  slug: string;
}

const LandingPage = async ({ params }: { params: Promise<PageParams> }) => {
  const resolvedParams = await params;
  const siteId = parseInt(resolvedParams.site_id, 10);
  const { slug } = resolvedParams;

  if (isNaN(siteId)) {
    notFound();
  }

  const siteData = await readSiteById(siteId);

  if (!siteData) {
    notFound();
    return null;
  }

  const schoolName = `School ${siteData.site_id.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-rose-500">
                AI Ready {schoolName}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/sign-in`}>
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href={`/sign-up`}>
                <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                  Enroll Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 bg-gradient-to-b from-rose-50 to-white dark:from-neutral-900 dark:to-neutral-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-xl text-rose-500 mb-4">
              AI Ready School Network
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
              Welcome to {schoolName}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Part of the AI Ready School Network - Empowering students with
              AI-enhanced learning experiences
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 text-lg">
                Apply Now <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="border-rose-200 dark:border-rose-800 text-rose-500"
              >
                Schedule a Tour
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-4 dark:text-white">
          Our Programs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card
              key={tool.name}
              className="border-gray-100 dark:border-neutral-800"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                    <tool.icon className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{tool.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Public Portfolio Section */}
      <div className="container mx-auto px-4 py-24">
        <PublicPortfolio slug={slug} />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h4 className="text-xl font-bold text-rose-500">
              AI Ready {schoolName}
            </h4>
            <div className="mt-2 text-sm text-rose-400">
              Member of the AI Ready School Network
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {"Location information coming soon"}
            </p>
            <p className="mt-8 text-gray-600 dark:text-gray-300">
              © {new Date().getFullYear()} AI Ready School Network. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

const tools = [
  {
    name: "AI Lesson Planner",
    description:
      "Create personalized lesson plans using advanced AI algorithms.",
    icon: Book,
  },
  {
    name: "Content Generator",
    description: "Generate educational content and materials automatically.",
    icon: FileText,
  },
  {
    name: "Visual Learning Tools",
    description: "Create engaging visual content for better understanding.",
    icon: LucideImage,
  },
  {
    name: "Course Builder",
    description: "Design comprehensive courses with AI assistance.",
    icon: Layout,
  },
  {
    name: "Video Tutorials",
    description: "Generate and customize educational video content.",
    icon: Video,
  },
  {
    name: "AI Tutor",
    description: "24/7 intelligent tutoring support for students.",
    icon: MessageSquare,
  },
  {
    name: "Smart Assessment",
    description: "Create and grade assessments automatically.",
    icon: FileText,
  },
  {
    name: "Learning Analytics",
    description: "Track and analyze student performance data.",
    icon: Lightbulb,
  },
];
