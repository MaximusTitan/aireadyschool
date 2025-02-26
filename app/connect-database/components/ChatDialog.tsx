import React from "react";

export interface ChatMessage {
  text: string;
  isUser: boolean;
  naturalLanguageResponse?: string;
  error?: string;
}

interface ChatDialogProps {
  messages: ChatMessage[];
}

const ChatDialog: React.FC<ChatDialogProps> = ({ messages }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`p-2 rounded-lg ${
            msg.isUser
              ? "bg-neutral-100 dark:bg-neutral-700"
              : msg.error
                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                : "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
          }`}
        >
          {msg.text}
          {msg.error && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <p className="text-xs font-semibold mb-1">Error:</p>
              <pre className="text-xs overflow-x-auto">{msg.error}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatDialog;
