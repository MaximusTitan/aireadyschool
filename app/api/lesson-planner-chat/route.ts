// Used in Lesson Planner - tools/lesson-planner

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const prompt = `You are a lesson plan assistant. Your task is to understand the user's request and provide specific changes or additions to the lesson plan. Format your response in a structured way that can be parsed.

    Context: ${context}

    When responding:
    1. Provide the specific changes or additions requested
    2. Format your response using these markers:
      CHANGE_TYPE: [update_duration|add_resource|update_objective|add_activity|remove_activity|add_keypoint|update_description|add_section|remove_section|update_section_name]
      SECTION: [section name]
      CONTENT: [the new content]

    For adding activities or updating descriptions, use this format:
    CHANGE_TYPE: [add_activity|update_description]
    SECTION: [section name]
    CONTENT: [Activity Name]|[Activity Duration]|[Activity Instructions or Description]

    For adding sections, use this format:
    CHANGE_TYPE: add_section
    SECTION: [New Section Name]
    CONTENT: [New Section Name]|[Duration]

    For removing sections, use this format:
    CHANGE_TYPE: remove_section
    SECTION: [Section Name to Remove]
    CONTENT: [Section Name to Remove]

    For adding resources, use this format:
    CHANGE_TYPE: add_resource
    CONTENT: [Resource Title]|[Resource URL]

    If multiple changes are requested, provide each change separately with its own CHANGE_TYPE, SECTION, and CONTENT.

    Ensure all content is appropriate for educational purposes and avoid any potentially harmful or dangerous content.

    User: ${message}`;

    // Call the OpenAI API using fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful lesson plan assistant that provides responses in a structured format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      if (errorData.error && errorData.error.message) {
        throw new Error(`OpenAI API error: ${errorData.error.message}`);
      } else {
        throw new Error('An error occurred while calling the OpenAI API');
      }
    }

    const completion = await response.json();
    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('The AI model was unable to provide a valid response. Please try again.');
    }

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

