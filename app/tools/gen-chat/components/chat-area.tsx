import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MathProblem } from "./math-problem";
import { QuizCard } from "./quiz-card";
import { MindMapViewer } from "./mind-map-viewer";
import { Bot, User, PanelRightClose, PanelRightOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CommandInput } from "./command-input";
import { speakText } from "@/utils/audioUtils";

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
  generatedQuizzes: Record<string, any>;
  pendingQuizzes: Set<string>;
  handleQuizGeneration: (
    toolCallId: string,
    params: { subject: string; difficulty: string }
  ) => Promise<void>;
  handleQuizAnswer: (data: {
    selectedOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    };
    question: string;
    allOptions: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    subject: string;
    difficulty: string;
    explanation: string; // Added this field
  }) => Promise<void>;
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const ChatArea = ({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
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
  generatedQuizzes,
  pendingQuizzes,
  handleQuizGeneration,
  handleQuizAnswer,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null); // Changed to null initially
  const [isTalking, setIsTalking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(
    null
  );
  const lastProcessedMessageRef = useRef<string | null>(null);
  const [pendingTTS, setPendingTTS] = useState<{
    messageId: string;
    content: string;
  } | null>(null);
  const messageBufferRef = useRef<Record<string, string>>({});

  const handleSpeak = async (text: string) => {
    try {
      setIsSpeaking(true);
      await speakText(text);
    } catch (error) {
      console.error("Failed to speak:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Track when messages change to update last message time and trigger talking
  useEffect(() => {
    if (messages.length > 0) {
      const currentTime = Date.now();
      setLastMessageTime(currentTime);
      setIsTalking(true);

      // Stop talking animation after 3 seconds
      const timer = setTimeout(() => {
        setIsTalking(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Updated getGifSource function
  const getGifSource = () => {
    // Speaking takes priority over other states
    if (isSpeaking) {
      return "/o-talking-small.gif";
    }

    // If no messages yet or never interacted, show constant
    if (!lastMessageTime || messages.length === 0) {
      return "/o-constant.gif";
    }

    if (isLoading) {
      return "/O-Thinking.gif";
    }

    if (isTalking) {
      return "/o-talking-small.gif";
    }

    return "/o-constant.gif";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update the message processing effect to accumulate text
  useEffect(() => {
    const processNewMessage = async () => {
      const lastMessage = messages[messages.length - 1];
      if (
        !lastMessage ||
        lastMessage.isHidden ||
        lastMessage.role !== "assistant"
      )
        return;

      // Accumulate message content
      messageBufferRef.current[lastMessage.id] = lastMessage.content;

      // Only process completed messages
      if (!isLoading) {
        const completeContent = messageBufferRef.current[lastMessage.id];
        if (
          completeContent &&
          lastMessage.id !== lastProcessedMessageRef.current
        ) {
          console.log("Processing complete message:", completeContent);
          try {
            lastProcessedMessageRef.current = lastMessage.id;
            setCurrentSpeakingId(lastMessage.id);
            await speakText(completeContent);
          } catch (error) {
            console.error("TTS failed:", error);
          } finally {
            setCurrentSpeakingId(null);
            // Clean up buffer
            delete messageBufferRef.current[lastMessage.id];
          }
        }
      }
    };

    processNewMessage();
  }, [messages, isLoading]);

  // Update message rendering to show speaking state
  const renderMessage = (message: any) => (
    <div
      key={message.id}
      className={cn(
        "flex gap-2",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && (
        <div className="w-6 h-6 rounded-full bg-rose-300 flex items-center justify-center">
          <Bot size={16} />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 border-neutral-200",
          message.role === "user"
            ? "bg-black text-white"
            : "bg-white border border-neutral-200",
          currentSpeakingId === message.id && "ring-2 ring-rose-300"
        )}
      >
        {message.role === "user" ? (
          <div className="text-sm leading-relaxed text-white">
            <span>{message.content}</span>
          </div>
        ) : (
          <div className="relative group">
            <div className="text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown className="prose prose-sm [&>p]:last:mb-0">
                {message.content}
              </ReactMarkdown>
            </div>
            {currentSpeakingId === message.id && (
              <div className="absolute right-2 top-2">
                <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={() => handleSpeak(message.content)}
              className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={currentSpeakingId !== null}
            >
              {currentSpeakingId === message.id ? (
                <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rose-500"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      {message.role === "user" && (
        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
          <span className="text-xs text-white">
            <User size={16} />
          </span>
        </div>
      )}
    </div>
  );

  const toolInvocations = messages.flatMap(
    (message) => message.toolInvocations || []
  );

  return (
    <div className="flex w-full h-full">
      {/* Buddy GIF Column */}
      <div className="w-[10%] relative flex items-center justify-center">
        <div className="w-full px-2">
          <img
            src={getGifSource()}
            alt="AI Assistant"
            className="w-full object-contain"
          />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-[45%] flex flex-col h-full min-w-0 relative border-x">
        <div className="flex-1 overflow-y-auto p-4">
          {messages
            .filter((message: any) => !message.isHidden)
            .map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        <div>
          <CommandInput
            input={input}
            isLoading={isLoading}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      {/* Tools Panel - simplified */}
      <div className="w-[45%] border-l bg-white h-full">
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold p-4 border-b sticky top-0 bg-white z-10">
            Tools
          </h2>
          <div className="flex-1 overflow-y-auto p-4">
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
                      <MathProblem {...result} onAnswer={handleAnswerSubmit} />
                    </div>
                  );
                case "generateQuiz": {
                  // Only generate if we don't have the quiz data and haven't started generating
                  if (
                    !generatedQuizzes[toolCallId] &&
                    result.pending &&
                    !pendingQuizzes.has(toolCallId)
                  ) {
                    handleQuizGeneration(toolCallId, {
                      subject: result.subject,
                      difficulty: result.difficulty,
                    });
                  }

                  // Show loading state
                  if (!generatedQuizzes[toolCallId]) {
                    return (
                      <div key={toolCallId} className="mb-4">
                        <div className="animate-pulse">
                          <div className="h-24 bg-neutral-100 rounded" />
                          <div className="text-xs text-neutral-500 mt-2">
                            Generating quiz...
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const quizData = generatedQuizzes[toolCallId];
                  return (
                    <div key={toolCallId} className="mb-4">
                      <QuizCard {...quizData} onAnswer={handleQuizAnswer} />
                    </div>
                  );
                }
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
                    handleVisualization(result.subject, result.concept).then(
                      (res) => {
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
                      }
                    );
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
    </div>
  );
};
