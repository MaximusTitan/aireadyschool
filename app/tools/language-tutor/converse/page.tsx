"use client";

import { useState } from "react";

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your language learning friend. What would you like to practice today? 🌟" }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);
    setIsLoading(true);
    const newMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from AI");
      }

      if (!data.response) {
        throw new Error("No response received from AI");
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sorry, I had trouble understanding that. Could you try again?";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    // TODO: Implement speech-to-text
    setIsListening(true);
  };

  const stopListening = () => {
    // TODO: Implement speech-to-text stop
    setIsListening(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-pink-600">
        Practice Conversation with AI 🤖
      </h1>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="h-96 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-pink-100 ml-auto'
                  : 'bg-gray-100'
              } max-w-[80%]`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-pulse text-gray-500">AI is thinking...</div>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-2 rounded-lg ${
              isListening ? 'bg-red-500' : 'bg-pink-500'
            } text-white`}
            disabled={isLoading}
          >
            {isListening ? 'Stop' : '🎤'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}