// Used in Canvas tool - app/canvas

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";

interface RequestBody {
  topic: string;
}

export async function POST(req: Request): Promise<Response> {
  const { topic } = await req.json() as RequestBody;
  
  // Get current user from Supabase
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prompt = `${topic}`;

  // Generate text using GPT-4o
  const { text, usage } = await generateText({
    model: openai('gpt-4o'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 5000,
  });

  // Log token usage
  if (usage) {
    await logTokenUsage(
      'Text Generation', 
      'GPT-4o', 
      usage.promptTokens, 
      usage.completionTokens, 
      user?.email
    );
  }

  return Response.json({ answer: text });
}
