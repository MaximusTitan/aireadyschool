"use client";

import { useEffect, useState, useRef } from "react";
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
  const processedRef = useRef(false);

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
    // Skip if already processed or if result exists and state is not pending
    if (processedRef.current || (toolCall.result && toolCall.state !== 'pending')) {
      return;
    }

    // Check if this is a new tool call that needs processing
    const processToolCall = async () => {
      // Only process pending tools without results
      if (toolCall.state !== 'pending' || toolCall.result) {
        return;
      }

      setIsLoading(true);
      processedRef.current = true;
      
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
  }, [toolCall.id, toolCall.tool, toolCall.state, toolCall.result]);

  return null; // This is a logic component with no UI
}
