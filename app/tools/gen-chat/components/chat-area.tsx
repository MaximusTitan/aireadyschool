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
import { ChatAreaProps, ToolCall } from "@/types/chat";

const SimulationWrapper = ({ code }: { code: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: "100%", height: "800px", border: "none" }}
    />
  );
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
  lastGeneratedImage,
  isOwner = true,
  setGeneratedImages,
  setLastGeneratedImage,
  setGeneratedQuizzes, // Add the missing prop
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const { stop: stopAudio, play: playAudio } = useNowPlaying();
  const { isAudioEnabled, toggleAudio } = useAudioSettings();
  const toolsContentRef = useRef<HTMLDivElement>(null);

  const toolInvocations = messages.flatMap(
    (message) => message.toolInvocations || []
  );

  // Collect all tool calls from messages including those loaded from history
  const getAllToolCalls = () => {
    return messages.flatMap(message => {
      // Check for toolCalls directly in the message (from history)
      if (message.toolCalls?.length) {
        return message.toolCalls.map((tool: ToolCall) => ({
          toolName: tool.tool,
          toolCallId: tool.id,
          state: tool.state || 'pending',
          result: tool.result,
          parameters: tool.parameters,
          messageId: message.id
        }));
      }
      
      // Check for toolInvocations (from current session)
      return message.toolInvocations || [];
    });
  };

  const toolCalls = getAllToolCalls();

  // Scroll tools panel to bottom when new tools are added
  useEffect(() => {
    if (toolsContentRef.current) {
      toolsContentRef.current.scrollTop = toolsContentRef.current.scrollHeight;
    }
  }, [toolCalls.length]);

  // Handle talking state
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageTime(Date.now());
      setIsTalking(true);
      const timer = setTimeout(() => setIsTalking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle text-to-speech
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

      if (!response.ok) throw new Error("TTS request failed");

      const audioBlob = await response.blob();
      if (audioBlob.size === 0)
        throw new Error("Empty audio response received");

      await playAudio(audioBlob, "audio/mp3");
      setPlayingMessageId(null);
    } catch (error) {
      console.error("TTS error:", error);
      setPlayingMessageId(null);
    }
  };

  // Auto-play messages
  useEffect(() => {
    const playMessages = async () => {
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

  const renderMessage = (message: any) => {
    // Skip rendering hidden messages
    if (message.isHidden) return null;

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-2 mb-2",
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
          <div
            className={cn(
              "text-sm leading-relaxed",
              message.role === "user" ? "text-white" : "prose prose-sm max-w-none"
            )}
          >
            {message.role === "user" ? (
              <span>{message.content}</span>
            ) : (
              <ReactMarkdown className="prose prose-sm [&>p]:last:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Show tool call indicators in messages */}
          {message.toolCalls?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-neutral-100">
              <div className="text-xs text-neutral-500">
                {message.toolCalls.length === 1 ? '1 tool call' : `${message.toolCalls.length} tool calls`}
              </div>
            </div>
          )}
        </div>
        {message.role === "user" && (
          <div className="w-6 h-6 rounded-full text-white bg-black flex items-center justify-center">
            <User size={16} />
          </div>
        )}
      </div>
    );
  };

  // Handle tool rendering
  const renderTool = (invocation: {
    toolName: string;
    toolCallId: string;
    state: string;
    result: any;
    parameters?: Record<string, any>;
    fromHistory?: boolean;
    messageId?: string;
  }) => {
    const { toolName, toolCallId, state, result, fromHistory } = invocation;

    // If this is a completed tool (state is 'result' AND has result data),
    // just display the result without triggering any API calls
    const isCompletedTool = state === "result" && result && !result.pending;

    // For pending state without result, show a spinner placeholder
    if (state === "pending" && !result) {
      return (
        <div key={toolCallId} className="mb-4 animate-pulse">
          <div className="h-8 bg-indigo-100 rounded w-3/4" />
        </div>
      );
    }

    switch (toolName) {
      case "generateMathProblem":
        // Math problems are processed entirely on the server, so just display results
        return (
          <div key={toolCallId} className="mb-4">
            <MathProblem {...result} onAnswer={handleAnswerSubmit} />
          </div>
        );

      case "generateQuiz": {
        // First check if we already have the quiz in state
        if (generatedQuizzes[toolCallId]) {
          return (
            <div key={toolCallId} className="mb-4">
              <QuizCard
                {...generatedQuizzes[toolCallId]}
                onAnswer={handleQuizAnswer}
              />
            </div>
          );
        }
          
        // If we have result data in the tool result (loaded from history), use it directly
        if (isCompletedTool) {
          // Update local state with this result to avoid future API calls
          if (!generatedQuizzes[toolCallId]) {
            setTimeout(() => {
              setGeneratedQuizzes((prev: Record<string, any>) => ({
                ...prev,
                [toolCallId]: result
              }));
            }, 0);
          }

          return (
            <div key={toolCallId} className="mb-4">
              <QuizCard
                {...result}
                onAnswer={handleQuizAnswer}
              />
            </div>
          );
        }

        // Only generate if we don't have the quiz data and haven't started generating
        if (
          !isCompletedTool && 
          !pendingQuizzes.has(toolCallId) &&
          !generatedQuizzes[toolCallId]
        ) {
          handleQuizGeneration(toolCallId, {
            subject: result?.subject || invocation.parameters?.subject || "general",
            difficulty: result?.difficulty || invocation.parameters?.difficulty || "easy",
          });
        }

        // Show loading state
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

      case "generateImage": {
        // Check if we already have this image in state
        const existingImage = generatedImages[toolCallId];
        
        // If we already have the image, display it
        if (existingImage) {
          return (
            <div key={toolCallId} className="mb-4 space-y-2">
              {existingImage.url === "error" ? (
                <div className="text-sm text-red-500">
                  Failed to generate image. Please try again.
                </div>
              ) : (
                <>
                  <img
                    src={existingImage.url}
                    alt={invocation.parameters?.prompt || "Generated image"}
                    className="w-full max-w-md rounded-lg"
                    loading="lazy"
                  />
                  <div className="text-xs text-neutral-500">
                    Credits remaining: {existingImage.credits}
                  </div>
                </>
              )}
            </div>
          );
        }
        
        // If we have a result with URL directly in the tool call (loaded from history), use it
        if (isCompletedTool && result.url) {
          // Update local state with this image to avoid future API calls
          setTimeout(() => {
            setGeneratedImages((prev: Record<string, { url: string; credits: number }>) => ({
              ...prev,
              [toolCallId]: {
                url: result.url,
                credits: result.credits || 0
              }
            }));
            completedImages.add(toolCallId);
            
            // Update last generated image reference if needed
            if (!lastGeneratedImage) {
              setLastGeneratedImage(result.url);
            }
          }, 0);
          
          return (
            <div key={toolCallId} className="mb-4 space-y-2">
              <img
                src={result.url}
                alt={invocation.parameters?.prompt || "Generated image"}
                className="w-full max-w-md rounded-lg"
                loading="lazy"
              />
              <div className="text-xs text-neutral-500">
                Credits remaining: {result.credits || "N/A"}
              </div>
            </div>
          );
        }
        
        // Only trigger generation if needed and not already in progress
        // and not a completed tool from history
        const shouldTriggerGeneration =
          !isCompletedTool &&
          !existingImage &&
          !pendingImageRequests.has(toolCallId) &&
          !completedImages.has(toolCallId);

        if (shouldTriggerGeneration) {
          console.log(`Generating new image for toolCallId: ${toolCallId}`);
          handleImageGeneration(toolCallId, {
            prompt: invocation.parameters?.prompt || "",
            style: invocation.parameters?.style || "realistic_image",
            imageSize: invocation.parameters?.imageSize || "square_hd",
            numInferenceSteps: invocation.parameters?.numInferenceSteps || 1,
            numImages: invocation.parameters?.numImages || 1,
            enableSafetyChecker: invocation.parameters?.enableSafetyChecker ?? true,
          });
        }

        // Show loading state
        if (pendingImageRequests.has(toolCallId)) {
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

        return null;
      }

      case "conceptVisualizer": {
        if (simulationCode) {
          return (
            <div key={toolCallId} className="mb-4">
              <SimulationWrapper code={simulationCode} />
            </div>
          );
        }

        // If this is a completed tool from history with a visualization result
        if (isCompletedTool && result.visualization) {
          setTimeout(() => {
            let cleaned = result.visualization.trim();
            if (cleaned.startsWith("```html")) {
              cleaned = cleaned
                .replace(/^```html\s*/, "")
                .replace(/```$/, "")
                .trim();
            }
            simulationCodeRef.current = cleaned;
            onSimulationCode(cleaned);
          }, 0);
          
          return (
            <div key={toolCallId} className="mb-4">
              <div className="text-sm text-neutral-600">Loading visualization...</div>
            </div>
          );
        }

        // Only generate if not completed and not already pending
        if (!isCompletedTool && !pendingVisualizations.has(toolCallId)) {
          pendingVisualizations.add(toolCallId);
          handleVisualization(
            invocation.parameters?.subject || "physics",
            invocation.parameters?.concept || ""
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
      }

      case "generateMindMap": {
        // If we have a completed mind map from history
        if (isCompletedTool) {
          return (
            <div key={toolCallId} className="mb-4">
              <MindMapViewer data={result} />
            </div>
          );
        }
        
        return (
          <div key={toolCallId} className="mb-4">
            <MindMapViewer data={result || {topic: invocation.parameters?.topic || ""}} />
          </div>
        );
      }

      case "generateVideo": {
        // First check if we already have the video URL in state
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
        
        // If we have a completed video URL from history
        if (isCompletedTool && result.videoUrl) {
          // Update state with this video to avoid future generation
          setTimeout(() => {
            setGeneratedVideos({
              ...generatedVideos,
              [toolCallId]: result.videoUrl
            });
          }, 0);
          
          return (
            <div key={toolCallId} className="mb-4">
              <video
                src={result.videoUrl}
                controls
                className="w-full rounded-lg"
              />
            </div>
          );
        }

        // Otherwise, show the video generator
        const imageSource = invocation.parameters?.imageUrl || 
                           result?.imageUrl || 
                           lastGeneratedImage;

        return (
          <div key={toolCallId} className="mb-4">
            <VideoGenerator
              toolCallId={toolCallId}
              onComplete={handleVideoComplete}
              prompt={invocation.parameters?.prompt || ""}
              initialImage={imageSource}
            />
          </div>
        );
      }

      default:
        console.log(`Unknown tool type: ${toolName}`);
        return null;
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Chat Panel */}
      <div className="w-[50%] flex-shrink-0 flex flex-col h-full border-x">
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {messages
              ?.filter((message: any) => !message.isHidden)
              .map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <CommandInput
            input={input}
            isLoading={isLoading}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isOwner={isOwner} // Pass isOwner prop
          />
        </div>
      </div>

      {/* Tools Panel */}
      <div className="w-[50%] h-full flex-shrink-0 border-l bg-white overflow-hidden">
        <div className="h-full flex flex-col">
          <h2 className="flex-shrink-0 text-lg font-semibold p-4 border-b bg-white sticky top-0 z-10">
            Tools
          </h2>
          <div ref={toolsContentRef} className="flex-1 overflow-y-auto p-4">
            {toolCalls.map(renderTool)}
          </div>
        </div>
      </div>
    </div>
  );
};
