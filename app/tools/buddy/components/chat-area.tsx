import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, Volume2, VolumeX, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CommandInput } from "./command-input";
import { useNowPlaying } from "@/app/tools/buddy/hooks/useNowPlaying";
import { useAudioSettings } from "@/app/tools/buddy/hooks/useAudioSettings";
import { ChatAreaProps } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ToolRenderer } from "./ToolRenderer";

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
  isTeachingMode = false,
  onTeachingModeToggle,
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const { stop: stopAudio, play: playAudio } = useNowPlaying();
  const {
    isAudioEnabled,
    toggleAudio,
    hasUserInteracted,
    markUserInteraction,
  } = useAudioSettings();
  const toolsContentRef = useRef<HTMLDivElement>(null);
  const ttsControllerRef = useRef<AbortController | null>(null);

  // Add ref to track previous isLoading state
  const prevIsLoadingRef = useRef(isLoading);

  const toolInvocations = messages.flatMap(
    (message) => message.toolInvocations || []
  );

  // Scroll tools panel to bottom when new tools are added
  useEffect(() => {
    if (toolsContentRef.current) {
      toolsContentRef.current.scrollTop = toolsContentRef.current.scrollHeight;
    }
  }, [toolInvocations.length]);

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

  // Add event listeners to capture user interaction with the page
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

      if (!hasUserInteracted) {
        console.log(
          "User has not interacted with the page yet, skipping audio playback"
        );
        setPlayingMessageId(null);
        return;
      }

      // Clean text for TTS
      const cleanText = text
        .replace(/\[.*?\]/g, "") // Remove markdown links
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.*?)\*/g, "$1") // Remove italic
        .replace(/`(.*?)`/g, "$1") // Remove code blocks
        .trim();

      // Create a new abort controller for this request
      ttsControllerRef.current = new AbortController();

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

  // Watch for loading state changes to trigger TTS only when finishing text generation.
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

  const handleVideoComplete = (toolCallId: string, videoUrl: string) => {
    setGeneratedVideos({ ...generatedVideos, [toolCallId]: videoUrl });
  };

  const handleAudioToggle = () => {
    if (isAudioEnabled && playingMessageId) {
      stopAudio();
      setPlayingMessageId(null);
    }
    toggleAudio();
  };

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
      {/* Chat Panel */}
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
                handleAnswerSubmit={handleAnswerSubmit}
                handleImageGeneration={handleImageGeneration}
                handleVisualization={handleVisualization}
                generatedQuizzes={generatedQuizzes}
                pendingQuizzes={pendingQuizzes}
                handleQuizGeneration={handleQuizGeneration}
                handleQuizAnswer={handleQuizAnswer}
                generatedVideos={generatedVideos}
                handleVideoComplete={handleVideoComplete}
                lastGeneratedImage={lastGeneratedImage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
