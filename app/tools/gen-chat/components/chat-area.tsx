import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MathProblem } from "./math-problem";
import { QuizCard } from "./quiz-card";
import { MindMapViewer } from "./mind-map-viewer";
import { Bot, User, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CommandInput } from "./command-input";
import { useNowPlaying } from "@/app/hooks/useNowPlaying";
import { useAudioSettings } from "@/app/hooks/useAudioSettings";
import { VideoGenerator } from "./video-generator";

const GIF_URLS = {
  constant:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//o-constant.gif",
  talking:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//o-talking-small.gif",
  thinking:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//O-Thinking.gif",
};

// Add this hook before SimulationWrapper
const usePreloadImages = (urls: string[]) => {
  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);
};

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
  generatedVideos: Record<string, string>;
  setGeneratedVideos: (videos: Record<string, string>) => void;
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
  generatedVideos,
  setGeneratedVideos,
}: ChatAreaProps) => {
  usePreloadImages(Object.values(GIF_URLS));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const { stop: stopAudio, play: playAudio } = useNowPlaying();
  const { isAudioEnabled, toggleAudio } = useAudioSettings();

  useEffect(() => {
    if (messages.length > 0) {
      const currentTime = Date.now();
      setLastMessageTime(currentTime);
      setIsTalking(true);

      const timer = setTimeout(() => {
        setIsTalking(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const getGifSource = () => {
    if (!lastMessageTime || messages.length === 0) {
      return GIF_URLS.constant;
    }

    if (isLoading) {
      return GIF_URLS.thinking;
    }

    if (isTalking) {
      return GIF_URLS.talking;
    }

    return GIF_URLS.constant;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTTS = async (messageId: string, text: string) => {
    try {
      if (playingMessageId === messageId) {
        stopAudio();
        setPlayingMessageId(null);
        return;
      }

      stopAudio();
      setPlayingMessageId(messageId);

      const response = await fetch(`/api/gen-chat-tts?model=aura-asteria-en`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(text),
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error("Empty audio response received");
      }

      await playAudio(audioBlob, "audio/mp3");
      setPlayingMessageId(null);
    } catch (error) {
      console.error("TTS error:", error);
      setPlayingMessageId(null);
    }
  };

  // Updated auto-play effect
  useEffect(() => {
    const playMessages = async () => {
      // Only proceed if audio is explicitly enabled
      if (!isAudioEnabled || isLoading || playingMessageId) return;

      for (const message of messages) {
        if (
          message.role === "assistant" &&
          !message.hasBeenPlayed &&
          typeof message.content === "string"
        ) {
          message.hasBeenPlayed = true;
          await handleTTS(message.id, message.content);
          break;
        }
      }
    };

    playMessages();
  }, [messages, isAudioEnabled, isLoading, playingMessageId]);

  const handleVideoComplete = (toolCallId: string, videoUrl: string) => {
    setGeneratedVideos({ ...generatedVideos, [toolCallId]: videoUrl });
  };

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
            : "bg-white border border-neutral-200"
        )}
      >
        {message.role === "user" ? (
          <div className="text-sm leading-relaxed text-white">
            <span>{message.content}</span>
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown className="prose prose-sm [&>p]:last:mb-0">
              {message.content}
            </ReactMarkdown>
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
          <div className="absolute top-2 right-6 flex flex-col items-center gap-2">
            <button
              onClick={toggleAudio}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white hover:bg-gray-50 transition-colors border border-gray-200"
              title={isAudioEnabled ? "Disable audio" : "Enable audio"}
            >
              {isAudioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="text-sm">Audio Off</span>
                </>
              )}
            </button>
          </div>
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
                case "generateVideo": {
                  if (generatedVideos[toolCallId]) {
                    return (
                      <div key={toolCallId} className="mb-4">
                        <video
                          src={generatedVideos[toolCallId]}
                          controls
                          className="w-full rounded-lg"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId} className="mb-4">
                      <VideoGenerator
                        toolCallId={toolCallId}
                        onComplete={handleVideoComplete}
                        prompt={result.prompt}
                      />
                    </div>
                  );
                }
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
