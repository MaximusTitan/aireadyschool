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

    return { data: data as ToolOutput[] };
  } catch (error) {
    console.error('Unexpected error fetching tool outputs:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
