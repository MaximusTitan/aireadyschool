"use client";

import { useState } from "react";
import { ResearchAssistant } from "./components/research-assistant";
import { ResearchSidebar } from "./components/research-sidebar";
import { Inter } from "next/font/google";
import { ErrorBoundaryWrapper } from "./components/error-boundary-wrapper";
import { ResearchEntry } from "./types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [researchContent, setResearchContent] = useState("");
  const [selectedResearch, setSelectedResearch] = useState<
    ResearchEntry | undefined
  >(undefined);

  const handleNewChat = () => {
    setSelectedResearch(undefined);
    setResearchContent("");
  };

  const handleSelectResearch = (research: ResearchEntry) => {
    setSelectedResearch(research);
    setResearchContent(research.response);
  };

  return (
    <div className={`flex bg-backgroundApp ${inter.className}`}>
      <ResearchSidebar
        onNewChat={handleNewChat}
        onSelectResearch={handleSelectResearch}
      />
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
          <Link href="/tools">
            <Button variant="outline" className="mb-2 border-neutral-500">
              ← Back
            </Button>
          </Link>

          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold text-rose-500">
              Research Assistant
            </h1>
            <p className="text-muted-foreground text-lg">
              Your AI-powered research companion that helps analyze, summarize,
              and explore topics in depth.
            </p>
          </div>

          <ErrorBoundaryWrapper>
            <ResearchAssistant
              onContentUpdate={setResearchContent}
              initialResearch={selectedResearch}
              onNewResearch={handleNewChat}
            />
          </ErrorBoundaryWrapper>
        </div>
      </div>
    </div>
  );
}
