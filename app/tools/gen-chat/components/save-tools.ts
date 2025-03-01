import { SupabaseClient } from '@supabase/supabase-js';

export type ToolState = 'pending' | 'result' | 'error';

export interface ToolOutput {
  message_id: string;
  tool_name: string;
  tool_call_id?: string;
  parameters?: Record<string, any>;
  result?: Record<string, any>;
  state: ToolState;
}

export async function updateToolOutput(
  supabase: SupabaseClient,
  messageId: string,
  toolCallId: string,
  result: Record<string, any>,
  state: 'result' | 'error' = 'result'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tool_outputs')
      .update({
        result,
        state,
      })
      .match({
        message_id: messageId,
        tool_call_id: toolCallId,
      });

    if (error) {
      return {
        success: false,
        error: `Failed to update tool output: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating tool output:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getToolOutputsForMessage(
  supabase: SupabaseClient,
  messageId: string
): Promise<{
  data?: ToolOutput[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tool_outputs')
      .select('*')
      .eq('message_id', messageId);

    if (error) {
      return { error: `Failed to fetch tool outputs: ${error.message}` };
    }

    console.log(`[ToolOutputs] Retrieved ${data?.length || 0} tool outputs for message ${messageId}`);
    
    return { data: data as ToolOutput[] };
  } catch (error) {
    console.error('Unexpected error fetching tool outputs:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Fix the return type to include the state property
export async function checkToolResult(
  supabase: SupabaseClient,
  toolCallId: string
): Promise<{
  exists: boolean;
  result?: any;
  state?: ToolState; // Add state to the return type
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tool_outputs')
      .select('result, state')
      .eq('tool_call_id', toolCallId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return { exists: false };
      }
      return { exists: false, error: `Failed to check tool result: ${error.message}` };
    }

    return { 
      exists: !!data,
      result: data?.result,
      state: data?.state as ToolState // Cast to ToolState
    };
  } catch (error) {
    console.error('Unexpected error checking tool result:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
