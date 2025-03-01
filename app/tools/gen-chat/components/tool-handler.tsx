"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ToolCall, ToolState } from "@/types/chat";
import { updateToolOutput } from "./save-tools";

interface ToolHandlerProps {
  messageId: string;
  toolCall: ToolCall;
  onComplete?: (result: any) => void;
}

export function ToolHandler({ messageId, toolCall, onComplete }: ToolHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const updateToolResult = async (result: any, state: 'result' | 'error' = 'result') => {
    try {
      const { success, error } = await updateToolOutput(
        supabase,
        messageId,
        toolCall.id,
        result,
        state
      );

      if (!success && error) {
        throw new Error(error);
      }
      
      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      console.error('Failed to update tool result:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tool result');
    }
  };

  useEffect(() => {
    // Handle automatic tool processing if needed
    const processToolCall = async () => {
      // Only process pending tools without results
      if (toolCall.state !== 'pending' || toolCall.result) {
        return;
      }

      setIsLoading(true);
      try {
        // Process the tool based on its type
        // This is just a placeholder - the actual implementation would depend on your tools
        switch (toolCall.tool) {
          // Add automatic processing logic here if needed
          default:
            // Most tools will be handled by their specific components
            break;
        }
      } catch (err) {
        console.error(`Error processing tool ${toolCall.tool}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Update the database with the error
        await updateToolResult({ error: `Failed to process tool: ${toolCall.tool}` }, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    processToolCall();
  }, [toolCall.id, toolCall.tool, toolCall.state]);

  return null; // This is a logic component with no UI
}
