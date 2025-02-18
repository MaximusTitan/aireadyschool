import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { BuddyPanel } from "./buddy";

interface ThreadListProps {
  threads: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onNewThread: () => void;
  messages: any[];
  isLoading: boolean;
}

export function ThreadList({
  threads,
  currentThreadId,
  onThreadSelect,
  onDeleteThread,
  onNewThread,
  messages,
  isLoading,
}: ThreadListProps) {
  const router = useRouter();

  return (
    <div className="w-64 h-full bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={onNewThread}
          variant="default"
          className="w-full flex items-center gap-2"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`p-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center group ${
              currentThreadId === thread.id ? "bg-gray-100" : ""
            }`}
            onClick={() => onThreadSelect(thread.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{thread.title}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(thread.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread.id);
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t">
        <BuddyPanel messages={messages} isLoading={isLoading} />
      </div>
    </div>
  );
}
