import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MathProblem } from "./math-problem";
import { QuizCard } from "./quiz-card";
import { MindMapViewer } from "./mind-map-viewer";
import { Bot, User } from "lucide-react";

// SimulationWrapper moved here
const SimulationWrapper = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const simulationDiv = document.createElement("div");
      simulationDiv.innerHTML = code;
      containerRef.current.appendChild(simulationDiv);
      const scripts = simulationDiv.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const newScript = document.createElement("script");
        newScript.text = script.text;
        script.parentNode?.replaceChild(newScript, script);
      }
    }
  }, [code]);
  return (
    <div
      ref={containerRef}
      className="w-full border rounded-lg p-4 bg-white shadow-md"
    />
  );
};

type ChatAreaProps = {
  messages: any[];
  simulationCode: string | null;
  simulationCodeRef: React.MutableRefObject<string | null>;
  generatedImages: Record<string, { url: string; credits: number }>;
  pendingImageRequests: Set<string>;
  completedImages: Set<string>;
  pendingVisualizations: Set<string>;
  handleAnswerSubmit: (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => Promise<void>;
  handleImageGeneration: (
    toolCallId: string,
    params: {
      prompt: string;
      style: string;
      imageSize: string;
      numInferenceSteps: number;
      numImages: number;
      enableSafetyChecker: boolean;
    }
  ) => Promise<void>;
  handleVisualization: (
    subject: string,
    concept: string
  ) => Promise<{ code?: string }>;
};

export const ChatArea = ({
  messages,
  simulationCode,
  simulationCodeRef,
  generatedImages,
  pendingImageRequests,
  completedImages,
  pendingVisualizations,
  handleAnswerSubmit,
  handleImageGeneration,
  handleVisualization,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-2",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="w-6 h-6 rounded-full bg-rose-300 flex items-center justify-center">
              <span className="text-xs text-neutral-800">
                <Bot size={16} />
              </span>
            </div>
          )}
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm",
              message.role === "user"
                ? "bg-neutral-800 text-white"
                : "bg-white border border-neutral-200"
            )}
          >
            <div className="text-sm leading-relaxed">{message.content}</div>
            {message.toolInvocations?.map((toolInvocation: any) => {
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
                  const { prompt, style, imageSize } = toolInvocation.result;
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
                } else if (
                  toolName === "conceptVisualizer" &&
                  toolInvocation.result.pending
                ) {
                  if (simulationCode) return null;
                  if (!pendingVisualizations.has(toolCallId)) {
                    pendingVisualizations.add(toolCallId);
                    handleVisualization(
                      toolInvocation.result.subject,
                      toolInvocation.result.concept
                    ).then((result) => {
                      if (result.code) {
                        let cleaned = result.code.trim();
                        if (cleaned.startsWith("```html")) {
                          cleaned = cleaned
                            .replace(/^```html\s*/, "")
                            .replace(/```$/, "")
                            .trim();
                        }
                        simulationCodeRef.current = cleaned;
                        // Using a setter is expected in parent for simulationCode update.
                      }
                    });
                  }
                  return (
                    <div key={toolCallId} className="mt-3">
                      <div className="animate-pulse">
                        <div className="h-48 bg-neutral-100 rounded" />
                        <div className="text-xs text-neutral-500 mt-2">
                          Generating visualization...
                        </div>
                      </div>
                    </div>
                  );
                } else if (toolName === "generateMindMap") {
                  return (
                    <div key={toolCallId} className="mt-3">
                      <MindMapViewer data={toolInvocation.result} />
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
              return null;
            })}
            {message.role === "assistant" &&
              simulationCode &&
              index === messages.length - 1 && (
                <div className="my-4 w-full">
                  <SimulationWrapper code={simulationCode} />
                </div>
              )}
          </div>
          {message.role === "user" && (
            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">
              <span className="text-xs text-white">
                <User size={16} />
              </span>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};
