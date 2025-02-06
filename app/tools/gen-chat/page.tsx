"use client";

import { useChat } from "ai/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useState, useCallback } from "react";
import { CommandInput } from "./components/command-input";
import { ChatArea } from "./components/chat-area";

export default function Page() {
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const simulationCodeRef = useRef<string | null>(null);
  const { messages, input, setInput, handleSubmit, append, isLoading } =
    useChat({
      api: "/api/gen-chat",
      onFinish: useCallback((message: any) => {
        const toolInvocation = message.toolInvocations?.find(
          (t: any) => t.toolName === "conceptVisualizer"
        );
        if (toolInvocation && toolInvocation.state === "result") {
          const code = (toolInvocation.result as any).code;
          if (code !== simulationCodeRef.current) {
            simulationCodeRef.current = code;
            setSimulationCode(code.trim());
          }
        }
      }, []),
    });
  const [showCommands, setShowCommands] = useState(false);
  const [pendingImageRequests] = useState(() => new Set<string>());
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [completedImages] = useState(() => new Set<string>());
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, { url: string; credits: number }>
  >({});
  const [pendingVisualizations] = useState(() => new Set<string>());

  const handleAnswerSubmit = async (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => {
    const userMessage = {
      id: String(Date.now()),
      role: "user" as const,
      content: `Evaluate my answer: ${data.studentAnswer} for the question: "${data.question}"`,
      toolCalls: [
        {
          tool: "evaluateAnswer",
          parameters: data,
        },
      ],
    };
    await append(userMessage);
  };

  const handleImageGeneration = async (
    toolCallId: string,
    params: {
      prompt: string;
      style: string;
      imageSize: string;
      numInferenceSteps: number;
      numImages: number;
      enableSafetyChecker: boolean;
    }
  ) => {
    if (
      pendingImageRequests.has(toolCallId) ||
      completedImages.has(toolCallId)
    ) {
      return;
    }
    pendingImageRequests.add(toolCallId);
    try {
      const response = await fetch("/api/generate-recraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      pendingImageRequests.delete(toolCallId);
      completedImages.add(toolCallId);
      if (data.images?.[0]) {
        setGeneratedImages((prev) => ({
          ...prev,
          [toolCallId]: {
            url: data.images[0].url,
            credits: data.remainingCredits,
          },
        }));
        setRemainingCredits(data.remainingCredits);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      pendingImageRequests.delete(toolCallId);
      setGeneratedImages((prev) => ({
        ...prev,
        [toolCallId]: { url: "error", credits: remainingCredits || 0 },
      }));
    }
  };

  const handleVisualization = async (subject: string, concept: string) => {
    try {
      const response = await fetch("/api/generate-visualization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, concept }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate visualization");
      }
      const { visualization } = await response.json();
      return { code: visualization };
    } catch (error) {
      console.error("Visualization generation failed:", error);
      return { error: "Failed to generate visualization" };
    }
  };

  const handleDirectCommand = async (command: string) => {
    const parts = command.slice(1).split(" ");
    const toolName = parts[0].toLowerCase();
    if (toolName === "math") {
      const level = parts[1] || "easy";
      const topic = parts[2] || "addition";
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a ${level} ${topic} math problem`,
        toolCalls: [
          { tool: "generateMathProblem", parameters: { level, topic } },
        ],
      };
      await append(userMessage);
    } else if (toolName === "quiz") {
      const subject = parts[1] || "general";
      const difficulty = parts[2] || "easy";
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a ${difficulty} quiz about ${subject}`,
        toolCalls: [
          { tool: "generateQuiz", parameters: { subject, difficulty } },
        ],
      };
      await append(userMessage);
    } else if (toolName === "image") {
      const prompt = parts.slice(1, -1).join(" ");
      const style = parts[parts.length - 1] || "realistic_image";
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate an educational image about: ${prompt}`,
        toolCalls: [
          {
            tool: "generateImage",
            parameters: {
              prompt,
              style,
              imageSize: "landscape_4_3",
              numInferenceSteps: 1,
              numImages: 1,
              enableSafetyChecker: true,
            },
          },
        ],
      };
      await append(userMessage);
    } else if (toolName === "visualize") {
      const subject = parts[1] || "physics";
      const concept = parts.slice(2).join(" ") || "";
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a visualization for ${concept} in ${subject}`,
        toolCalls: [
          { tool: "generateVisualization", parameters: { subject, concept } },
        ],
      };
      await append(userMessage);
    } else if (toolName === "mindmap") {
      const topic = parts.slice(1).join(" ");
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a mind map about ${topic}`,
        toolCalls: [{ tool: "generateMindMap", parameters: { topic } }],
      };
      await append(userMessage);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.startsWith("@")) {
      await handleDirectCommand(input);
      setInput("");
    } else {
      handleSubmit(e);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto flex flex-col min-h-[100vh]">
        <header className="sticky top-0 z-10 backdrop-blur-sm bg-white/80 border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-neutral-800">
                Learning Buddy
              </h1>
              <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                AI Powered
              </span>
            </div>
            {remainingCredits !== null && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-neutral-600">
                  Credits:{" "}
                  <span className="font-medium">{remainingCredits}</span>
                </div>
                <div className="h-4 w-px bg-neutral-200" />
                <button className="text-sm text-neutral-600 hover:text-neutral-900">
                  Help
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <ChatArea
            messages={messages}
            simulationCode={simulationCode}
            simulationCodeRef={simulationCodeRef}
            generatedImages={generatedImages}
            pendingImageRequests={pendingImageRequests}
            completedImages={completedImages}
            pendingVisualizations={pendingVisualizations}
            handleAnswerSubmit={handleAnswerSubmit}
            handleImageGeneration={handleImageGeneration}
            handleVisualization={handleVisualization}
            onSimulationCode={(code: string) => setSimulationCode(code)}
          />

          <CommandInput
            input={input}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleFormSubmit}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
