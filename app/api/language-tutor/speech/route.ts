import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai/index.mjs';

// Initialize OpenAI client to point to Groq API
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as File;
    const targetPhrase = formData.get('targetPhrase') as string;
    const language = formData.get('language') as string;
    
    if (!audioBlob || !targetPhrase || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, targetPhrase, or language' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await audioBlob.arrayBuffer());

    // Create a FormData instance for the Groq API request
    const groqFormData = new FormData();
    groqFormData.append('file', new Blob([buffer], { type: audioBlob.type }), 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', language.split('-')[0]); // Extract base language code

    // Make direct fetch request to Groq's Whisper API
    const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
    }

    const transcription = await transcriptionResponse.json();
    const spokenText = transcription.text;
    
    // Use Groq's chat completion API (Llama 3) to evaluate the spoken phrase
    const evaluation = await evaluateSpeechWithGroq(spokenText, targetPhrase, language);
    
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error processing speech with Groq:', error);
    return NextResponse.json(
      { error: 'Failed to process speech' },
      { status: 500 }
    );
  }
}

// Renamed function to reflect Groq usage
async function evaluateSpeechWithGroq(spokenText: string, targetPhrase: string, language: string) {
  try {
    const prompt = `
    You are a friendly language coach for children aged 6-10. 
    A child has attempted to say the phrase "${targetPhrase}" in ${language}.
    They actually said: "${spokenText}".
    
    Evaluate their pronunciation and provide feedback as a language coach.
    Be encouraging, positive, and use simple language appropriate for children.
    
    Return your response in the following JSON format:
    {
      "feedback": "Your specific feedback message here",
      "isCorrect": true/false,
      "encouragement": "A short encouraging follow-up sentence"
    }
    
    Only return valid JSON with these three fields.
    `;

    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Use a Groq-supported chat model
      messages: [
        {
          role: "system",
          content: "You are a friendly language coach for children. Respond only with the requested JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response from Groq");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error evaluating speech with Groq:', error);
    // Provide a generic error response if Groq fails
    return {
      feedback: "Oops! I had a little trouble understanding. Let's try that again!",
      isCorrect: false,
      encouragement: "Keep practicing, you're doing awesome!"
    };
  }
} 