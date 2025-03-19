"use client";

import { useChat } from "ai/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatArea } from "./components/chat-area";
import { useChatThread } from "@/app/tools/gen-chat/hooks/useChatThread";
import { ThreadList } from "./components/thread-list";
import { useRouter } from "next/navigation";
import { Message } from "ai";
import { ChatMessage } from "@/types/chat";
import { useLanguageSettings } from "@/app/tools/gen-chat/hooks/useLanguageSettings";
import { useTools } from "@/app/tools/gen-chat/hooks/useTools";

export default function Page() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const { language } = useLanguageSettings();
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

  // State management
  const [showCommands, setShowCommands] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(
    null
  );
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const simulationCodeRef = useRef<string | null>(null);
  const chatRef = useRef<any>(null);
  const [isTeachingMode, setIsTeachingMode] = useState(false);

  // Add this function to handle teaching mode
  const handleTeachingModeToggle = () => {
    setIsTeachingMode(!isTeachingMode);
  };

  // Initialize tools hook
  const tools = useTools({
    lastGeneratedImage,
    setLastGeneratedImage,
  });

  // Initialize chat and handle message saving
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

  // Store chat instance in ref
  chatRef.current = chat;
  const { messages, input, setInput, append, isLoading, setMessages } = chat;

  // Side effects
  useEffect(() => {
    setOpen(false);
    const searchParams = new URLSearchParams(window.location.search);
    const threadParam = searchParams.get("thread");
    if (threadParam) handleThreadSelect(threadParam);
  }, [setOpen]);

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

  // Handle thread operations
  const handleThreadSelect = async (selectedThreadId: string) => {
    try {
      const messages = await loadThread(selectedThreadId);
      if (messages) setMessages(messages);
      router.push(`/tools/gen-chat?thread=${selectedThreadId}`);
    } catch (error) {
      console.error("Failed to load thread:", error);
    }
  };

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

  const handleNewThread = async () => {
    try {
      const newThreadId = await startNewThread();
      setMessages([]);
      router.push(`/tools/gen-chat?thread=${newThreadId}`);
    } catch (error) {
      console.error("Failed to create new thread:", error);
    }
  };

  // Handle direct commands from the user
  const processDirectCommand = async (command: string) => {
    // Ensure thread exists
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

  // Handle message submission
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

      // Create message content once
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
            content: messageContent, // Use the same content
          });
        }

        setInput("");
        if (isTeachingMode) {
          // Automatically switch to interactive mode after generating the lesson
          setIsTeachingMode(false);
        }
      } catch (error) {
        console.error("Message processing failed:", error);
      }
    } catch (error) {
      console.error("Thread creation failed:", error);
    }
  };

  // Process tool answers
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
        />
      </div>
    </TooltipProvider>
  );
}
