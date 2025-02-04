"use client";

import { useState } from "react";
import ProjectIdeation from "./components/ProjectIdeation";
import ProjectPlanner from "./components/ProjectPlanner";
import ResourceSuggestions from "./components/ResourceSuggestions";
import ProblemSolver from "./components/ProblemSolver";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectData, ResourceData, AssistantData } from "./types";
import { NavBar } from "./components/NavBar";

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
    <>
      <NavBar />
      <div className="space-y-6 mt-4">
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
    </>
  );
}
