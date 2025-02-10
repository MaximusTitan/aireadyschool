"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InitialQuestionnaire } from "./initial-questionnaire";
import { AdditionalQuestions } from "./additional-questions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Presentation } from "lucide-react";
import { DynamicLessonPlanTable } from "./DynamicLessonPlanTable";

const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    body {
      padding: 20px;
    }
  }
  .presentation-mode .no-print:not(.keep-after-print) {
    display: none !important;
  }
`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LessonInfo {
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  specificFocus: string;
}

interface LessonPlanSection {
  name: string;
  duration: string;
  activities?: { name: string; duration: string; instructions: string }[];
  keyPoints?: string[];
  description?: string;
  steps?: string[];
  methods?: string[];
}

interface LessonPlan {
  topic: string;
  objective: string;
  duration: string;
  gradeLevel: string;
  subject: string;
  sections: LessonPlanSection[];
  resources: string[];
}

interface StructuredChange {
  changeType: string;
  section?: string;
  content: string;
}

const parseAIResponse = (response: string): StructuredChange[] => {
  const changes: StructuredChange[] = [];
  const changeRegex =
    /CHANGE_TYPE:\s*(.*?)\n(?:SECTION:\s*(.*?)\n)?CONTENT:\s*([\s\S]*?)(?=\n\nCHANGE_TYPE:|$)/gi;
  let match;

  while ((match = changeRegex.exec(response)) !== null) {
    changes.push({
      changeType: match[1].trim().toLowerCase(),
      section: match[2]?.trim().toLowerCase(),
      content: match[3].trim(),
    });
  }

  return changes;
};

const applyStructuredChange = (
  changes: StructuredChange[],
  currentPlan: LessonPlan
): LessonPlan => {
  let updatedPlan = JSON.parse(JSON.stringify(currentPlan)) as LessonPlan;

  const findOrCreateSection = (sectionName: string) => {
    let section = updatedPlan.sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) {
      section = { name: sectionName, duration: "5 minutes", activities: [] };
      updatedPlan.sections.push(section);
    }
    return section;
  };

  changes.forEach((change) => {
    const sectionName = change.section?.toLowerCase();
    switch (change.changeType) {
      case "update_duration":
        if (sectionName) {
          const section = findOrCreateSection(sectionName);
          section.duration = change.content;
        } else {
          updatedPlan.duration = change.content;
        }
        break;

      case "add_resource":
        const [resourceTitle, resourceUrl] = change.content
          .split("|")
          .map((item) => item.trim());
        if (resourceTitle && resourceUrl) {
          const newResource = `${resourceTitle} - ${resourceUrl}`;
          if (!updatedPlan.resources.includes(newResource)) {
            updatedPlan.resources.push(newResource);
          }
        }
        break;

      case "update_objective":
        updatedPlan.objective = change.content;
        break;

      case "add_activity":
        if (sectionName) {
          const section = findOrCreateSection(sectionName);
          const [activityName, activityDuration, activityInstructions] =
            change.content.split("|");
          if (!section.activities) {
            section.activities = [];
          }
          const activityIndex = section.activities.findIndex(
            (a) => a.name.toLowerCase() === activityName.toLowerCase()
          );
          if (activityIndex === -1) {
            section.activities.push({
              name: activityName.trim(),
              duration: activityDuration.trim(),
              instructions: activityInstructions.trim(),
            });
          } else {
            section.activities[activityIndex] = {
              name: activityName.trim(),
              duration: activityDuration.trim(),
              instructions: activityInstructions.trim(),
            };
          }
        }
        break;

      case "remove_activity":
        if (sectionName) {
          const section = findOrCreateSection(sectionName);
          if (section.activities) {
            section.activities = section.activities.filter(
              (activity) =>
                activity.name.toLowerCase() !== change.content.toLowerCase()
            );
          }
        }
        break;

      case "add_keypoint":
        if (sectionName) {
          const section = findOrCreateSection(sectionName);
          const newKeyPoints = change.content
            .split(/(?:\d+\.\s*|\s*-\s*)/)
            .map((point) => point.trim())
            .filter((point) => point.length > 0);
          section.keyPoints = [...(section.keyPoints || []), ...newKeyPoints];
        }
        break;

      case "update_description":
        if (sectionName) {
          const section = findOrCreateSection(sectionName);
          section.description = change.content;
        }
        break;

      case "add_section":
        if (sectionName && change.content) {
          const [newSectionName, duration] = change.content.split("|");
          if (
            !updatedPlan.sections.some(
              (s) => s.name.toLowerCase() === newSectionName.toLowerCase()
            )
          ) {
            const newSection: LessonPlanSection = {
              name: newSectionName.trim(),
              duration: duration ? duration.trim() : "5 minutes",
              activities: [],
            };
            updatedPlan.sections.push(newSection);
          }
        }
        break;

      case "remove_section":
        if (sectionName) {
          updatedPlan.sections = updatedPlan.sections.filter(
            (section) => section.name.toLowerCase() !== sectionName
          );
        }
        break;

      case "update_section_name":
        if (sectionName && change.content) {
          const section = updatedPlan.sections.find(
            (s) => s.name.toLowerCase() === sectionName
          );
          if (section) {
            section.name = change.content;
          }
        }
        break;
    }
  });

  return updatedPlan;
};

export function Chat() {
  const [step, setStep] = useState<"initial" | "additional" | "plan" | "chat">(
    "initial"
  );
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInitialComplete = (data: {
    subject: string;
    grade: string;
    topic: string;
  }) => {
    setLessonInfo((prev) => ({
      ...prev,
      ...data,
      duration: prev?.duration ?? "",
      specificFocus: prev?.specificFocus ?? "",
    }));
    setStep("additional");
  };

  const handleAdditionalComplete = async (data: {
    duration: string;
    specificFocus: string;
  }) => {
    const updatedLessonInfo = { ...lessonInfo, ...data } as LessonInfo;
    setLessonInfo(updatedLessonInfo);
    setStep("plan");
    await fetchLessonPlan(updatedLessonInfo);
  };

  const fetchLessonPlan = async (info: LessonInfo) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/lesson-plan-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(info),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      if (!data.lessonPlan) {
        console.error("Incomplete lesson plan data:", data);
        throw new Error(data.error || "Lesson plan data is incomplete");
      }
      setLessonPlan(data.lessonPlan);
      setStep("chat");
      setMessages([
        {
          role: "assistant",
          content: `I've generated a lesson plan for "${info.topic}" in ${info.subject} for grade ${info.grade}. You can see it above. What would you like to know more about or what modifications would you like to make?`,
        },
      ]);
    } catch (error) {
      console.error("Error fetching lesson plan:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setStep("additional"); // Go back to additional questions step
    } finally {
      setIsLoading(false);
    }
  };

  const updateLessonPlan = (updatedPlan: LessonPlan) => {
    console.log("Updating lesson plan:", updatedPlan);
    setLessonPlan(updatedPlan);
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage: Message = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        if (lessonPlan) {
          const response = await fetch("/api/lesson-planner-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: input,
              context: `The current lesson plan is about "${lessonPlan.topic}" in ${lessonPlan.subject} for grade ${lessonPlan.gradeLevel}. The lesson duration is ${lessonPlan.duration}.`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get chat response");
          }

          const data = await response.json();
          console.log("Received data:", data);

          if (data.reply) {
            const changes = parseAIResponse(data.reply);

            if (changes.length > 0) {
              const updatedPlan = applyStructuredChange(changes, lessonPlan);
              updateLessonPlan(updatedPlan);
              console.log("Updated plan after changes:", updatedPlan);

              let responseMessage = `I've updated the lesson plan with your requested changes. `;

              changes.forEach((change) => {
                switch (change.changeType) {
                  case "add_section":
                    responseMessage += `A new section "${change.section}" has been added. `;
                    break;
                  case "remove_section":
                    responseMessage += `The section "${change.section}" has been removed. `;
                    break;
                  case "add_activity":
                    const [activityName, activityDuration] =
                      change.content.split("|");
                    responseMessage += `A new activity "${activityName}" has been added to the "${change.section}" section. It will last for ${activityDuration}. `;
                    break;
                  case "update_description":
                    responseMessage += `The description for the "${change.section}" section has been updated. `;
                    break;
                  case "add_resource":
                    const [resourceTitle] = change.content.split("|");
                    responseMessage += `A new resource "${resourceTitle}" has been added. `;
                    break;
                  case "update_objective":
                    responseMessage += `The lesson objective has been updated. `;
                    break;
                  case "update_duration":
                    if (change.section) {
                      responseMessage += `The duration for the "${change.section}" section has been updated to ${change.content}. `;
                    } else {
                      responseMessage += `The overall lesson duration has been updated to ${change.content}. `;
                    }
                    break;
                  case "add_keypoint":
                    responseMessage += `New key points have been added to the "${change.section}" section. `;
                    break;
                  case "update_section_name":
                    responseMessage += `The section "${change.section}" has been renamed to "${change.content}". `;
                    break;
                }
              });

              responseMessage += `You can see the updates reflected in the lesson plan above.`;

              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: responseMessage,
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
              ]);
            }
          } else {
            throw new Error("Invalid response from server");
          }
        }
      } catch (error) {
        console.error("Error getting response:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I apologize, but I encountered an error while processing your request. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = () => {
    if (lessonInfo) {
      setStep("plan");
      fetchLessonPlan(lessonInfo);
    } else {
      setStep("initial");
    }
  };

  const handleRestart = () => {
    setStep("initial");
    setLessonInfo(null);
    setLessonPlan(null);
    setMessages([]);
    setInput("");
    setError(null);
  };

  if (step === "initial") {
    return <InitialQuestionnaire onComplete={handleInitialComplete} />;
  }

  if (step === "additional") {
    return (
      <>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              onClick={handleRetry}
              className="mt-2 bg-neutral-500 hover:bg-neutral-600 text-white"
            >
              Retry
            </Button>
          </Alert>
        )}
        <AdditionalQuestions onComplete={handleAdditionalComplete} />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-background">
      <style>{printStyles}</style>
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <details className="mt-2">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-40">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
          <Button
            onClick={handleRetry}
            className="mt-2 bg-neutral-500 hover:bg-neutral-600 text-white"
          >
            Retry
          </Button>
        </Alert>
      )}
      <div className="flex justify-end gap-2 p-4 no-print">
        <Button
          onClick={handleRestart}
          variant="outline"
          className="flex items-center gap-2 border-neutral-500 text-neutral-500 hover:bg-neutral-50 keep-after-print"
        >
          Restart
        </Button>
        <Button
          onClick={() => {
            window.print();
          }}
          variant="outline"
          className="flex items-center gap-2 border-neutral-500 text-neutral-500 hover:bg-neutral-50"
        >
          <Presentation className="w-4 h-4" />
          Print Lesson Plan
        </Button>
      </div>
      {step === "plan" && (
        <div className="p-4 flex items-center">
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          <h2 className="text-2xl font-bold text-neutral-500">
            Generating Lesson Plan...
          </h2>
        </div>
      )}

      <div className="flex flex-col flex-grow overflow-auto">
        {lessonPlan && (
          <div className="p-4 space-y-8">
            <h2 className="text-2xl font-bold mb-6 text-neutral-800">
              Lesson Plan: {lessonPlan.topic}
            </h2>
            <DynamicLessonPlanTable lessonPlan={lessonPlan} />
          </div>
        )}

        <div className="mt-8 p-4 border-t border-border no-print">
          <div className="mb-4 text-lg font-semibold text-neutral-800">
            Chat about the lesson plan:
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            <p>
              You can chat with me about the lesson plan or request
              modifications.
            </p>
          </div>
          <ScrollArea className="h-[300px] mb-4" ref={scrollAreaRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-black w-full"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about the lesson plan or request modifications..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              className="bg-black hover:bg-neutral-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
