import { createClient } from "@/utils/supabase/server";  // Supabase client

const PRICING = {
  'GPT-4o': {
    input: 2.50,   // $2.50 per 1M input tokens
    output: 10.00  // $10.00 per 1M output tokens
  },
  'Claude 3.5 Sonnet': {
    input: 3.00,   // $3.00 per 1M input tokens
    output: 15.00  // $15.00 per 1M output tokens
  }
};

export async function logTokenUsage(toolName: string, modelName: string, promptTokens: number, completionTokens: number, userEmail?: string) {
  const modelPricing = PRICING[modelName as keyof typeof PRICING] || PRICING['GPT-4o'];
  
  const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
  const outputCost = (completionTokens / 1_000_000) * modelPricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = promptTokens + completionTokens;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('token_usage_logs')
    .insert([
      {
        tool_name: toolName,
        model_name: modelName,
        input_tokens: promptTokens,
        output_tokens: completionTokens,
        total_tokens: totalTokens,
        total_cost: totalCost,
        user_email: userEmail,
      },
    ]);

  if (error) {
    console.error('Error inserting log:', error.message);
  } else {
    console.log('Token usage logged successfully:', data);
  }
}
