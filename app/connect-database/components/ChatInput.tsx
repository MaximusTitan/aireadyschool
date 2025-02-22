import React, { useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  message: string;
  setMessage: (msg: string) => void;
  sendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isFocused?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  sendMessage,
  onKeyDown,
  isFocused,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div className="p-4 border-t dark:border-neutral-700 flex">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your query..."
        className="flex-grow px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-l-lg focus:outline-none"
      />
      <button
        onClick={sendMessage}
        title="Send Message"
        aria-label="Send Message"
        className="bg-rose-300 hover:bg-rose-400 text-white px-4 rounded-r-lg transition-colors duration-200"
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default ChatInput;
