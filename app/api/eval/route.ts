import OpenAI from "openai";
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { question, class: classLevel, score } = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `You're an academic evaluator. Create rubrics to score the following question: "${question}". 
            The rubrics should be appropriate for a student in class ${classLevel} and should sum up to a total of ${score} points. 
            Provide a detailed breakdown of scoring criteria. Your output should be in the following format:

            Rubric N
            Rubric's Name's Value
            Rubric's Point's Value
            Rubric's Description's Value

            Replace N with the rubric number, and fill in the values for each rubric. Do not include any other text or formatting.`  
        },
        {
          role: "user",
          content: "Generate the rubrics based on the given question, class level, and total score.",
        },
      ],
    });

    const rubrics = completion.choices[0].message.content;

    return NextResponse.json({ rubrics });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to generate rubrics' }, { status: 500 });
  }
}

