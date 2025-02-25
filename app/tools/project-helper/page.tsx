"use client";

import { useState } from "react";
import ProjectIdeation from "./components/ProjectIdeation";
import ProjectPlanner from "./components/ProjectPlanner";
import ResourceSuggestions from "./components/ResourceSuggestions";
import ProblemSolver from "./components/ProblemSolver";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectData, ResourceData, AssistantData } from "./types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("ideation");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [resourceData, setResourceData] = useState<ResourceData | undefined>(
    undefined
  );
  const [assistantData, setAssistantData] = useState<AssistantData | undefined>(
    undefined
  );

  const handleProjectDataGenerated = (data: ProjectData): void => {
    setProjectData({
      ...data,
      id: data.id || Date.now().toString(),
      grade: data.grade,
      projectDomain: data.projectDomain,
    } as ProjectData);
    setActiveTab("planner");
  };

  const handleResourceGeneration = (data: ResourceData): void => {
    setResourceData({
      ...data,
      grade: data.grade,
      projectDomain: data.projectDomain,
    });
    setActiveTab("resources");
  };

  const handleProjectAssistant = (data: AssistantData): void => {
    setAssistantData({
      topic: data.topic,
      specificGoals: data.specificGoals,
      timeAvailable: data.timeAvailable,
      grade: data.grade,
      projectDomain: data.projectDomain,
      projectId: data.projectId || projectData?.id || null,
    });
    setActiveTab("problemSolver");
  };

  const renderComponent = () => {
    switch (activeTab) {
      case "ideation":
        return (
          <ProjectIdeation
            onProjectDataGenerated={handleProjectDataGenerated}
          />
        );
      case "planner":
        return (
          <ProjectPlanner
            projectData={projectData}
            onResourceGeneration={handleResourceGeneration}
          />
        );
      case "resources":
        return (
          <ResourceSuggestions
            resourceData={resourceData}
            onProjectAssistant={handleProjectAssistant}
          />
        );
      case "problemSolver":
        return <ProblemSolver assistantData={assistantData} />;
      default:
        return (
          <ProjectIdeation
            onProjectDataGenerated={handleProjectDataGenerated}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Project Helper</h1>
          <p className="text-muted-foreground text-lg">
            Generate project ideas, plan your workflow, and get AI-powered
            assistance for your educational projects.
          </p>
        </div>

        <Card className="w-full mx-auto">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="ideation">Project Ideation</TabsTrigger>
                <TabsTrigger value="planner">Project Planner</TabsTrigger>
                <TabsTrigger value="resources">
                  Resource Suggestions
                </TabsTrigger>
                <TabsTrigger value="problemSolver">
                  Project Assistant
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>{renderComponent()}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
