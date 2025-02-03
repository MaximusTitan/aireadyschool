"use client";

import { useChat } from "ai/react";
import { SendIcon } from "lucide-react";
import { MathProblem } from "./components/math-problem";
import { QuizCard } from "./components/quiz-card";
import { useEffect, useRef, useState } from "react";

const AVAILABLE_COMMANDS = [
  {
    command: "@math",
    description: "Generate math problems",
    examples: ["@math easy addition", "@math medium multiplication"],
  },
  {
    command: "@quiz",
    description: "Create interactive quizzes",
    examples: ["@quiz science easy", "@quiz history medium"],
  },
  {
    command: "@image",
    description: "Generate educational images",
    examples: ["@image solar system realistic", "@image cell structure vector"],
  },
];

export default function Page() {
  const { messages, input, setInput, handleSubmit, append, isLoading } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  // Add a Set to track pending image requests
  const [pendingImageRequests] = useState(() => new Set<string>());
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [completedImages] = useState(() => new Set<string>());
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, { url: string; credits: number }>
  >({});

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswerSubmit = async (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => {
    // Create the evaluation message
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

    // Use append from useChat hook to properly handle the streaming response
    await append(userMessage);
  };

  const handleDirectCommand = async (command: string) => {
    const parts = command.slice(1).split(" "); // Remove @ and split
    const toolName = parts[0].toLowerCase();

    if (toolName === "math") {
      const level = parts[1] || "easy";
      const topic = parts[2] || "addition";

      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `Generate a ${level} ${topic} math problem`,
        toolCalls: [
          {
            tool: "generateMathProblem",
            parameters: { level, topic },
          },
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
          {
            tool: "generateQuiz",
            parameters: { subject, difficulty },
          },
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowCommands(value.startsWith("@") && !value.includes(" "));
  };

  // Add function to handle image generation
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
    // Check if this request is already pending or completed
    if (
      pendingImageRequests.has(toolCallId) ||
      completedImages.has(toolCallId)
    ) {
      return;
    }

    // Add to pending requests
    pendingImageRequests.add(toolCallId);

    try {
      const response = await fetch("/api/generate-recraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();

      // Remove from pending and mark as completed
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

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col min-h-[100vh]">
      <header className="py-4 flex justify-between items-center">
        <h1 className="text-lg font-medium text-neutral-800">Learning Buddy</h1>
        {remainingCredits !== null && (
          <div className="text-sm text-neutral-500">
            Credits: {remainingCredits}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden flex flex-col gap-2">
        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[85%] rounded-lg px-3 py-2
                  ${
                    message.role === "user"
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100"
                  }
                `}
              >
                <div className="text-sm">{message.content}</div>
                {message.toolInvocations?.map((toolInvocation) => {
                  const { toolName, toolCallId, state } = toolInvocation;

                  if (state === "result") {
                    if (toolName === "generateMathProblem") {
                      return (
                        <div key={toolCallId} className="mt-3">
                          <MathProblem
                            {...toolInvocation.result}
                            onAnswer={handleAnswerSubmit}
                          />
                        </div>
                      );
                    } else if (toolName === "generateQuiz") {
                      return (
                        <div key={toolCallId} className="mt-3">
                          <QuizCard
                            {...toolInvocation.result}
                            onAnswer={(isCorrect) =>
                              handleAnswerSubmit({
                                studentAnswer: isCorrect ? 1 : 0,
                                correctAnswer: 1,
                                question: "Quiz Question",
                                topic: "quiz",
                                level: "basic",
                              })
                            }
                          />
                        </div>
                      );
                    } else if (
                      toolName === "generateImage" &&
                      toolInvocation.result.pending
                    ) {
                      const { prompt, style, imageSize } =
                        toolInvocation.result;

                      // Only trigger image generation if not already pending or completed
                      if (
                        !pendingImageRequests.has(toolCallId) &&
                        !completedImages.has(toolCallId)
                      ) {
                        handleImageGeneration(toolCallId, {
                          prompt,
                          style,
                          imageSize,
                          numInferenceSteps: 1,
                          numImages: 1,
                          enableSafetyChecker: true,
                        });
                      }

                      return (
                        <div key={toolCallId} className="mt-3">
                          <div className="space-y-2">
                            {generatedImages[toolCallId] ? (
                              generatedImages[toolCallId].url === "error" ? (
                                <div className="text-sm text-red-500">
                                  Failed to generate image. Please try again.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <img
                                    src={generatedImages[toolCallId].url}
                                    alt={prompt}
                                    className="max-w-96 rounded-lg"
                                  />
                                  <div className="text-xs text-neutral-500">
                                    Credits remaining:{" "}
                                    {generatedImages[toolCallId].credits}
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="animate-pulse">
                                <div className="h-48 bg-neutral-100 rounded" />
                                <div className="text-xs text-neutral-500 mt-2">
                                  Generating image...
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  } else {
                    return (
                      <div key={toolCallId} className="mt-3 animate-pulse">
                        <div className="h-8 bg-indigo-100 rounded w-3/4" />
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className="sticky bottom-0">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Message..."
              className="flex-1 p-2 rounded-lg bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-neutral-800 text-white rounded-lg disabled:opacity-50"
            >
              <SendIcon className="w-4 h-4" />
            </button>

            {showCommands && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white rounded-lg shadow-sm border border-neutral-200">
                {AVAILABLE_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.command}
                    className="w-full p-2 text-left hover:bg-neutral-50 text-sm"
                    onClick={() => {
                      setInput(cmd.command + " ");
                      setShowCommands(false);
                    }}
                  >
                    <span className="font-medium">{cmd.command}</span>
                    <span className="text-neutral-500 ml-2">
                      {cmd.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
