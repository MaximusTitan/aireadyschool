"use client";

import { useChat } from "ai/react";
import { SendIcon } from "lucide-react";
import { MathProblem } from "./components/math-problem";
import { QuizCard } from "./components/quiz-card";
import { useEffect, useRef } from "react"; // Add this import

export default function Page() {
  const { messages, input, setInput, handleSubmit, append, isLoading } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswerSubmit = async (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => {
    // Create the evaluation message
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

    // Use append from useChat hook to properly handle the streaming response
    await append(userMessage);
  };

  return (
    <div className="max-w-8xl mx-auto p-4 flex flex-col min-h-[100vh] bg-gradient-to-b from-white to-neutral-50">
      <header className="text-center py-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">
          Learning Buddy
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Ask questions and practice with interactive math problems and quizzes
        </p>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto space-y-4 pb-6 scroll-smooth">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fade-in ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl p-4 shadow-sm
                  transition-all duration-200
                  ${
                    message.role === "user"
                      ? "bg-neutral-800 text-white"
                      : "bg-white hover:shadow-md"
                  }
                `}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                {message.toolInvocations?.map((toolInvocation) => {
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
                    }
                  } else {
                    return (
                      <div key={toolCallId} className="mt-3 animate-pulse">
                        <div className="h-8 bg-indigo-100 rounded w-3/4" />
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="sticky bottom-0">
          <div className="flex gap-2 bg-white p-3 rounded-2xl shadow-lg">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 p-3 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300 text-neutral-600 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 disabled:opacity-50 transition-all"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
