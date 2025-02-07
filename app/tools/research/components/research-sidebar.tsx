"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResearchEntry } from "../types";

interface ResearchSidebarProps {
  onNewChat: () => void;
  onSelectResearch: (research: ResearchEntry) => void;
}

export function ResearchSidebar({
  onNewChat,
  onSelectResearch,
}: ResearchSidebarProps) {
  const [researches, setResearches] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResearchHistory();
  }, []);

  const fetchResearchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research-chat-history`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();
      if (!data.chatHistory) {
        throw new Error("Chat history data is missing from the response");
      }
      setResearches(data.chatHistory);
    } catch (err) {
      console.error("Error fetching research history:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching research history"
      );
    } finally {
      setLoading(false);
    }
  };

  const groupResearchesByDate = (researches: ResearchEntry[]) => {
    const groups: { [key: string]: ResearchEntry[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    researches.forEach((research) => {
      const date = new Date(research.timestamp);
      if (format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
        groups.Today.push(research);
      } else if (
        format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")
      ) {
        groups.Yesterday.push(research);
      } else if (date > weekAgo) {
        groups["Previous 7 Days"].push(research);
      } else {
        groups.Older.push(research);
      }
    });

    return groups;
  };

  const groupedResearches = groupResearchesByDate(researches);

  return (
    <aside className="w-40 bg-gray-50 border-r flex flex-col min-h-screen max-h-screen overflow-hidden">
      <div className="p-2 border-b shrink-0">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center gap-1 text-xs"
        >
          <PlusCircle className="h-3 w-3" />
          New Research
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {error && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={fetchResearchHistory} className="mt-2 text-xs">
              Retry
            </Button>
          </Alert>
        )}
        {loading ? (
          <div className="p-4 text-gray-500 text-sm">Loading...</div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(groupedResearches).map(([group, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    {items.map((research) => (
                      <button
                        key={research.id}
                        onClick={() => onSelectResearch(research)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-xs font-medium truncate">
                          {research.prompt}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {format(
                            new Date(research.timestamp),
                            "MMM d, h:mm a"
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
