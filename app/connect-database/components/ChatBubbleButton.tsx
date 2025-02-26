// ChatToggleButton.tsx
"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface ChatBubbleButtonProps {
  onClick: () => void;
}

const ChatBubbleButton: React.FC<ChatBubbleButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        title="Open Chat"
        onClick={onClick}
        className="bg-rose-300 hover:bg-rose-400 text-white rounded-full p-3 shadow-lg transition-colors duration-200"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default ChatBubbleButton;
