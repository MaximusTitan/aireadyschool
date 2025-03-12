import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { sanitizeHtmlForOutput } from '@/lib/html-sanitizer';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, content, contentText } = await req.json();
    
    if (!contentText || contentText.trim() === '') {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    let systemPrompt = `You are a professional document editor and writer who creates well-formatted, professional-looking documents.
Format your response as clean HTML with proper structure. Use <h1>, <h2>, <h3> tags for headings, <p> tags for paragraphs, 
<ul> and <ol> for lists, and other appropriate HTML tags for formatting. Do not use markdown formatting like # or *.
Keep your writing professional, concise, and well-organized. Structure the document with logical sections and flow.`;

    let userPrompt = `I've started writing a document ${title !== 'Untitled Document' ? `titled "${title}"` : ''}.
Here's my current content:

${contentText}

Please enhance and expand this into a comprehensive, well-structured document. 
Build upon my existing ideas while maintaining my original intent. 
Add relevant sections, details, and examples as appropriate. 
Structure the document with proper headings, paragraphs, and lists.
Format as clean HTML (not markdown).`;

    const response = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    // Get the generated content
    let generatedContent = response.choices[0]?.message?.content || "Could not generate document";

    // Process the content to ensure it's proper HTML (not markdown)
    // If you have a sanitizeHtmlForOutput function to clean the HTML, use it here
    
    return NextResponse.json({ 
      content: generatedContent
    });

  } catch (error: any) {
    console.error('Error generating document with Groq:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
