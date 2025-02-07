import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { logTokenUsage } from '@/utils/logTokenUsage';

export async function POST(req: Request) {
  // Create Supabase client
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, genre, ageGroup, tone, length } = await req.json();

  const wordCount = {
    short: 300,
    medium: 600,
    long: 1000
  }[length as 'short' | 'medium' | 'long'] || 600;

  const prompt = `Create a ${tone} story for ${ageGroup} readers in the ${genre} genre.
    Title: "${title}"
    ${description ? `Description: ${description}` : ''}
    Target length: approximately ${wordCount} words

    Story Guidelines:
    - Keep the language and themes appropriate for ${ageGroup} readers
    - Maintain a ${tone} tone throughout the narrative
    - Include vivid descriptions that can be visualized
    - Create memorable characters and engaging dialogue
    - Ensure a clear beginning, middle, and end structure
    - Include themes that resonate with ${ageGroup} readers
    - Give a new better title to the story. Do not inclue "Title" in the title.
    
    Please write the story:`;

  try {
    const { text, usage } = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: Math.max(wordCount * 2, 1000),
    });

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Story Generator',
        'GPT-4o',
        usage.promptTokens,
        usage.completionTokens,
        user.email
      );
    }

    // Save to database
    const { data: story, error: dbError } = await supabase
      .from('stories')
      .insert({
        user_email: user.email,
        title,
        description,
        genre,
        age_group: ageGroup,
        tone,
        length,
        story: text,
      })
      .select('*')  // Select all fields
      .single();

    if (dbError) throw dbError;

    return Response.json({ 
      story: text, 
      storyId: story.id,
      fullStory: story // Return full story object
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
