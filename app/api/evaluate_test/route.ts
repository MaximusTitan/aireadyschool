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

// Add new interface for evaluation result
interface EvaluationResult {
  assessment_id: number;
  score: number;
  feedback: Record<string, FeedbackItem>;
  total_questions: number;
  correct_answers: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessment_id, student_id, student_answers, questions } = body;

    if (!assessment_id || !student_id || !student_answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Split and validate assessment IDs
    const assessmentIds: string[] = assessment_id.split(',').map((id: string) => id.trim());
    const primaryAssessmentId = parseInt(assessmentIds[0]); // Use first ID as primary

    // Group questions by assessment ID
    const questionsByAssessment = questions.reduce((acc: any, q: any) => {
      const id = q.assessmentId;
      if (!acc[id]) acc[id] = [];
      acc[id].push(q);
      return acc;
    }, {});

    // Evaluate each assessment separately
    const evaluationPromises = assessmentIds.map(async (id: string) => {
      const assessmentQuestions = questionsByAssessment[id];
      const result = await evaluateAnswers(
        student_answers.slice(0, assessmentQuestions.length),
        { questions: assessmentQuestions }
      );

      return {
        assessment_id: parseInt(id),
        score: result.score,
        feedback: result.feedback,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers
      };
    });

    const evaluations = await Promise.all(evaluationPromises);

    // Calculate combined score and metrics
    const totalScore = evaluations.reduce((sum, evaluation: EvaluationResult) => sum + evaluation.score, 0);
    const averageScore = Math.round(totalScore / evaluations.length);

    // Format combined feedback with assessment IDs
    const detailedFeedback = evaluations.reduce((acc, evaluation: EvaluationResult, index) => {
      const assessmentId = assessmentIds[index];
      // Convert feedback objects to include assessment ID prefix
      const assessmentFeedback = Object.entries(evaluation.feedback).reduce((fb, [qKey, value]) => ({
        ...fb,
        [`A${assessmentId}_${qKey}`]: value
      }), {});
      return { ...acc, ...assessmentFeedback };
    }, {});

    // Store evaluation with primary assessment ID and metadata
    const { data: evaluationData, error: evalError } = await supabase
      .from('evaluation_test')
      .insert({
        assessment_id: primaryAssessmentId, // Store only the first assessment ID
        student_id,
        student_answers,
        score: averageScore,
        total_marks: 100,
        benchmark_score: 50,
        performance: averageScore >= 50 ? 'Good' : 'Needs Improvement',
        detailed_feedback: detailedFeedback,
        metadata: {  // Store additional assessment info in metadata
          assessment_ids: assessmentIds,
          individual_scores: evaluations.map((evaluation: EvaluationResult, index) => ({
            assessment_id: assessmentIds[index],
            score: evaluation.score,
            total_questions: evaluation.total_questions,
            correct_answers: evaluation.correct_answers
          }))
        }
      })
      .select()
      .single();

    if (evalError) {
      console.error('Error storing evaluation:', evalError);
      return NextResponse.json({ error: 'Failed to store evaluation' }, { status: 500 });
    }

    return NextResponse.json({
      ...evaluationData,
      individual_evaluations: evaluations,
      all_assessment_ids: assessmentIds
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

interface FeedbackItem {
  question: string;
  studentAnswer: string;
  correctAnswer: string | undefined;
  isCorrect: boolean;
  explanation: string;
}

async function evaluateAnswers(studentAnswers: any[], assessment: { questions: Question[] }) {
  let score = 0;
  let feedback: Record<string, FeedbackItem> = {};
  const questions = assessment.questions;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const studentAnswer = studentAnswers[i];
    const questionNumber = `${i + 1}`;  // Simple sequential number
    
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
          
          // Get the actual text values instead of option numbers
          const selectedOption = typeof question.options === 'object' && !Array.isArray(question.options) 
            ? question.options[String(studentAnswer)] || 'No answer'
            : 'No answer';
          const correctOption = Array.isArray(question.options) 
            ? question.options[Number(question.correctAnswer)] 
            : question.options?.[String(question.correctAnswer)];

          feedback[questionNumber] = {
            question: question.question,
            studentAnswer: selectedOption,
            correctAnswer: correctOption,
            isCorrect,
            explanation: isCorrect
              ? `✅ Correct! You selected "${selectedOption}"`
              : `❌ Incorrect. You selected "${selectedOption}". The correct answer is "${correctOption}"`
          };
          break;
        }

        case 'TrueFalse': {
          const isCorrect = studentAnswer === question.correctAnswer;
          score += isCorrect ? 5 : 0;
          
          feedback[questionNumber] = {
            question: question.question,
            studentAnswer: studentAnswer?.toString() || 'No answer',
            correctAnswer: question.correctAnswer.toString(),
            isCorrect,
            explanation: isCorrect
              ? `✅ Correct! The statement is ${question.correctAnswer}`
              : `❌ Incorrect. You answered ${studentAnswer}, but the statement is ${question.correctAnswer}`
          };
          break;
        }

        case 'FillBlanks': {
          const normalizedStudentAnswer = studentAnswer?.toString().toLowerCase().trim();
          const correctAnswer = question.answer || question.correctAnswer;
          const normalizedCorrectAnswer = correctAnswer?.toString().toLowerCase().trim();
          const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;
          
          score += isCorrect ? 5 : 0;
          feedback[questionNumber] = {
            question: question.question,
            studentAnswer: studentAnswer || 'No answer',
            correctAnswer: correctAnswer,
            isCorrect,
            explanation: isCorrect
              ? `✅ Correct! Answer: "${correctAnswer}"`
              : `❌ Incorrect. You wrote: "${studentAnswer || 'No answer'}". Correct answer: "${correctAnswer}"`
          };
          break;
        }

        case 'Short Answer':
        case 'Descriptive': {
          if (!studentAnswer) {
            feedback[questionNumber] = {
              question: question.question,
              studentAnswer: 'No answer provided',
              correctAnswer: question.correctAnswer || 'No correct answer',
              isCorrect: false,
              explanation: "No answer provided"
            };
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
            feedback[questionNumber] = {
              question: question.question,
              studentAnswer: studentAnswer,
              correctAnswer: question.correctAnswer || 'No correct answer',
              isCorrect: questionScore === 5,
              explanation: evaluation
                .replace(/Score:\s*\d+\/5\n?/i, '')
                .replace(/Feedback:\s*/i, '')
                .trim()
            };

            // Add checkmark for full marks
            if (questionScore === 5) {
              feedback[questionNumber].explanation = `✅ ${feedback[questionNumber].explanation}`;
            }
          } catch (error) {
            console.error(`GPT evaluation error for question ${i + 1}:`, error);
            feedback[questionNumber] = {
              question: question.question,
              studentAnswer: 'Error',
              correctAnswer: 'Error',
              isCorrect: false,
              explanation: "Error evaluating answer"
            };
            score += 0;
          }
          break;
        }

        default:
          feedback[questionNumber] = {
            question: question.question,
            studentAnswer: 'Unknown',
            correctAnswer: 'Unknown',
            isCorrect: false,
            explanation: "Unknown question type"
          };
          break;
      }
    } catch (error) {
      console.error(`Error evaluating question ${i + 1}:`, error);
      feedback[questionNumber] = {
        question: question.question,
        studentAnswer: 'Error',
        correctAnswer: 'Error',
        isCorrect: false,
        explanation: "Error in evaluation"
      };
    }
  }

  const finalScore = Math.round((score / (questions.length * 5)) * 100);

  return {
    score: finalScore,
    feedback,
    totalQuestions: questions.length,
    correctAnswers: Object.values(feedback).filter(f => f.isCorrect).length
  };
}
