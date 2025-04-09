import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, Volume2, VolumeX, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CommandInput } from "./command-input";
import { useNowPlaying } from "@/app/tools/gen-chat/hooks/useNowPlaying";
import { useAudioSettings } from "@/app/tools/gen-chat/hooks/useAudioSettings";
import { ChatAreaProps } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ToolRenderer } from "./ToolRenderer";
import { FileViewer } from "@/app/tools/lesson-planner/components/file-viewer";

/**
 * ChatArea component that displays messages and tools in a split-screen layout
 * Handles message rendering, audio playback, and tool interactions
 */
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
  isTeachingMode = false,
  onTeachingModeToggle,
  generatedAssessments,
  pendingAssessments,
  handleAssessmentGeneration,
  assessmentIds,
  materials,
}: ChatAreaProps) => {
  // Refs for managing DOM elements and state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolsContentRef = useRef<HTMLDivElement>(null);
  const ttsControllerRef = useRef<AbortController | null>(null);
  const activeFetchRequests = useRef<AbortController[]>([]);
  const prevIsLoadingRef = useRef(isLoading);

  // State management
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Custom hooks for audio functionality
  const { stop: stopAudio, play: playAudio } = useNowPlaying();
  const {
    isAudioEnabled,
    toggleAudio,
    hasUserInteracted,
    markUserInteraction,
  } = useAudioSettings();

  // Extract tool invocations from all messages
  const toolInvocations = messages.flatMap(
    (message) => message.toolInvocations || []
  );

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clean up TTS controller if active
      if (ttsControllerRef.current) {
        try {
          ttsControllerRef.current.abort();
          ttsControllerRef.current = null;
        } catch (err) {
          console.error("Error aborting TTS controller:", err);
        }
      }

      // Stop any playing audio
      stopAudio();

      // Clean up any active fetch requests
      activeFetchRequests.current.forEach((controller) => {
        try {
          controller.abort();
        } catch (err) {
          console.error("Error aborting fetch controller:", err);
        }
      });
      activeFetchRequests.current = [];
    };
  }, [stopAudio]);

  // Scroll tools panel to bottom when new tools are added
  useEffect(() => {
    if (toolsContentRef.current) {
      toolsContentRef.current.scrollTop = toolsContentRef.current.scrollHeight;
    }
  }, [toolInvocations.length]);

  // Handle talking state animation
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageTime(Date.now());
      setIsTalking(true);
      const timer = setTimeout(() => setIsTalking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up event listeners for user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      markUserInteraction();
    };

    // Common user interaction events
    const events = ["click", "keydown", "touchstart", "mousedown"];

    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [markUserInteraction]);

  // Watch for loading state changes to trigger TTS when assistant stops generating
  useEffect(() => {
    if (
      prevIsLoadingRef.current &&
      !isLoading &&
      messages.length > 0 &&
      isAudioEnabled &&
      hasUserInteracted
    ) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "assistant" &&
        typeof lastMessage.content === "string" &&
        !lastMessage.fromHistory
      ) {
        handleTTS(lastMessage.id, lastMessage.content);
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, messages, isAudioEnabled, hasUserInteracted]);

  /**
   * Handles text-to-speech functionality for assistant messages
   * Manages playing and stopping audio with proper request cleanup
   */
  const handleTTS = async (messageId: string, text: string) => {
    try {
      if (playingMessageId === messageId) {
        stopAudio();
        setPlayingMessageId(null);
        return;
      }

      stopAudio();
      setPlayingMessageId(messageId);

      if (!hasUserInteracted) {
        console.log(
          "User has not interacted with the page yet, skipping audio playback"
        );
        setPlayingMessageId(null);
        return;
      }

      // Clean text for TTS - remove markdown formatting
      const cleanText = text
        .replace(/\[.*?\]/g, "") // Remove markdown links
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.*?)\*/g, "$1") // Remove italic
        .replace(/`(.*?)`/g, "$1") // Remove code blocks
        .trim();

      // Create a new abort controller for this request
      ttsControllerRef.current = new AbortController();

      // Add to active requests list
      activeFetchRequests.current.push(ttsControllerRef.current);

      const response = await fetch(`/api/gen-chat-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
        }),
        signal: ttsControllerRef.current.signal,
      });

      // Remove from active requests list
      activeFetchRequests.current = activeFetchRequests.current.filter(
        (controller) => controller !== ttsControllerRef.current
      );

      if (!response.ok) throw new Error("TTS request failed");

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.type === "audio" && data.content) {
        // Create a Blob from the base64 audio
        const binaryString = atob(data.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "audio/mpeg" });

        // Play the audio using our existing audio player
        await playAudio(blob, "audio/mpeg");
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("TTS error:", error);
      }
      setPlayingMessageId(null);
    }
  };

  /**
   * Updates the generated videos state when a video is completed
   */
  const handleVideoComplete = (toolCallId: string, videoUrl: string) => {
    setGeneratedVideos({ ...generatedVideos, [toolCallId]: videoUrl });
  };

  /**
   * Toggles audio on/off and handles stopping any playing audio
   */
  const handleAudioToggle = () => {
    if (isAudioEnabled && playingMessageId) {
      stopAudio();
      setPlayingMessageId(null);
    }
    toggleAudio();
  };

  /**
   * Handles example prompts from the welcome screen
   * Sets the input value and triggers form submission
   */
  const handleExampleClick = async (examplePrompt: string) => {
    onInputChange(examplePrompt);
    // Allow state to update before submitting
    setTimeout(() => {
      const submitEvent = new Event("submit", {
        cancelable: true,
        bubbles: true,
      });
      const formElement = document.querySelector("form");
      if (formElement) {
        formElement.dispatchEvent(submitEvent);
      }
    }, 10);
  };

  /**
   * Renders an individual message with proper styling based on role
   */
  const renderMessage = (message: any) => (
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
      </div>
      {message.role === "user" && (
        <div className="w-6 h-6 rounded-full text-white bg-black flex items-center justify-center">
          <User size={16} />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full h-screen">
      {/* Chat Panel - Left side */}
      <div className="w-[50%] flex-shrink-0 flex flex-col h-full border-x">
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-2 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Chat</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTeachingModeToggle}
              className={cn(
                "h-8 px-2",
                isTeachingMode && "bg-rose-100 text-rose-700"
              )}
            >
              <BookOpen size={16} className="mr-1" />
              {isTeachingMode ? "Teaching" : "Interactive"}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAudioToggle}
            className="h-8 w-8 p-0"
            aria-label={isAudioEnabled ? "Disable audio" : "Enable audio"}
          >
            {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {messages?.length > 0 ? (
              messages
                ?.filter((message: any) => !message.isHidden)
                .map(renderMessage)
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center px-4">
                <div className="text-3xl font-bold text-neutral-500 mb-4">
                  Agent Buddy
                </div>
                <div className="text-neutral-400 max-w-md mb-8">
                  <p>Welcome to your Personalized AI Tutor!</p>
                  <p className="mt-2">
                    Click on a prompt below to get started:
                  </p>
                </div>

                <div className="grid gap-4 w-full max-w-lg">
                  <button
                    onClick={() =>
                      handleExampleClick(
                        "Hey buddy, I have an upcoming exam on Physics. Can you help me understand the concepts of force and motion better?"
                      )
                    }
                    className="p-4 border rounded-lg hover:border-rose-300 hover:bg-rose-50 text-left transition-all"
                  >
                    <p className="font-medium text-neutral-800">
                      Help with exam preparation
                    </p>
                    <p className="text-sm text-neutral-500">
                      "Hey buddy, I have an upcoming exam on Physics. Can you
                      help me understand the concepts of force and motion
                      better?"
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleExampleClick(
                        "I'd like to learn about machine learning. Can you create a mindmap to help me understand the key concepts?"
                      )
                    }
                    className="p-4 border rounded-lg hover:border-rose-300 hover:bg-rose-50 text-left transition-all"
                  >
                    <p className="font-medium text-neutral-800">
                      Learn with mindmaps
                    </p>
                    <p className="text-sm text-neutral-500">
                      "I'd like to learn about machine learning. Can you create
                      a mindmap to help me understand the key concepts?"
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleExampleClick(
                        "Can you generate a helpful visualization to explain how photosynthesis works?"
                      )
                    }
                    className="p-4 border rounded-lg hover:border-rose-300 hover:bg-rose-50 text-left transition-all"
                  >
                    <p className="font-medium text-neutral-800">
                      Visual learning
                    </p>
                    <p className="text-sm text-neutral-500">
                      "Can you generate a helpful visualization to explain how
                      photosynthesis works?"
                    </p>
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <CommandInput
            input={input}
            isLoading={isLoading}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isOwner={isOwner}
            isTeachingMode={isTeachingMode}
          />
        </div>
      </div>

      {/* Tools Panel - Right side */}
      <div className="w-[50%] h-full flex-shrink-0 border-l bg-white overflow-hidden">
        <div className="h-full flex flex-col">
          <h2 className="flex-shrink-0 text-lg font-semibold p-4 border-b bg-white sticky top-0 z-10">
            Tools
          </h2>
          <div ref={toolsContentRef} className="flex-1 overflow-y-auto p-4">
            {toolInvocations.map((invocation) => (
              <ToolRenderer
                key={invocation.toolCallId}
                invocation={invocation}
                generatedImages={generatedImages}
                pendingImageRequests={pendingImageRequests}
                completedImages={completedImages}
                pendingVisualizations={pendingVisualizations}
                simulationCode={simulationCode}
                simulationCodeRef={simulationCodeRef}
                onSimulationCode={onSimulationCode}
                handleImageGeneration={handleImageGeneration}
                handleVisualization={handleVisualization}
                generatedQuizzes={generatedQuizzes}
                pendingQuizzes={pendingQuizzes}
                handleQuizGeneration={handleQuizGeneration}
                handleQuizAnswer={handleQuizAnswer}
                generatedVideos={generatedVideos}
                handleVideoComplete={handleVideoComplete}
                lastGeneratedImage={lastGeneratedImage}
                generatedAssessments={generatedAssessments}
                pendingAssessments={pendingAssessments}
                handleAssessmentGeneration={handleAssessmentGeneration}
                assessmentIds={assessmentIds}
              />
            ))}
            {materials && materials.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Materials</h3>
                <div className="grid gap-4">
                  {materials.map((mat) => (
                    <FileViewer
                      key={mat.id}
                      file={{ ...mat, type: "material" }} // add a default type property
                      canDelete={false} // disable deletion in Gen-Chat
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
