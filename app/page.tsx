import React from "react";
import {
  ChevronRight,
  Book,
  Image,
  FileText,
  Layout,
  Video,
  MessageSquare,
  Lightbulb,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const LandingPage = () => {
  const tools = [
    {
      icon: Book,
      name: "Chat With Docs - RAG",
      description: "Interactive document analysis and retrieval",
    },
    {
      icon: Image,
      name: "Image Generator - Flux",
      description: "Create educational visuals and diagrams",
    },
    {
      icon: FileText,
      name: "Text Tools Suite",
      description: "Rewrite, proofread, translate, and more",
    },
    {
      icon: Layout,
      name: "MCQ Generator",
      description: "Create engaging assessments for students",
    },
    {
      icon: Video,
      name: "YouTube Tools",
      description: "Generate questions and summaries from videos",
    },
    {
      icon: MessageSquare,
      name: "Custom ChatBot",
      description: "AI-powered educational assistant",
    },
    {
      icon: Lightbulb,
      name: "Idea Generator",
      description: "Expand concepts into complete projects",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-rose-500">
                AI Ready School
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                  Get Started
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
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
              Transform Education with AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Empower your educational journey with AI-driven tools designed to
              enhance learning, streamline teaching, and improve student
              outcomes.
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 text-lg">
                Start Free Trial <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800 px-8 py-6 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-4 dark:text-white">
          Our AI Tools
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          A comprehensive suite of AI-powered tools designed specifically for
          educational excellence
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card
              key={tool.name}
              className="border-gray-100 dark:border-neutral-800 dark:bg-neutral-800/20 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                    <tool.icon className="h-6 w-6 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-rose-50 dark:bg-neutral-800/20 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4 dark:text-white">
              Why Choose AI Ready School?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-12">
              Discover how our platform transforms the educational experience
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg dark:bg-neutral-800/40">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-4 text-rose-500 dark:text-rose-400">
                    For Educators
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Automated lesson planning and content creation
                      </span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Intelligent assessment generation
                      </span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Performance tracking and analytics
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg dark:bg-neutral-800/40">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-4 text-rose-500 dark:text-rose-400">
                    For Students
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Personalized learning pathways
                      </span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        24/7 AI tutoring support
                      </span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 bg-rose-500 dark:bg-rose-400 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Interactive study materials
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-rose-500 dark:text-rose-400">
                AI Ready School
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Empowering education through artificial intelligence
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-rose-500 dark:hover:text-rose-400"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-rose-500 dark:hover:text-rose-400"
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-rose-500 dark:hover:text-rose-400"
                >
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">Product</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>Features</li>
                <li>Pricing</li>
                <li>Use Cases</li>
                <li>Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">Resources</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Blog</li>
                <li>Community</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-neutral-800">
            <p className="text-center text-gray-600 dark:text-gray-300">
              © 2024 AI Ready School. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
