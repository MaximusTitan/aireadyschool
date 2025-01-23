"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateProjectPlan, modifyProjectPlan } from "../actions/ai";
import ReactMarkdown from "react-markdown";
import PdfDownloadButton from "./PdfDownloadButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ProjectPlannerProps = {
  projectData: any;
  onResourceGeneration: (resources: any) => void;
};

export default function ProjectPlanner({
  projectData,
  onResourceGeneration,
}: ProjectPlannerProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [projectTimeline, setProjectTimeline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [grade, setGrade] = useState("");
  const [projectDomain, setProjectDomain] = useState("technical");

  useEffect(() => {
    if (projectData) {
      setProjectName(projectData.projectName);
      setProjectDescription(projectData.projectDescription);
      setDuration(projectData.duration);
      setGrade(projectData.grade);
      setProjectDomain(projectData.projectDomain);
      handleGenerateTimeline(
        projectData.projectDescription,
        projectData.duration,
        projectData.grade,
        projectData.projectDomain
      );
    }
  }, [projectData]);

  const handleGenerateTimeline = async (
    idea: string,
    duration: string,
    grade: string,
    domain: string
  ) => {
    try {
      setLoading(true);
      setError("");
      const generatedTimeline = await generateProjectPlan(
        idea,
        duration,
        grade,
        domain
      );
      setProjectTimeline(generatedTimeline);
      setMessages([{ role: "assistant", content: generatedTimeline }]);
    } catch (error) {
      console.error("Error generating timeline:", error);
      if (
        error instanceof Error &&
        (error.message.includes("504") || error.message.includes("timeout"))
      ) {
        setError(
          "The server is taking too long to respond. Please try again with a simpler project description or retry in a few minutes."
        );
      } else {
        setError(
          "An error occurred while generating the timeline. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualGenerateTimeline = async () => {
    if (!projectDescription || !duration || !grade || !projectDomain) {
      setError("Please ensure all fields are filled.");
      return;
    }
    await handleGenerateTimeline(
      projectDescription,
      duration,
      grade,
      projectDomain
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const modifiedPlan = await modifyProjectPlan(
        projectTimeline,
        input,
        projectDomain
      );
      setProjectTimeline(modifiedPlan);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: modifiedPlan },
      ]);
    } catch (error) {
      console.error("Error modifying project plan:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Could you please try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResources = () => {
    onResourceGeneration({
      projectName,
      projectDescription,
      duration: `${duration} days`,
      grade,
      projectDomain,
      projectTimeline,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter your project name"
          />
        </div>
        <div>
          <Label htmlFor="projectDomain">Project Domain</Label>
          <Select value={projectDomain} onValueChange={setProjectDomain}>
            <SelectTrigger id="projectDomain">
              <SelectValue placeholder="Select project domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="non-technical">Non-Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Project Duration (in days)</Label>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration in days"
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade Level</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(10)].map((_, i) => (
                <SelectItem key={i} value={`${i + 1}`}>
                  {`${i + 1}${getOrdinalSuffix(i + 1)} Grade`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="projectDescription">Project Description</Label>
        <Textarea
          id="projectDescription"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe your project"
          className="h-32"
        />
      </div>
      <Button
        onClick={handleManualGenerateTimeline}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Generating..." : "Generate Timeline"}
      </Button>
      {loading && (
        <div className="text-center mt-4">Generating project timeline...</div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      {projectTimeline && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">
              Generated Project Timeline:
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert dark:bg-gray-900">
              <ReactMarkdown
                className="prose prose-sm max-w-none dark:prose-invert"
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-bold mt-4 mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-bold mt-3 mb-2" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal pl-6 mb-4 space-y-2"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-muted px-[0.3rem] py-[0.2rem] rounded text-sm"
                      {...props}
                    />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre
                      className="bg-muted p-4 rounded-lg overflow-x-auto"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic" {...props} />
                  ),
                }}
              >
                {projectTimeline}
              </ReactMarkdown>
            </div>
            <div className="flex justify-between mt-4">
              <Button onClick={handleGenerateResources} className="mt-4">
                Generate Learning Resources
              </Button>
              <PdfDownloadButton
                projectName={projectName}
                content={[
                  { title: "Project Description", text: projectDescription },
                  { title: "Project Timeline", text: projectTimeline },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {projectTimeline && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">Modify Your Plan:</h3>
            <ScrollArea className="h-[300px] pr-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1
                              className="text-3xl font-bold mt-6 mb-4"
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-2xl font-bold mt-4 mb-3"
                              {...props}
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3
                              className="text-xl font-bold mt-3 mb-2"
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc pl-6 mb-4 space-y-2"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal pl-6 mb-4 space-y-2"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="mb-1" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-4" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Suggest modifications to your project plan..."
                className="flex-grow"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={loading}>
                {loading ? "Sending..." : "Send"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
