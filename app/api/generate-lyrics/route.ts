import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { songDescription } = await req.json();

  // Get current user from Supabase
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prompt = `As a skilled songwriter, create engaging and creative lyrics for a song with the following description: "${songDescription}". 
  The lyrics should:
  - Have a clear structure with verses and a chorus
  - Be emotionally resonant and authentic
  - Include creative metaphors and imagery
  - Follow natural rhythm and flow
  - Only text no verse or chorus titles
  - Finish the song in up to 400 characters
  
  Write only the lyrics, no additional explanations.`;

  const { text, usage } = await generateText({
    model: openai('gpt-4o'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 150,
  });

  // Log token usage
  if (usage) {
    await logTokenUsage(
      'Lyrics Generator',
      'GPT-4o',
      usage.promptTokens,
      usage.completionTokens,
      user?.email
    );
  }

  return Response.json({ story: text });
}
