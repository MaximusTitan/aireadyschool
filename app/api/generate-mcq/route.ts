import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade, topic, numberOfQuestions } = body;

    const prompt = `Generate ${numberOfQuestions} multiple choice questions for grade ${grade} students about ${topic}. 
    Format each question as a JSON object with the following structure:
    {
      "question": "The question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "The correct option"
    }
    Return an array of these question objects.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful teacher creating multiple choice questions. Provide accurate, grade-appropriate questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      return NextResponse.json(
        { message: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(response);
    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error generating questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Error generating questions', error: errorMessage },
      { status: 500 }
    );
  }
}