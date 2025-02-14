"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateProjectIdea, modifyProjectIdea } from "../actions/ai";
import { saveText } from "../actions/database";
import ReactMarkdown from "react-markdown";
import PdfDownloadButton from "./PdfDownloadButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

interface ProjectIdeationProps {
  onProjectDataGenerated: (data: {
    projectName: string;
    projectDescription: string;
    duration: string;
    grade: string;
    detailedExplanation: string;
    projectDomain: string;
  }) => void;
}

export default function ProjectIdeation({
  onProjectDataGenerated,
}: ProjectIdeationProps) {
  const [subject, setSubject] = useState("");
  const [interests, setInterests] = useState("");
  const [tools, setTools] = useState("");
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [projectDuration, setProjectDuration] = useState("30-60");
  const [targetAudience, setTargetAudience] = useState("");
  const [grade, setGrade] = useState("");
  const [detailedExplanation, setDetailedExplanation] = useState("");
  const [projectIdea, setProjectIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [projectDomain, setProjectDomain] = useState("technical");
  const [saveError, setSaveError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProjectIdea, setEditedProjectIdea] = useState("");

  const handleGenerateIdea = async () => {
    try {
      setLoading(true);
      setError("");
      const idea = await generateProjectIdea(
        projectDomain,
        subject,
        interests,
        tools, // tools or project type selected
        projectDomain === "technical" ? skillLevel : "", // conditionally pass skillLevel
        projectDuration,
        targetAudience,
        grade,
        detailedExplanation
      );
      setProjectIdea(idea);
      setMessages([{ role: "assistant", content: idea }]);
    } catch (error) {
      console.error("Error generating project idea:", error);
      setError("Failed to generate project idea. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const modifiedIdea = await modifyProjectIdea(projectIdea, input);
      setProjectIdea(modifiedIdea);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: modifiedIdea },
      ]);
    } catch (error) {
      console.error("Error modifying project idea:", error);
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

  const handleGeneratePlan = () => {
    if (projectIdea) {
      const projectName = projectIdea.split("\n")[0].replace(/^#\s*/, "");
      onProjectDataGenerated({
        projectName,
        projectDescription: projectIdea,
        duration: projectDuration,
        grade,
        detailedExplanation,
        projectDomain, // Add this line to include the project domain
      });
    }
  };

  const handleSaveText = async () => {
    if (!projectIdea) {
      setSaveError("No project idea to save.");
      return;
    }

    try {
      setLoading(true);
      const savedText = await saveText(projectIdea);
      setSaveError("");
      alert(`Project idea saved successfully! ID: ${savedText.id}`);
    } catch (error) {
      console.error("Error saving text:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save the project idea. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setProjectIdea(editedProjectIdea);
    } else {
      setEditedProjectIdea(projectIdea);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Computer Science, Biology"
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
          <Label htmlFor="interests">
            {projectDomain === "technical" ? "Interests" : "Topic"}
          </Label>
          <Input
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder={
              projectDomain === "technical"
                ? "e.g., Machine Learning, Environmental Science"
                : "e.g., History, Literature"
            }
          />
        </div>
        <div>
          <Label htmlFor="tools">
            {projectDomain === "technical" ? "Tools Known" : "Project Type"}
          </Label>
          {projectDomain === "technical" ? (
            <Input
              id="tools"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="e.g., Python, React"
            />
          ) : (
            <Select value={tools} onValueChange={setTools}>
              <SelectTrigger id="tools">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hands-on">Hands-on experiment</SelectItem>
                <SelectItem value="research">Research-based Project</SelectItem>
                <SelectItem value="model">Model Building</SelectItem>
                <SelectItem value="presentation">
                  Presentation or Report
                </SelectItem>
                <SelectItem value="creative">Creative Arts</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {projectDomain === "technical" && (
          <div>
            <Label htmlFor="skillLevel">Skill Level</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger id="skillLevel">
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="projectDuration">Project Duration (days)</Label>
          <Select value={projectDuration} onValueChange={setProjectDuration}>
            <SelectTrigger id="projectDuration">
              <SelectValue placeholder="Select project duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-7">1-7 days</SelectItem>
              <SelectItem value="8-14">8-14 days</SelectItem>
              <SelectItem value="15-30">15-30 days</SelectItem>
              <SelectItem value="30-60">30-60 days</SelectItem>
              <SelectItem value="60+">60+ days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Students, Professionals, General Public"
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
        <Label htmlFor="detailedExplanation">
          Detailed Project Explanation
        </Label>
        <Textarea
          id="detailedExplanation"
          value={detailedExplanation}
          onChange={(e) => setDetailedExplanation(e.target.value)}
          placeholder="Provide a detailed explanation of your project idea, including any specific requirements or goals."
          className="h-32"
        />
      </div>
      <Button
        onClick={handleGenerateIdea}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Generating..." : "Generate Project Idea"}
      </Button>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      {projectIdea && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">Generated Project Idea:</h3>
            {isEditing ? (
              <Textarea
                value={editedProjectIdea}
                onChange={(e) => setEditedProjectIdea(e.target.value)}
                className="w-full h-64 p-2 border rounded"
              />
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none dark:prose-invert"
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-4" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                }}
              >
                {projectIdea}
              </ReactMarkdown>
            )}
            <div className="flex justify-between items-center mt-4 space-x-2">
              <Button
                onClick={handleGeneratePlan}
                disabled={!projectIdea || loading}
              >
                Generate Timeline
              </Button>
              <Button
                onClick={handleSaveText}
                disabled={!projectIdea || loading}
              >
                {loading ? "Saving..." : "Save Idea"}
              </Button>
              <Button onClick={handleEditToggle}>
                {isEditing ? "Save Changes" : "Edit"}
              </Button>
              <PdfDownloadButton
                projectName={projectIdea.split("\n")[0].replace(/^#\s*/, "")}
                content={[{ title: "Project Idea", text: projectIdea }]}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
      {projectIdea && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">Modify Your Idea:</h3>
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
                    <ReactMarkdown
                      className="prose prose-sm max-w-none dark:prose-invert"
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-2xl font-bold mt-4 mb-2"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-xl font-bold mt-3 mb-2"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-lg font-bold mt-2 mb-1"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-4" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-6 mb-4" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-6 mb-4" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mb-1" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Suggest modifications to your project idea..."
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
