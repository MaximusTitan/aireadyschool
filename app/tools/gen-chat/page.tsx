"use client";

import { useChat } from "ai/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { ChatArea } from "./components/chat-area";
import { useChatThread } from "@/app/hooks/useChatThread";
import { ThreadList } from "./components/thread-list";
import { useRouter } from "next/navigation";
import { Message } from "ai";
import { ChatMessage, ToolCall, ToolState } from "@/types/chat";
import { useLanguageSettings } from "@/app/hooks/useLanguageSettings";
import { createClient } from "@/utils/supabase/client";

// Simplified interfaces
interface GeneratedImage {
  url: string;
  credits: number;
}

export default function Page() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const { language } = useLanguageSettings();
  const supabase = createClient();
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
    isOwner, // Add this
  } = useChatThread();

  // State management
  const [showCommands, setShowCommands] = useState(false);
  const [pendingImageRequests] = useState(() => new Set<string>());
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [completedImages] = useState(() => new Set<string>());
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, GeneratedImage>
  >({});
  const [pendingVisualizations] = useState(() => new Set<string>());
  const [pendingQuizzes] = useState(() => new Set<string>());
  const [generatedQuizzes, setGeneratedQuizzes] = useState<Record<string, any>>(
    {}
  );
  const [generatedVideos, setGeneratedVideos] = useState<
    Record<string, string>
  >({});
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(
    null
  );
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const simulationCodeRef = useRef<string | null>(null);
  const chatRef = useRef<any>(null);

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
    body: { id: threadId, language },
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
            state: (call.state || "result") as ToolState,
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

  // Initialize chat state
  useEffect(() => {
    if (currentMessages.length > 0) {
      // Process any tool calls from history
      currentMessages.forEach(msg => {
        if (msg.toolCalls?.length) {
          msg.toolCalls.forEach(toolCall => {
            // Handle specific tool types based on their state
            if (toolCall.state === 'pending') {
              // Process pending tools
              processHistoricalToolCall(msg.id, toolCall);
            } else if (toolCall.state === 'result' && toolCall.result) {
              // Update our local state with completed tool results
              updateLocalToolState(toolCall);
            }
          });
        }
      });
    }
  }, [currentMessages]);

  // Helper function to create tool calls
  const createToolCall = (
    tool: string,
    parameters: Record<string, any>
  ): ToolCall => ({
    id: String(Date.now()),
    tool,
    parameters,
    state: "pending",
  });

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

  // Tool handlers
  const handleQuizAnswer = useCallback(
    async (data: {
      selectedOption: { id: string; text: string; isCorrect: boolean };
      question: string;
      allOptions: Array<{ id: string; text: string; isCorrect: boolean }>;
      subject: string;
      difficulty: string;
      explanation: string;
    }) => {
      const userMessage = {
        id: String(Date.now()),
        role: "user" as const,
        content: `I chose: "${data.selectedOption.text}" for the question: "${data.question}"`,
        toolCalls: [
          {
            tool: "evaluateQuizAnswer",
            parameters: {
              selectedAnswer: data.selectedOption,
              question: data.question,
              allOptions: data.allOptions,
              subject: data.subject,
              difficulty: data.difficulty,
              explanation: data.explanation,
              isCorrect: data.selectedOption.isCorrect,
            },
          },
        ],
        isHidden: true,
      };
      await append(userMessage);
    },
    [append]
  );

  const handleAnswerSubmit = async (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => {
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
    await append(userMessage);
  };

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
    if (pendingImageRequests.has(toolCallId) || completedImages.has(toolCallId))
      return;

    pendingImageRequests.add(toolCallId);
    try {
      const response = await fetch("/api/gen-chat-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      pendingImageRequests.delete(toolCallId);
      completedImages.add(toolCallId);

      if (data.images?.[0]) {
        const imageUrl = data.images[0].url;
        setLastGeneratedImage(imageUrl);
        setGeneratedImages((prev) => ({
          ...prev,
          [toolCallId]: {
            url: imageUrl,
            credits: data.remainingCredits,
          },
        }));
        setRemainingCredits(data.remainingCredits);
        
        // Find the message ID for this tool call
        const messageWithTool = currentMessages.find(msg => 
          msg.toolCalls?.some(tc => tc.id === toolCallId)
        );
        
        if (messageWithTool) {
          // Update the tool result in the database
          await updateToolResult(messageWithTool.id, toolCallId, {
            url: imageUrl,
            credits: data.remainingCredits,
          });
        }
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

  const handleQuizGeneration = useCallback(
    async (
      toolCallId: string,
      params: {
        subject: string;
        difficulty: string;
      }
    ) => {
      if (pendingQuizzes.has(toolCallId)) return;

      pendingQuizzes.add(toolCallId);
      try {
        const response = await fetch("/api/gen-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) throw new Error("Failed to generate quiz");

        const data = await response.json();
        setGeneratedQuizzes((prev) => ({ ...prev, [toolCallId]: data }));
      } catch (error) {
        console.error("Quiz generation failed:", error);
        setGeneratedQuizzes((prev) => ({
          ...prev,
          [toolCallId]: { error: "Failed to generate quiz" },
        }));
      } finally {
        pendingQuizzes.delete(toolCallId);
      }
    },
    [pendingQuizzes]
  );

  const handleVisualization = async (subject: string, concept: string) => {
    try {
      const response = await fetch("/api/generate-visualization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, concept }),
      });

      if (!response.ok) throw new Error("Failed to generate visualization");

      const { visualization } = await response.json();
      return { code: visualization };
    } catch (error) {
      console.error("Visualization generation failed:", error);
      return { error: "Failed to generate visualization" };
    }
  };

  const handleDirectCommand = async (command: string) => {
    // Ensure thread exists
    if (!threadId) {
      const newThreadId = await createThread();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await router.push(`/tools/gen-chat?thread=${newThreadId}`);
    }

    const parts = command.slice(1).split(" ");
    const toolName = parts[0].toLowerCase();
    const baseMessage = {
      id: String(Date.now()),
      role: "user" as const,
      createdAt: new Date(),
      content: "",
      toolCalls: [] as ToolCall[],
    };

    switch (toolName) {
      case "math":
        const level = parts[1] || "easy";
        const topic = parts[2] || "addition";
        baseMessage.content = `Generate a ${level} ${topic} math problem`;
        baseMessage.toolCalls = [
          createToolCall("generateMathProblem", { level, topic }),
        ];
        break;
      case "quiz":
        const subject = parts[1] || "general";
        const difficulty = parts[2] || "easy";
        baseMessage.content = `Generate a ${difficulty} quiz about ${subject}`;
        baseMessage.toolCalls = [
          createToolCall("generateQuiz", { subject, difficulty }),
        ];
        break;
      case "image":
        const prompt = parts.slice(1, -1).join(" ");
        const style = parts[parts.length - 1] || "realistic_image";
        baseMessage.content = `Generate an educational image about: ${prompt}`;
        baseMessage.toolCalls = [
          createToolCall("generateImage", {
            prompt,
            style,
            imageSize: "square_hd",
            numInferenceSteps: 1,
            numImages: 1,
            enableSafetyChecker: true,
          }),
        ];
        break;
      case "visualize":
        const vizSubject = parts[1] || "physics";
        const concept = parts.slice(2).join(" ") || "";
        baseMessage.content = `Generate a visualization of ${concept} ${vizSubject}`;
        baseMessage.toolCalls = [
          createToolCall("generateVisualization", {
            subject: vizSubject,
            concept,
          }),
        ];
        break;
      case "mindmap":
        const mindmapTopic = parts.slice(1).join(" ");
        baseMessage.content = `Generate a mind map about ${mindmapTopic}`;
        baseMessage.toolCalls = [
          createToolCall("generateMindMap", { mindmapTopic }),
        ];
        break;
      case "video":
        const videoPrompt = parts.slice(1).join(" ");
        baseMessage.content = `Generate a video with this description: ${videoPrompt}`;
        baseMessage.toolCalls = [
          createToolCall("generateVideo", {
            prompt: videoPrompt,
            imageUrl: lastGeneratedImage,
          }),
        ];
        break;
      default:
        baseMessage.content = `Unknown command: ${command}`;
        baseMessage.toolCalls = [];
    }

    try {
      await saveMessage(baseMessage);
      await append(baseMessage);
    } catch (error) {
      console.error("Failed to save command message:", error);
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

      const userMessage: ChatMessage = {
        id: String(Date.now()),
        role: "user",
        content: input,
        createdAt: new Date(),
      };

      try {
        await saveMessage(userMessage, activeThreadId);

        if (input.toLowerCase().includes("video") && lastGeneratedImage) {
          const messageWithTool: ChatMessage = {
            ...userMessage,
            toolCalls: [
              createToolCall("generateVideo", {
                prompt: input,
                imageUrl: lastGeneratedImage,
              }),
            ],
          };
          await append(messageWithTool);
        } else if (input.startsWith("/")) {
          await handleDirectCommand(input);
        } else {
          await chatRef.current?.append(userMessage);
        }

        setInput("");
      } catch (error) {
        console.error("Message processing failed:", error);
      }
    } catch (error) {
      console.error("Thread creation failed:", error);
    }
  };

  // Function to process historical tool calls
  const processHistoricalToolCall = async (messageId: string, toolCall: ToolCall) => {
    switch (toolCall.tool) {
      case 'generateMathProblem':
        // No need to reprocess, just update UI state
        break;
        
      case 'generateQuiz':
        if (!generatedQuizzes[toolCall.id]) {
          // Extract required parameters with type safety
          const params = {
            subject: toolCall.parameters.subject || 'general',
            difficulty: toolCall.parameters.difficulty || 'easy'
          };
          handleQuizGeneration(toolCall.id, params);
        }
        break;
        
      case 'generateImage':
        if (!generatedImages[toolCall.id] && !pendingImageRequests.has(toolCall.id)) {
          const imageParams = {
            prompt: toolCall.parameters.prompt || '',
            style: toolCall.parameters.style || 'realistic_image',
            imageSize: toolCall.parameters.imageSize || 'square_hd',
            numInferenceSteps: toolCall.parameters.numInferenceSteps || 1,
            numImages: toolCall.parameters.numImages || 1,
            enableSafetyChecker: toolCall.parameters.enableSafetyChecker ?? true
          };
          handleImageGeneration(toolCall.id, imageParams);
        }
        break;
        
      case 'generateVideo':
        if (!generatedVideos[toolCall.id]) {
          // For videos, we might need the last image
          const imageUrl = toolCall.parameters.imageUrl || lastGeneratedImage;
          if (imageUrl) {
            // Start video processing
          }
        }
        break;
        
      // Add other tool types as needed
    }
  };

  // Function to update local state based on completed tool results
  const updateLocalToolState = (toolCall: ToolCall) => {
    if (!toolCall.result) return;
    
    switch (toolCall.tool) {
      case 'generateImage':
        if (toolCall.result.url) {
          setGeneratedImages(prev => ({
            ...prev,
            [toolCall.id]: {
              url: toolCall.result.url,
              credits: toolCall.result.credits || 0
            }
          }));
        }
        break;
        
      case 'generateQuiz':
        setGeneratedQuizzes(prev => ({
          ...prev,
          [toolCall.id]: toolCall.result
        }));
        break;
        
      case 'generateVideo':
        if (toolCall.result.videoUrl) {
          setGeneratedVideos(prev => ({
            ...prev,
            [toolCall.id]: toolCall.result.videoUrl
          }));
        }
        break;
        
      // Handle other tool types
    }
  };

  // Update tool result in database
  const updateToolResult = async (messageId: string, toolCallId: string, result: any) => {
    try {
      const { error } = await supabase
        .from('tool_outputs')
        .update({ 
          result,
          state: 'result' 
        })
        .match({
          message_id: messageId,
          tool_call_id: toolCallId
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update tool result:', error);
    }
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
          generatedImages={generatedImages}
          generatedQuizzes={generatedQuizzes}
          pendingQuizzes={pendingQuizzes}
          pendingImageRequests={pendingImageRequests}
          completedImages={completedImages}
          pendingVisualizations={pendingVisualizations}
          handleAnswerSubmit={handleAnswerSubmit}
          handleImageGeneration={handleImageGeneration}
          handleQuizGeneration={handleQuizGeneration}
          handleVisualization={handleVisualization}
          handleQuizAnswer={handleQuizAnswer}
          onSimulationCode={setSimulationCode}
          generatedVideos={generatedVideos}
          setGeneratedVideos={setGeneratedVideos}
          lastGeneratedImage={lastGeneratedImage}
          isOwner={isOwner}
        />
      </div>
    </TooltipProvider>
  );
}
