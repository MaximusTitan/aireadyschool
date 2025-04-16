"use client";

import { useChat } from "@ai-sdk/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatArea } from "./components/chat-area";
import { useChatThread } from "@/app/tools/gen-chat/hooks/useChatThread";
import { ThreadList } from "./components/thread-list";
import { useRouter, useSearchParams } from "next/navigation";
import { Message } from "ai";
import { ChatMessage } from "@/types/chat";
import { useLanguageSettings } from "@/app/tools/gen-chat/hooks/useLanguageSettings";
import { useTools } from "@/app/tools/gen-chat/hooks/useTools";
import { createClient } from "@/utils/supabase/client";

/**
 * Main component for the chat page content
 * Manages state and functionality for the chat interface
 */
function ChatPageContent() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const { language } = useLanguageSettings();

  // Thread management hooks and state
  const {
    threadId,
    threads,
    createThread,
    saveMessage,
    loadThread,
    deleteThread,
    startNewThread,
    currentMessages,
    setCurrentMessages,
    isOwner,
  } = useChatThread();

  // User role state
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserRole(user.user_metadata.role ?? null);
      }
    };

    fetchUser();
  }, []);

  // Extract URL parameters
  const searchParams = useSearchParams();
  const teachingModeParam = searchParams.get("teachingMode") === "true";
  const userInputParam = searchParams.get("userInput");
  const assistantMessageParam = searchParams.get("assistantMessage");
  // NEW: Remove direct materials extraction and use state instead
  const [materialsState, setMaterialsState] = useState<
    { id: string; name: string; url: string }[] | undefined
  >(undefined);

  useEffect(() => {
    const materialsParam = searchParams.get("materials");
    if (materialsParam && !materialsState) {
      try {
        const parsedMaterials = JSON.parse(decodeURIComponent(materialsParam));
        setMaterialsState(parsedMaterials);
      } catch (err) {
        console.error("Failed to parse materials:", err);
      }
    }
  }, [materialsState, searchParams]);

  // References to track initialization states
  const userInputInitRef = useRef(false);
  const assistantMessageInitRef = useRef(false);
  const initializationRef = useRef(false);
  const threadInitRef = useRef(false);

  // UI state
  const [showCommands, setShowCommands] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(
    null
  );
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const simulationCodeRef = useRef<string | null>(null);
  const chatRef = useRef<any>(null);
  const [isTeachingMode, setIsTeachingMode] = useState(teachingModeParam);

  // Toggle teaching mode handler
  const handleTeachingModeToggle = () => {
    setIsTeachingMode(!isTeachingMode);
  };

  // Initialize tools for chat functionality
  const tools = useTools({
    lastGeneratedImage,
    setLastGeneratedImage,
  });

  // Set up chat with AI backend
  const chat = useChat({
    api: "/api/gen-chat",
    id: threadId,
    initialMessages: currentMessages.map((msg) => ({
      id: msg.id || String(Date.now()),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })),
    body: {
      id: threadId,
      language,
      teachingMode: isTeachingMode,
    },
    onFinish: useCallback(
      async (message: Message) => {
        // Save completed message to the database
        const messageToSave: ChatMessage = {
          id: String(Date.now()),
          role: message.role as ChatMessage["role"],
          content: message.content,
          createdAt: new Date(),
          toolCalls: (message as any).toolCalls?.map((call: any) => ({
            id: call.id || String(Date.now()),
            tool: call.tool || call.function?.name,
            parameters: call.parameters || call.function?.arguments,
            result: call.result,
            state: (call.state || "result") as "pending" | "result",
          })),
        };
        await saveMessage(messageToSave);
      },
      [saveMessage]
    ),
  });

  // Store chat reference and extract chat functions
  chatRef.current = chat;
  const { messages, input, setInput, append, isLoading, setMessages } = chat;

  // Initialize sidebar state and handle URL thread parameter
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    setOpen(false);
    const searchParams = new URLSearchParams(window.location.search);
    const threadParam = searchParams.get("thread");
    if (threadParam && threadParam !== "new") {
      handleThreadSelect(threadParam);
    }
  }, [setOpen]);

  // Update messages when currentMessages changes
  useEffect(() => {
    if (currentMessages) {
      setMessages(
        currentMessages.map((msg) => ({
          id: msg.id || String(Date.now()),
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }))
      );
    }
  }, [currentMessages, setMessages]);

  // Handle user input from URL parameter
  useEffect(() => {
    if (userInputInitRef.current || !userInputParam) return;
    userInputInitRef.current = true;
    setMessages((prevMessages: ChatMessage[]) => [
      ...prevMessages,
      {
        id: String(Date.now()),
        role: "user",
        content: `User says: ${userInputParam}`,
        createdAt: new Date(),
      },
    ]);
  }, [userInputParam, setMessages]);

  // Handle assistant message from URL parameter
  useEffect(() => {
    if (assistantMessageInitRef.current || !assistantMessageParam) return;
    assistantMessageInitRef.current = true;

    // Function to add the assistant message
    const addAssistantMessage = async (threadIdToUse: string) => {
      // Get decoded content
      const decodedContent = decodeURIComponent(assistantMessageParam);

      // Create message object
      const assistantMsg = {
        id: String(Date.now()),
        role: "assistant" as const,
        content: decodedContent,
        createdAt: new Date(),
        fromHistory: false, // Mark as not from history to enable TTS
      };

      // Add to UI
      setMessages((prevMessages: ChatMessage[]) => [
        ...prevMessages,
        assistantMsg,
      ]);

      // Save to database
      try {
        await saveMessage(assistantMsg, threadIdToUse);
      } catch (error) {
        console.error("Failed to save initial assistant message:", error);
      }
    };

    // If we already have a thread ID, use it
    if (threadId) {
      addAssistantMessage(threadId);
    } else {
      // Otherwise, create a new thread then add the message
      (async () => {
        try {
          const newThreadId = await startNewThread();
          await addAssistantMessage(newThreadId);
          router.push(
            `/tools/gen-chat?thread=${newThreadId}&teachingMode=${isTeachingMode}`
          );
        } catch (error) {
          console.error("Error creating thread for assistant message:", error);
        }
      })();
    }
  }, [
    assistantMessageParam,
    setMessages,
    threadId,
    saveMessage,
    startNewThread,
    isTeachingMode,
    router,
  ]);

  /**
   * Handle thread selection and loading
   */
  const handleThreadSelect = async (selectedThreadId: string) => {
    if (selectedThreadId === "new") {
      const newThreadId = await startNewThread();
      router.push(
        `/tools/gen-chat?thread=${newThreadId}&teachingMode=${isTeachingMode}`
      );
      return;
    }

    try {
      const messages = await loadThread(selectedThreadId);
      if (messages) setMessages(messages);
      router.push(`/tools/gen-chat?thread=${selectedThreadId}`);
    } catch (error) {
      console.error("Failed to load thread:", error);
      const newThreadId = await startNewThread();
      router.push(
        `/tools/gen-chat?thread=${newThreadId}&teachingMode=${isTeachingMode}`
      );
    }
  };

  /**
   * Handle thread deletion
   */
  const handleDeleteThread = async (threadId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteThread(threadId);
        setMessages([]);
        setCurrentMessages([]);
        setInput("");
        chatRef.current = null;
        router.replace("/tools/gen-chat", { scroll: false });
      } catch (error) {
        console.error("Failed to delete thread:", error);
      }
    }
  };

  /**
   * Create a new chat thread
   */
  const handleNewThread = async () => {
    try {
      const newThreadId = await startNewThread();
      setMessages([]);
      router.push(`/tools/gen-chat?thread=${newThreadId}`);
    } catch (error) {
      console.error("Failed to create new thread:", error);
    }
  };

  /**
   * Process direct command (commands that start with /)
   */
  const processDirectCommand = async (command: string) => {
    if (!threadId) {
      const newThreadId = await createThread();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await router.push(`/tools/gen-chat?thread=${newThreadId}`);
    }

    try {
      const baseMessage = await tools.handleDirectCommand(command);
      await saveMessage(baseMessage);
      await append(baseMessage);
    } catch (error) {
      console.error("Failed to process command:", error);
    }
  };

  /**
   * Handle message submission from the chat input
   */
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      let activeThreadId = threadId;
      if (!activeThreadId) {
        activeThreadId = await createThread();
        await router.push(`/tools/gen-chat?thread=${activeThreadId}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!activeThreadId) {
        console.warn("No active thread available");
        return;
      }

      const messageContent = isTeachingMode
        ? `Teach me about: ${input}`
        : input;

      const userMessage: ChatMessage = {
        id: String(Date.now()),
        role: "user",
        content: messageContent,
        createdAt: new Date(),
      };

      try {
        await saveMessage(userMessage, activeThreadId);

        if (input.toLowerCase().includes("video") && lastGeneratedImage) {
          const messageWithTool: ChatMessage = {
            ...userMessage,
            toolCalls: [
              tools.createToolCall("generateVideo", {
                prompt: input,
                imageUrl: lastGeneratedImage,
              }),
            ],
          };
          await append(messageWithTool);
        } else if (input.startsWith("/")) {
          await processDirectCommand(input);
        } else {
          await chatRef.current?.append({
            ...userMessage,
            content: messageContent,
          });
        }

        setInput("");
        if (isTeachingMode) {
          setIsTeachingMode(false);
        }
      } catch (error) {
        console.error("Message processing failed:", error);
      }
    } catch (error) {
      console.error("Thread creation failed:", error);
    }
  };

  /**
   * Process tool answers and add them to the chat
   */
  const processToolAnswer = async (answer: any) => {
    await append(answer);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <ThreadList
          threads={threads}
          currentThreadId={threadId}
          onThreadSelect={handleThreadSelect}
          onDeleteThread={handleDeleteThread}
          onNewThread={handleNewThread}
          messages={messages}
          isLoading={isLoading}
          language={language}
          userRole={userRole ?? ""}
        />
        <ChatArea
          messages={messages}
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleMessageSubmit}
          simulationCode={simulationCode}
          simulationCodeRef={simulationCodeRef}
          generatedImages={tools.generatedImages}
          generatedQuizzes={tools.generatedQuizzes}
          pendingQuizzes={tools.pendingQuizzes}
          pendingImageRequests={tools.pendingImageRequests}
          completedImages={tools.completedImages}
          pendingVisualizations={tools.pendingVisualizations}
          handleQuizAnswer={async (data) => {
            const answer = await tools.handleQuizAnswer(data);
            processToolAnswer(answer);
          }}
          handleImageGeneration={tools.handleImageGeneration}
          handleQuizGeneration={tools.handleQuizGeneration}
          handleVisualization={tools.handleVisualization}
          onSimulationCode={setSimulationCode}
          generatedVideos={tools.generatedVideos}
          setGeneratedVideos={tools.setGeneratedVideos}
          lastGeneratedImage={lastGeneratedImage}
          isOwner={isOwner}
          isTeachingMode={isTeachingMode}
          onTeachingModeToggle={handleTeachingModeToggle}
          generatedAssessments={tools.generatedAssessments}
          pendingAssessments={tools.pendingAssessments}
          handleAssessmentGeneration={tools.handleAssessmentGeneration}
          assessmentIds={tools.assessmentIds}
          // NEW: Pass the state-held materials for persistent debug display
          materials={materialsState}
        />
      </div>
    </TooltipProvider>
  );
}

/**
 * Loading component displayed while the main content is loading
 */
function Loading() {
  return <div className="p-4">Loading...</div>;
}

/**
 * Main page component with Suspense for better loading experience
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatPageContent />
    </Suspense>
  );
}
