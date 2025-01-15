import OpenAI from "openai";
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { question, answer, totalScore, questionId, answerId } = await request.json();

  const supabase = createClient();

  try {
    // Step 1: Generate rubrics
    const rubricsCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You're an academic evaluator. Create rubrics to score the following question: "${question}". 
            The rubrics should sum up to a total of ${totalScore} points. 
            Provide a detailed breakdown of scoring criteria. Your output should be in the following format:

            Rubric N
            Rubric's Name's Value
            Rubric's Point's Value
            Rubric's Description's Value

            Replace N with the rubric number, and fill in the values for each rubric. Do not include any other text or formatting.`  
        },
        {
          role: "user",
          content: "Generate the rubrics based on the given question and total score.",
        },
      ],
    });

    const rubrics_self = rubricsCompletion.choices[0].message.content;

    if (typeof rubrics_self !== 'string') {
      throw new Error('Invalid response from OpenAI API for rubrics generation');
    }

    // Step 2: Store rubrics_self in the database
    const { error: rubricUpdateError } = await supabase
      .from('evaluator_questions')
      .update({ rubrics_self })
      .eq('id', questionId);

    if (rubricUpdateError) {
      throw rubricUpdateError;
    }

    // Step 3: Generate score and feedback based on the self-generated rubrics
    const feedbackCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that evaluates student answers based on provided rubrics. 
          Calculate the obtained score by adding the marks for all the points mentioned in the answer that are also present in the rubrics. 
          Provide feedback suggesting any missing points from the rubrics that weren't addressed in the answer. 
          Format your response as a JSON object with the following keys:
          {
            "self_score": string,
            "self_feedback": string
          }
          The self_score should be a string representation of the score, e.g., "8.5" or "10".`
        },
        {
          role: "user",
          content: `Question: ${question}
          Answer: ${answer}
          Rubrics: ${rubrics_self}
          Total Score: ${totalScore}`
        },
      ],
    });

    const feedbackContent = feedbackCompletion.choices[0].message.content;

    if (typeof feedbackContent !== 'string') {
      throw new Error('Invalid response from OpenAI API for feedback generation');
    }

    const { self_score, self_feedback } = JSON.parse(feedbackContent);

    // Step 4: Store self_score and self_feedback in the database
    const { error: feedbackUpdateError } = await supabase
      .from('evaluator_answers')
      .update({ self_score, self_feedback })
      .eq('id', answerId);

    if (feedbackUpdateError) {
      throw feedbackUpdateError;
    }

    return NextResponse.json({ self_score, self_feedback });
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return NextResponse.json({ error: 'Failed to generate AI feedback' }, { status: 500 });
  }
}

