"use client";

import { useChat } from "ai/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { CommandInput } from "./components/command-input";
import { ChatArea } from "./components/chat-area";

export default function Page() {
  const { setOpen } = useSidebar();

  // Close sidebar on component mount
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

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
  const [pendingQuizzes] = useState(() => new Set<string>());
  const [generatedQuizzes, setGeneratedQuizzes] = useState<Record<string, any>>(
    {}
  );
  const [generatedVideos, setGeneratedVideos] = useState<
    Record<string, string>
  >({});
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(
    null
  );

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

  const handleQuizAnswer = useCallback(
    async (data: {
      selectedOption: { id: string; text: string; isCorrect: boolean };
      question: string;
      allOptions: Array<{ id: string; text: string; isCorrect: boolean }>;
      subject: string;
      difficulty: string;
      explanation: string;
    }) => {
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `I chose: "${data.selectedOption.text}" for the question: "${data.question}"`,
        toolCalls: [
          {
            tool: "evaluateQuizAnswer",
            parameters: {
              selectedAnswer: data.selectedOption,
              question: data.question,
              allOptions: data.allOptions,
              subject: data.subject,
              difficulty: data.difficulty,
              explanation: data.explanation,
              isCorrect: data.selectedOption.isCorrect,
            },
          },
        ],
        isHidden: true, // Add this flag
      };
      await append(userMessage);
    },
    [append]
  );

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
      const response = await fetch("/api/gen-chat-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      pendingImageRequests.delete(toolCallId);
      completedImages.add(toolCallId);
      if (data.images?.[0]) {
        const imageUrl = data.images[0].url;
        setLastGeneratedImage(imageUrl); // Store the last generated image URL
        setGeneratedImages((prev) => ({
          ...prev,
          [toolCallId]: {
            url: imageUrl,
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

  const handleQuizGeneration = useCallback(
    async (
      toolCallId: string,
      params: {
        subject: string;
        difficulty: string;
      }
    ) => {
      if (pendingQuizzes.has(toolCallId)) {
        return;
      }

      pendingQuizzes.add(toolCallId);
      try {
        const response = await fetch("/api/gen-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to generate quiz");
        }

        const data = await response.json();
        setGeneratedQuizzes((prev) => ({
          ...prev,
          [toolCallId]: data,
        }));
      } catch (error) {
        console.error("Quiz generation failed:", error);
        setGeneratedQuizzes((prev) => ({
          ...prev,
          [toolCallId]: {
            error: "Failed to generate quiz",
          },
        }));
      } finally {
        pendingQuizzes.delete(toolCallId);
      }
    },
    [pendingQuizzes]
  );

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
              pending: true,
              prompt,
              style,
              imageSize: "square_hd",
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
        content: `Generate a visualization of ${concept} ${subject}`,
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
    } else if (toolName === "video") {
      const prompt = parts.slice(1).join(" ");
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a video with this description: ${prompt}`,
        toolCalls: [
          {
            tool: "generateVideo",
            parameters: {
              prompt,
              imageUrl: lastGeneratedImage, // Pass the last generated image URL
            },
          },
        ],
      };
      await append(userMessage);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toLowerCase().includes("video") && lastGeneratedImage) {
      // If the message mentions "video" and we have a last generated image
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: input,
        toolCalls: [
          {
            tool: "generateVideo",
            parameters: {
              prompt: input,
              imageUrl: lastGeneratedImage,
            },
          },
        ],
      };
      await append(userMessage);
      setInput("");
    } else if (input.startsWith("/")) {
      await handleDirectCommand(input);
      setInput("");
    } else {
      handleSubmit(e);
    }
  };

  const handleFormSubmit = handleMessageSubmit;

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <ChatArea
          messages={messages}
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          simulationCode={simulationCode}
          simulationCodeRef={simulationCodeRef}
          generatedImages={generatedImages}
          generatedQuizzes={generatedQuizzes}
          pendingQuizzes={pendingQuizzes}
          pendingImageRequests={pendingImageRequests}
          completedImages={completedImages}
          pendingVisualizations={pendingVisualizations}
          handleAnswerSubmit={handleAnswerSubmit}
          handleImageGeneration={handleImageGeneration}
          handleQuizGeneration={handleQuizGeneration}
          handleVisualization={handleVisualization}
          handleQuizAnswer={handleQuizAnswer}
          onSimulationCode={(code: string) => setSimulationCode(code)}
          generatedVideos={generatedVideos}
          setGeneratedVideos={setGeneratedVideos}
          lastGeneratedImage={lastGeneratedImage}
        />
      </div>
    </TooltipProvider>
  );
}
