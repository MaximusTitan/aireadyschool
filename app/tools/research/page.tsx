"use client";

import { useState, useEffect } from "react";
import { ResearchSidebar } from "./components/research-sidebar";
import { ResearchViewer } from "./components/research-viewer";
import { ChatInterface } from "./components/chat-interface";
import { ReferencesPanel } from "./components/references-panel";
import { ResearchEntry, Message } from "./types";
import { createClient } from "@/utils/supabase/client";
import { Inter } from "next/font/google";
import { ErrorBoundaryWrapper } from "./components/error-boundary-wrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { extractReferences } from "./utils/extract-references";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function ResearchPage() {
  // Main state
  const [researchContent, setResearchContent] = useState("");
  const [selectedResearch, setSelectedResearch] = useState<ResearchEntry | undefined>(undefined);
  const [references, setReferences] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [researchHistory, setResearchHistory] = useState<ResearchEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const router = useRouter();

  // Get user email when component mounts
  useEffect(() => {
    const getUserEmail = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    
    getUserEmail();
  }, []);

  // Load initial research history
  useEffect(() => {
    const loadInitialResearchHistory = async () => {
      if (!userEmail) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_history_new")
          .select("*")
          .eq("email", userEmail)
          .order("timestamp", { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          console.log("Loaded initial research history:", data.length, "items");
          setResearchHistory(data);
        }
      } catch (error) {
        console.error("Error loading initial research history:", error);
      }
    };
    
    if (userEmail) {
      loadInitialResearchHistory();
    }
  }, [userEmail]);

  // Create a new chat
  const handleNewChat = () => {
    console.log("Creating new chat");
    // Generate new thread ID
    const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentThreadId(newThreadId);
    
    // Reset UI state
    setSelectedResearch(undefined);
    setResearchContent("");
    setReferences([]);
    setIsEditing(false);
  };

  // Select an existing research from history
  const handleSelectResearch = (research: ResearchEntry) => {
    console.log("Selected research with thread_id:", research.thread_id);
    setSelectedResearch(research);
    setResearchContent(research.response);
    setCurrentThreadId(research.thread_id || research.id);
    
    // Extract references from response
    if (research.references && Array.isArray(research.references) && research.references.length > 0) {
      setReferences(research.references);
    } else if (research.references_json && Array.isArray(research.references_json) && research.references_json.length > 0) {
      setReferences(research.references_json);
    } else {
      // Extract references from response if they're not already available
      const extractedRefs = extractReferences(research.response);
      setReferences(extractedRefs);
    }
  };

  // Update content after editing
  const handleContentUpdate = async (newContent: string) => {
    if (!selectedResearch) return;
    
    setResearchContent(newContent);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("chat_history_new")
        .update({ response: newContent })
        .eq("id", selectedResearch.id);
      
      if (error) throw error;
      
      // Update local state
      setSelectedResearch({
        ...selectedResearch,
        response: newContent
      });
      
      toast.success("Research updated successfully");
    } catch (error) {
      console.error("Error updating research:", error);
      toast.error("Failed to update research");
    }
  };

  // Handle new chat message submission
  const handleSubmitQuery = async (query: string) => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("User not authenticated");
      }
      
      // Determine if this is a new thread or continuing an existing one
      const threadId = currentThreadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const isNewThread = !currentThreadId;
      
      // Log thread info for debugging
      console.log("Thread info:", { threadId, isNewThread, currentThreadId });
      
      // Create a copy of the current conversation with the new user message
      const currentConversation = selectedResearch?.conversation || [];
      const userMessage: Message = { role: "user", content: query };
      
      // Update the UI immediately with the user's message
      const updatedResearch = selectedResearch ? {
        ...selectedResearch,
        conversation: [...currentConversation, userMessage]
      } : {
        id: `temp-${Date.now()}`,
        email: user.email,
        prompt: query,
        response: "",
        timestamp: new Date().toISOString(),
        conversation: [userMessage],
        thread_id: threadId
      };
      
      // Update state to reflect user's message immediately
      setSelectedResearch(updatedResearch);
      
      // Call the research API
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedResearch.conversation, // Send the updated conversation
          email: user.email,
          thread_id: threadId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create the assistant's message
      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.content, 
        references: data.references || [] 
      };
      
      // Add the assistant's response to the conversation
      const finalConversation = [
        ...updatedResearch.conversation,
        assistantMessage
      ];
      
      // For new threads, set content directly
      // For existing threads, append to existing content
      const newContent = isNewThread 
        ? data.content
        : `${researchContent}\n\n${data.content}`;
      
      // Create or update research entry
      const newResearch: ResearchEntry = {
        id: data.id || selectedResearch?.id || Date.now().toString(),
        email: user.email,
        prompt: isNewThread ? query : selectedResearch?.prompt || query,
        response: newContent,
        references: data.references || [],
        references_json: data.references || [],
        thread_id: threadId,
        timestamp: new Date().toISOString(),
        conversation: finalConversation
      };
      
      // If it's not a new thread, update the existing entry
      if (!isNewThread && selectedResearch?.id) {
        try {
          // Try to update by thread_id first
          const { data: updateData, error: updateError } = await supabase
            .from("chat_history_new")
            .update({
              response: newContent,
              references_json: data.references || [],
              conversation: finalConversation,
              timestamp: new Date().toISOString()
            })
            .eq("thread_id", threadId);
          
          // If that fails, try updating by ID
          if (updateError) {
            console.log("Failed to update by thread_id, trying by id:", selectedResearch.id);
            const { error: idUpdateError } = await supabase
              .from("chat_history_new")
              .update({
                response: newContent,
                references_json: data.references || [],
                conversation: finalConversation,
                thread_id: threadId, // Ensure thread_id is set
                timestamp: new Date().toISOString()
              })
              .eq("id", selectedResearch.id);
              
            if (idUpdateError) {
              console.error("Error updating by ID:", idUpdateError);
            } else {
              console.log("Successfully updated by ID");
            }
          } else {
            console.log("Successfully updated by thread_id");
          }
        } catch (dbError) {
          console.error("Database update error:", dbError);
        }
      } else {
        // Insert new entry
        const { error: insertError } = await supabase
          .from("chat_history_new")
          .insert([newResearch]);
          
        if (insertError) {
          console.error("Error inserting new research:", insertError);
        }
      }
      
      // Set current thread ID to ensure conversation continuity
      if (isNewThread) {
        setCurrentThreadId(threadId);
      }
      
      // Update state with new data
      setSelectedResearch(newResearch);
      setResearchContent(newContent);
      setReferences(data.references || []);
      
      // Refresh history list to show new/updated entries
      if (user.email) {
        try {
          const { data: historyData } = await supabase
            .from("chat_history_new")
            .select("*")
            .eq("email", user.email)
            .order("timestamp", { ascending: false });
            
          if (historyData) {
            setResearchHistory(historyData);
          }
        } catch (historyError) {
          console.error("Error fetching updated history:", historyError);
        }
      }
      
    } catch (error) {
      console.error("Error submitting research query:", error);
      toast.error("Failed to get research results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-backgroundApp ${inter.className}`}>
      {/* Sidebar with Chat/History tabs */}
      <div className="w-80 border-r bg-background flex-shrink-0 h-full">
        <ResearchSidebar
          onNewChat={handleNewChat}
          onSelectResearch={handleSelectResearch}
          onSubmitQuery={handleSubmitQuery}
          userEmail={userEmail}
          isLoading={isLoading}
          researchHistory={researchHistory}
          setResearchHistory={setResearchHistory}
          selectedResearch={selectedResearch} // Pass selectedResearch prop
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b bg-background">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/tools">
              <Button variant="outline" size="sm" className="border-neutral-500">
                ← Back to Tools
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-rose-500">Research Assistant</h1>
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main panel */}
          <div className="flex-1 overflow-auto p-4">
            <ErrorBoundaryWrapper>
              <ResearchViewer
                content={researchContent}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onContentUpdate={handleContentUpdate}
                selectedResearch={selectedResearch}
                onSubmitQuery={handleSubmitQuery}
                isLoading={isLoading}
              />
            </ErrorBoundaryWrapper>
          </div>

          {/* Right panel - now only references */}
          <div className="w-72 border-l bg-background overflow-hidden">
            <ReferencesPanel references={references} />
          </div>
        </div>
      </div>
    </div>
  );
}