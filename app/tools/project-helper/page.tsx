"use client";

import { useState } from "react";
import ProjectIdeation from "./components/ProjectIdeation";
import ProjectPlanner from "./components/ProjectPlanner";
import ResourceSuggestions from "./components/ResourceSuggestions";
import ProblemSolver from "./components/ProblemSolver";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState("ideation");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);
  const [assistantData, setAssistantData] = useState<AssistantData | null>(
    null
  );

  interface ProjectData {
    grade: string;
    projectDomain: string;
    // Add other fields as needed
  }

  const handleProjectDataGenerated = (data: ProjectData): void => {
    setProjectData(data);
    setActiveTab("planner");
  };

  interface ResourceData {
    grade: string;
    projectDomain: string;
    // Add other fields as needed
  }

  const handleResourceGeneration = (data: ResourceData): void => {
    setResourceData({
      ...data,
      grade: data.grade,
      projectDomain: data.projectDomain,
    });
    setActiveTab("resources");
  };

  interface AssistantData {
    grade: string;
    projectDomain: string;
    // Add other fields as needed
  }

  const handleProjectAssistant = (data: AssistantData): void => {
    setAssistantData({
      ...data,
      grade: data.grade,
      projectDomain: data.projectDomain,
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/tools"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold">Project Helper</h1>
        </div>
        <Card className="w-full max-w-4xl mx-auto">
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
