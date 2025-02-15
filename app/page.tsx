"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Session } from "@supabase/supabase-js";
import {
  ChevronRight,
  Book,
  ImageIcon,
  FileText,
  Layout,
  Video,
  MessageSquare,
  Lightbulb,
  Github,
  Twitter,
  Linkedin,
  Play,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import newLogo from "@/public/newLogo.png";

const LandingPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const client = await supabase;
      const {
        data: { session },
      } = await client.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();
  }, [supabase]);

  if (loading) {
    return null; // or a loading spinner
  }

  const tools = [
    {
      icon: Book,
      name: "Chat With Docs - RAG",
      description: "Interactive document analysis and retrieval",
    },
    {
      icon: ImageIcon,
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

  const benefits = [
    "Empower Everyone at School with AI",
    "Customize Education for Kids",
    "Help Teachers Save Time",
    "Make Everyone Adapt to AI",
    "Get Better Insights About Student and Teacher Performance",
    "Achieve More in Less Time",
    "Gain Competitive Advantage",
    "Become a Part of a Growing AI Community",
  ];

  const roles = [
    {
      title: "Student",
      descriptions: [
        "Personalize the learning path of every student with our patent pending AI powered personalization.",
        "Give them the gift of working with AI to help for learning the concepts well and also learn to build things with AI.",
      ],
    },
    {
      title: "Teacher",
      descriptions: [
        "The power of personalization helps teachers generate customized content for each student.",
        "Give the power of AI to teachers and which gives them more time to enjoy what they do, teaching.",
      ],
    },
    {
      title: "Admin Staff",
      descriptions: [
        "Accessing information about anything in the school is now on the fingertips with AI.",
        "They can do their daily work more efficiently and also can help with other things.",
      ],
    },
    {
      title: "Principal / Management",
      descriptions: [
        "Principals and school owners can have more control over the operations as the AI helps to automate certain things and provides them intelligent insights on various school related things.",
        "Now your school will be truly AI Ready!",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="container mx-auto px-4 pt-12 pb-16 text-center relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(255,192,203,0.1),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_50%,rgba(255,192,203,0.05),transparent)]" />
        <div className="mb-12 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full blur-2xl opacity-10 dark:opacity-20" />
          <Image
            src={newLogo}
            alt="AI Ready School"
            width={240}
            height={96}
            className="mx-auto relative"
            priority
          />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Transform Education with AI
        </h1>
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Empower your educational journey with AI-driven tools designed to
          enhance learning, streamline teaching, and improve student outcomes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <Button
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/25 dark:shadow-rose-500/10"
          >
            Signup for a Demo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2"
            onClick={() => router.push(session ? "/tools" : "/sign-in")}
          >
            {session ? "Go to App" : "Login"}
          </Button>
        </div>
      </header>

      {/* Video Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-500 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 -z-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-20 w-20 rounded-full bg-white/90 dark:bg-white/80 hover:bg-white dark:hover:bg-white shadow-xl group-hover:scale-105 transition-transform"
            >
              <Play className="h-10 w-10 text-rose-500" />
            </Button>
          </div>
        </div>
      </section>

      {/* Roles Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => (
            <Card
              key={role.title}
              className="group relative overflow-hidden border-0 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-rose-500/5 transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                  {role.title}
                </h2>
                <div className="space-y-4">
                  {role.descriptions.map((desc, index) => (
                    <p
                      key={index}
                      className="text-gray-600 dark:text-gray-300 leading-relaxed"
                    >
                      {desc}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(255,192,203,0.1),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_50%,rgba(255,192,203,0.05),transparent)]" />
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Overall Benefits to the School
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-gray-100 dark:border-neutral-800"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {["Starter", "Silver", "Gold"].map((tier, index) => (
            <Card
              key={tier}
              className="relative group overflow-hidden border-0 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-rose-500/5 transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-center mb-6 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                  {tier}
                </h3>
                <Button className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/25 dark:shadow-rose-500/10">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600 dark:text-gray-300">
            © 2024 AI Ready School. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
