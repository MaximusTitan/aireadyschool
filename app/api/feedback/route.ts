import OpenAI from "openai";
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { question, answer, rubrics, totalScore, answerId, isHuman } = await request.json();

  const supabase = createClient();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that evaluates student answers based on provided rubrics. 
          Calculate the obtained score by adding the marks for all the points mentioned in the answer that are also present in the rubrics. 
          Provide feedback suggesting any missing points from the rubrics that weren't addressed in the answer. 
          Format your response as a JSON object with the following keys:
          {
            "obtained_score": string,
            "feedback": string
          }
          The obtained_score should be a string representation of the score, e.g., "8.5" or "10".`
        },
        {
          role: "user",
          content: `Question: ${question}
          Answer: ${answer}
          Rubrics: ${rubrics}
          Total Score: ${totalScore}`
        },
      ],
    });

    const feedbackContent = completion.choices[0].message.content;

    if (typeof feedbackContent !== 'string') {
      throw new Error('Invalid response from OpenAI API');
    }

    const openAIFeedback = JSON.parse(feedbackContent);

    const feedbackData = {
      [isHuman ? 'human_obtained_score' : 'ai_obtained_score']: openAIFeedback.obtained_score,
      [isHuman ? 'human_feedback' : 'ai_feedback']: openAIFeedback.feedback,
    };

    // Update the database with the new feedback
    const { error } = await supabase
      .from('evaluator_answers')
      .update(feedbackData)
      .eq('id', answerId);

    if (error) {
      throw error;
    }

    return NextResponse.json(feedbackData);
  } catch (error) {
    console.error('Error generating or storing feedback:', error);
    return NextResponse.json({ error: 'Failed to generate or store feedback' }, { status: 500 });
  }
}

