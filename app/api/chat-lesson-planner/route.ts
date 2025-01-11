import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
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

User: ${message}
Assistant:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('The AI model was unable to provide a valid response. Please try again.');
    }

    // Check for safety-related issues
    const candidates = result.response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].finishReason === 'SAFETY') {
      const safetyRatings = candidates[0].safetyRatings;
      const dangerousContent = safetyRatings?.find(rating => rating.category === 'HARM_CATEGORY_DANGEROUS_CONTENT');
      
      if (dangerousContent && dangerousContent.probability === 'MEDIUM') {
        throw new Error('The AI model flagged the response as potentially inappropriate. Please rephrase your request.');
      }
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

