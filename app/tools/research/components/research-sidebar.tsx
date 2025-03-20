"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchEntry } from "../types";
import { createClient } from "@/utils/supabase/client";
import { ChatInterface } from "./chat-interface";

interface ResearchSidebarProps {
  onNewChat: () => void;
  onSelectResearch: (research: ResearchEntry) => void;
  onSubmitQuery: (query: string) => Promise<void>;
  userEmail: string | null;
  isLoading: boolean;
  researchHistory: ResearchEntry[];
  setResearchHistory: React.Dispatch<React.SetStateAction<ResearchEntry[]>>;
  selectedResearch?: ResearchEntry; // Add this prop
}

export function ResearchSidebar({
  onNewChat,
  onSelectResearch,
  onSubmitQuery,
  userEmail,
  isLoading,
  researchHistory,
  setResearchHistory,
  selectedResearch,
}: ResearchSidebarProps) {
  const [showChat, setShowChat] = useState(true); // Start with chat by default
  const [searchQuery, setSearchQuery] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter research history based on search query
  const filteredHistory = searchQuery
    ? researchHistory.filter((item) =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : researchHistory;

  return (
    <div className="flex flex-col h-full">
      {/* Header with buttons */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 mb-2 bg-rose-600 hover:bg-rose-700 text-white"
        >
          <PlusCircle className="h-4 w-4" /> New Research
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search history..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Toggle between history and chat */}
      <div className="flex border-b">
        <Button 
          variant="ghost"
          className={`flex-1 rounded-none transition-colors ${!showChat ? "bg-gray-100 border-b-2 border-rose-500 text-gray-900 font-medium" : ""}`}
          onClick={() => setShowChat(false)}
        >
          History
        </Button>
        <Button 
          variant="ghost"
          className={`flex-1 rounded-none transition-colors ${showChat ? "bg-gray-100 border-b-2 border-rose-500 text-gray-900 font-medium" : ""}`}
          onClick={() => setShowChat(true)}
        >
          Chat
        </Button>
      </div>

      {/* Content area - either chat or history list */}
      <div className="flex-1 overflow-hidden">
        {showChat ? (
          // Chat interface when in chat mode
          <div className="h-full">
            <ChatInterface
              selectedResearch={selectedResearch}
              onSubmitQuery={onSubmitQuery}
              isLoading={isLoading}
            />
          </div>
        ) : (
          // History list when in history mode
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {isHistoryLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-md" />
                  ))}
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectResearch(item)}
                    className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedResearch?.id === item.id ? "bg-gray-100 border-l-4 border-rose-500" : ""
                    }`}
                  >
                    <h4 className="font-medium truncate">{item.prompt}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No matching items found" : "No research history yet"}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
