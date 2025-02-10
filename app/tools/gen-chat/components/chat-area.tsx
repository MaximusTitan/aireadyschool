import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MathProblem } from "./math-problem";
import { QuizCard } from "./quiz-card";
import { MindMapViewer } from "./mind-map-viewer";
import { Bot, User, PanelRightClose, PanelRightOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

// SimulationWrapper moved here
const SimulationWrapper = ({ code }: { code: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);
  return (
    <iframe
      ref={iframeRef}
      style={{ width: "100%", height: "800px", border: "none" }} // increased height
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
  onSimulationCode: (code: string) => void;
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
  onSimulationCode,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toolInvocations = messages.flatMap(
    (message) => message.toolInvocations || []
  );

  const hasActiveTools = toolInvocations.length > 0;

  return (
    <div className="flex flex-1 pb-20 relative">
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-4 p-4 transition-all duration-300",
          hasActiveTools && isToolsPanelOpen ? "mr-[33%]" : ""
        )}
      >
        {messages.map((message) => (
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
                "max-w-[85%] rounded-2xl px-4 py-2 border-neutral-200",
                message.role === "user"
                  ? " text-white"
                  : "bg-white border border-neutral-200"
              )}
            >
              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  className={message.role === "user" ? "text-white" : ""}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {/* Removed inline tool output rendering */}
              {/* // ...existing code... */}
            </div>
            {message.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-neutral-500 flex items-center justify-center">
                <span className="text-xs text-white">
                  <User size={16} />
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {hasActiveTools && (
        <>
          <div
            className={cn(
              "fixed right-0 top-[57px] bottom-[80px] flex transition-transform duration-300", // Changed bottom-0 to bottom-[80px]
              isToolsPanelOpen
                ? "translate-x-0"
                : "translate-x-[calc(100%-24px)]"
            )}
          >
            <button
              onClick={() => setIsToolsPanelOpen(!isToolsPanelOpen)}
              className="h-12 -ml-6 mt-4 flex items-center justify-center w-6 bg-white border border-neutral-200 rounded-l-md hover:bg-neutral-50"
            >
              {isToolsPanelOpen ? (
                <PanelRightClose size={14} />
              ) : (
                <PanelRightOpen size={14} />
              )}
            </button>
            <div className="w-[33vw] border-l bg-white max-h-[calc(100vh-137px)]">
              {" "}
              {/* Adjusted max-height */}
              <div className="h-full overflow-y-auto p-4">
                {toolInvocations.map((invocation: any) => {
                  const { toolName, toolCallId, state, result } = invocation;
                  // For pending state, show a spinner placeholder
                  if (state !== "result") {
                    return (
                      <div key={toolCallId} className="mb-4 animate-pulse">
                        <div className="h-8 bg-indigo-100 rounded w-3/4" />
                      </div>
                    );
                  }
                  switch (toolName) {
                    case "generateMathProblem":
                      return (
                        <div key={toolCallId} className="mb-4">
                          <MathProblem
                            {...result}
                            onAnswer={handleAnswerSubmit}
                          />
                        </div>
                      );
                    case "generateQuiz":
                      return (
                        <div key={toolCallId} className="mb-4">
                          <QuizCard
                            {...result}
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
                    case "generateImage": {
                      const shouldTriggerGeneration =
                        result.pending &&
                        !pendingImageRequests.has(toolCallId) &&
                        !completedImages.has(toolCallId);

                      if (shouldTriggerGeneration) {
                        handleImageGeneration(toolCallId, {
                          prompt: result.prompt,
                          style: result.style,
                          imageSize: result.imageSize || "square_hd",
                          numInferenceSteps: 1,
                          numImages: 1,
                          enableSafetyChecker: true,
                        });
                      }

                      if (!generatedImages[toolCallId] && result.pending) {
                        return (
                          <div key={toolCallId} className="mb-4">
                            <div className="animate-pulse">
                              <div className="h-48 bg-neutral-100 rounded" />
                              <div className="text-xs text-neutral-500 mt-2">
                                Generating image...
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const imageData = generatedImages[toolCallId];
                      if (!imageData) return null;

                      return (
                        <div key={toolCallId} className="mb-4 space-y-2">
                          {imageData.url === "error" ? (
                            <div className="text-sm text-red-500">
                              Failed to generate image. Please try again.
                            </div>
                          ) : (
                            <>
                              <img
                                src={imageData.url}
                                alt={result.prompt}
                                className="w-full max-w-md rounded-lg"
                                loading="lazy"
                              />
                              <div className="text-xs text-neutral-500">
                                Credits remaining: {imageData.credits}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    case "conceptVisualizer":
                      if (simulationCode) {
                        return (
                          <div key={toolCallId} className="mb-4">
                            <SimulationWrapper code={simulationCode} />
                          </div>
                        );
                      }
                      if (!pendingVisualizations.has(toolCallId)) {
                        pendingVisualizations.add(toolCallId);
                        handleVisualization(
                          result.subject,
                          result.concept
                        ).then((res) => {
                          if (res.code) {
                            let cleaned = res.code.trim();
                            if (cleaned.startsWith("```html")) {
                              cleaned = cleaned
                                .replace(/^```html\s*/, "")
                                .replace(/```$/, "")
                                .trim();
                            }
                            simulationCodeRef.current = cleaned;
                            onSimulationCode(cleaned);
                          }
                        });
                      }
                      return (
                        <div key={toolCallId} className="mb-4">
                          <div className="animate-pulse">
                            <div className="h-48 bg-neutral-100 rounded" />
                            <div className="text-xs text-neutral-500 mt-2">
                              Generating visualization...
                            </div>
                          </div>
                        </div>
                      );
                    case "generateMindMap":
                      return (
                        <div key={toolCallId} className="mb-4">
                          <MindMapViewer data={result} />
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
