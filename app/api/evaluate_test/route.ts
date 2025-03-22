import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface Question {
  question: string;
  questionType?: string;
  options?: { [key: string]: string } | string[];
  correctAnswer?: any;
  answer?: string;
  modelAnswer?: string;
  explanation?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessment_id, student_id, student_answers, questions } = body;

    if (!assessment_id || !student_id || !student_answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use the questions from the request if available, otherwise fetch from database
    let assessmentQuestions = questions;
    if (!assessmentQuestions) {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessment_id)
        .single();

      if (error || !assessment) {
        console.error('Error fetching assessment:', error);
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      assessmentQuestions = assessment.questions;
    }

    // Calculate score and generate feedback
    const evaluationResult = await evaluateAnswers(student_answers, { questions: assessmentQuestions });

    // Determine performance based on benchmark
    const benchmark_score = 50; // You can make this dynamic
    const performance = evaluationResult.score >= benchmark_score ? 'Good' : 'Needs Improvement';

    // Store evaluation results
    const { data: evaluationData, error: evalError } = await supabase
      .from('evaluation_test')
      .insert({
        assessment_id,
        student_id,
        student_answers,
        score: evaluationResult.score,
        total_marks: 100,
        benchmark_score,
        performance,
        detailed_feedback: evaluationResult.feedback
      })
      .select()
      .single();

    if (evalError) {
      console.error('Error storing evaluation:', evalError);
      return NextResponse.json({ error: 'Failed to store evaluation' }, { status: 500 });
    }

    return NextResponse.json(evaluationData);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function evaluateAnswers(studentAnswers: any[], assessment: { questions: Question[] }) {
  let score = 0;
  let feedback: Record<string, string> = {};
  const questions = assessment.questions;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const studentAnswer = studentAnswers[i];
    
    // Determine question type
    const questionType = question.questionType || 
      (Array.isArray(question.options) ? 'FillBlanks' : 
       typeof question.options === 'object' ? 'MCQ' :
       typeof question.correctAnswer === 'boolean' ? 'TrueFalse' :
       'Short Answer');

    try {
      switch (questionType) {
        case 'MCQ': {
          const isCorrect = studentAnswer === question.correctAnswer;
          score += isCorrect ? 5 : 0;
          const selectedOption = Array.isArray(question.options) 
            ? question.options[Number(studentAnswer)] 
            : question.options?.[String(studentAnswer)] || 'No answer';
          const correctOption = Array.isArray(question.options)
            ? question.options[Number(question.correctAnswer)]
            : question.options?.[String(question.correctAnswer)];
          feedback[`q${i + 1}`] = isCorrect
            ? `✅ Correct! Selected: ${selectedOption}`
            : `Incorrect. Selected: ${selectedOption}. Correct: ${correctOption}`;
          break;
        }

        case 'TrueFalse': {
          const isCorrect = studentAnswer === question.correctAnswer;
          score += isCorrect ? 5 : 0;
          feedback[`q${i + 1}`] = isCorrect
            ? `✅ Correct! The statement is ${question.correctAnswer}`
            : `Incorrect. You answered ${studentAnswer}, but the statement is ${question.correctAnswer}`;
          break;
        }

        case 'FillBlanks': {
          const normalizedStudentAnswer = studentAnswer?.toString().toLowerCase().trim();
          const correctAnswer = question.answer || question.correctAnswer;
          const normalizedCorrectAnswer = correctAnswer?.toString().toLowerCase().trim();
          const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;
          
          score += isCorrect ? 5 : 0;
          feedback[`q${i + 1}`] = isCorrect
            ? `✅ Correct! Answer: ${correctAnswer}`
            : `Incorrect. You wrote: "${studentAnswer || 'no answer'}". Correct answer: "${correctAnswer}"`;
          break;
        }

        case 'Short Answer':
        case 'Descriptive': {
          if (!studentAnswer) {
            feedback[`q${i + 1}`] = "No answer provided";
            continue;
          }

          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `You are an expert teacher evaluating student answers. 
                    Grade the answer from 0-5 points based on:
                    - Accuracy of key concepts (2 points)
                    - Completeness of explanation (2 points)
                    - Clear communication (1 point)
                    
                    Provide response in format:
                    Score: X/5
                    Feedback: Brief explanation`
                },
                {
                  role: "user",
                  content: `Question: ${question.question}
Model Answer: ${question.modelAnswer || question.correctAnswer || question.answer}
Student Answer: ${studentAnswer}

Grade this answer out of 5 points.`
                }
              ],
              temperature: 0.3,
              max_tokens: 200
            });

            const evaluation = completion.choices[0]?.message?.content || '';
            const scoreMatch = evaluation.match(/Score:\s*(\d+)\/5/i);
            const questionScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            
            score += questionScore;
            feedback[`q${i + 1}`] = evaluation
              .replace(/Score:\s*\d+\/5\n?/i, '')
              .replace(/Feedback:\s*/i, '')
              .trim();

            // Add checkmark for full marks
            if (questionScore === 5) {
              feedback[`q${i + 1}`] = `✅ ${feedback[`q${i + 1}`]}`;
            }
          } catch (error) {
            console.error(`GPT evaluation error for question ${i + 1}:`, error);
            feedback[`q${i + 1}`] = "Error evaluating answer";
            score += 0;
          }
          break;
        }

        default:
          feedback[`q${i + 1}`] = "Unknown question type";
          break;
      }
    } catch (error) {
      console.error(`Error evaluating question ${i + 1}:`, error);
      feedback[`q${i + 1}`] = "Error in evaluation";
    }
  }

  const finalScore = Math.round((score / (questions.length * 5)) * 100);

  return {
    score: finalScore,
    feedback,
    totalQuestions: questions.length,
    correctAnswers: Object.values(feedback).filter(f => f.includes('✅')).length
  };
}
