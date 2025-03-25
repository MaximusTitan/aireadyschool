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

interface EvaluationResult {
  assessment_id: number;
  score: number;
  feedback: Record<string, FeedbackItem>;
  total_questions: number;
  correct_answers: number;
}

interface TopicAnalysis {
  mainTopic: string;
  subtopics: {
    name: string;
    mastery: number;  // Percentage of correct answers
    questions: number[]; // Question indices
    status: 'Excellent' | 'Good' | 'Needs Work' | 'Critical';
    recommendations: string[];
  }[];
}

interface ImprovementRecommendation {
  focusAreas: string[];
  studyTips: string[];
  conceptsToReview: string[];
  strengths: string[];
  overallAnalysis: string;
  topicAnalysis: TopicAnalysis[];
  prioritizedTopics: {
    critical: string[];
    needsWork: string[];
    good: string[];
    excellent: string[];
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessment_id, student_id, student_answers, questions } = body;

    if (!assessment_id || !student_id || !student_answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessmentIds: string[] = assessment_id.split(',').map((id: string) => id.trim());
    const primaryAssessmentId = parseInt(assessmentIds[0]);

    const questionsByAssessment = questions.reduce((acc: any, q: any) => {
      const id = q.assessmentId;
      if (!acc[id]) acc[id] = [];
      acc[id].push(q);
      return acc;
    }, {});

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

    const totalScore = evaluations.reduce((sum, evaluation: EvaluationResult) => sum + evaluation.score, 0);
    const averageScore = Math.round(totalScore / evaluations.length);

    const detailedFeedback = evaluations.reduce((acc, evaluation: EvaluationResult, index) => {
      const assessmentId = assessmentIds[index];
      const assessmentFeedback = Object.entries(evaluation.feedback).reduce((fb, [qKey, value]) => ({
        ...fb,
        [`A${assessmentId}_${qKey}`]: value
      }), {});
      return { ...acc, ...assessmentFeedback };
    }, {});

    const recommendations = await getImprovementRecommendations(
      questions,
      detailedFeedback,
      averageScore,
      75
    );

    const { data: evaluationData, error: evalError } = await supabase
      .from('evaluation_test')
      .insert({
        assessment_id: primaryAssessmentId,
        student_id,
        student_answers,
        score: averageScore,
        total_marks: 100,
        benchmark_score: 75,
        performance: averageScore >= 75 ? 'Good' : 'Needs Improvement',
        detailed_feedback: detailedFeedback,
        improvement_recommendations: recommendations,
        metadata: {
          assessment_ids: assessmentIds,
          individual_scores: evaluations.map((evaluation: EvaluationResult, index) => ({
            assessment_id: assessmentIds[index],
            score: evaluation.score,
            total_questions: evaluation.total_questions,
            correct_answers: evaluation.correct_answers
          })),
          recommendations: recommendations
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
  options?: string[];
  optionKeys?: string[];
  selectedOptionIndex?: number;
  correctOptionIndex?: number;
  questionType?: string;
}

async function evaluateAnswers(studentAnswers: any[], assessment: { questions: Question[] }) {
  let score = 0;
  let feedback: Record<string, FeedbackItem> = {};
  const questions = assessment.questions;

  const POINTS = {
    MCQ: 2,
    'Short Answer': 5,
    Descriptive: 5,
    TrueFalse: 1,
    FillBlanks: 2
  };

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const studentAnswer = studentAnswers[i];
    const questionNumber = `${i + 1}`;

    const questionType = question.questionType || 
      (typeof question.options === 'object' ? 'MCQ' :
       typeof question.correctAnswer === 'boolean' ? 'TrueFalse' :
       'Short Answer');

    try {
      switch (questionType) {
        case 'MCQ': {
          let optionsMap: { [key: string]: string };
          
          if (Array.isArray(question.options)) {
            optionsMap = question.options.reduce((acc, opt, idx) => ({
              ...acc,
              [String.fromCharCode(65 + idx)]: opt
            }), {});
          } else if (typeof question.options === 'object') {
            optionsMap = question.options as { [key: string]: string };
          } else {
            optionsMap = {};
          }

          const optionKeys = Object.keys(optionsMap);
          const options = Object.values(optionsMap);

          const selectedOptionIndex = typeof studentAnswer === 'number' 
            ? String.fromCharCode(65 + studentAnswer)
            : studentAnswer?.toString();

          const correctOptionIndex = typeof question.correctAnswer === 'number'
            ? String.fromCharCode(65 + question.correctAnswer)
            : question.correctAnswer?.toString();

          const selectedOption = optionsMap[selectedOptionIndex];
          const correctOption = optionsMap[correctOptionIndex];

          const isCorrect = selectedOptionIndex === correctOptionIndex;
          score += isCorrect ? POINTS.MCQ : 0;

          feedback[questionNumber] = {
            question: question.question,
            studentAnswer: selectedOption || 'No answer',
            correctAnswer: correctOption,
            isCorrect,
            explanation: isCorrect
              ? `✅ Correct! You selected "${selectedOption}"`
              : `❌ Incorrect. You selected "${selectedOption || 'No answer'}". The correct answer is "${correctOption}"`,
            options,
            optionKeys,
            selectedOptionIndex,
            correctOptionIndex,
            questionType: 'MCQ'
          };
          break;
        }

        case 'TrueFalse': {
          const isCorrect = studentAnswer === question.correctAnswer;
          score += isCorrect ? POINTS.TrueFalse : 0;
          
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
          
          score += isCorrect ? POINTS.FillBlanks : 0;
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

  const maxPoints = questions.reduce((total, q) => {
    const type = q.questionType || 
      (typeof q.options === 'object' ? 'MCQ' :
       typeof q.correctAnswer === 'boolean' ? 'TrueFalse' : 'Short Answer');
    return total + POINTS[type as keyof typeof POINTS];
  }, 0);

  const finalScore = Math.round((score / maxPoints) * 100);

  return {
    score: finalScore,
    feedback,
    totalQuestions: questions.length,
    correctAnswers: Object.values(feedback).filter(f => f.isCorrect).length
  };
}

async function getImprovementRecommendations(
  questions: Question[],
  feedback: Record<string, FeedbackItem>,
  score: number,
  benchmarkScore: number = 75
): Promise<ImprovementRecommendation> {
  try {
    // Map questions with safer feedback access
    const questionAnalysis = questions.map((q, idx) => {
      const feedbackKey = `${idx + 1}`;
      const feedbackItem = feedback[feedbackKey] || {
        studentAnswer: 'No answer',
        isCorrect: false
      };

      return {
        question: q.question,
        type: q.questionType || 'Unknown',
        correctAnswer: q.correctAnswer,
        studentAnswer: feedbackItem.studentAnswer,
        isCorrect: feedbackItem.isCorrect,
        explanation: feedbackItem.explanation || ''
      };
    });

    const promptData = {
      score,
      benchmarkScore,
      totalQuestions: questions.length,
      correctAnswers: questionAnalysis.filter(q => q.isCorrect).length,
      questionsByType: questionAnalysis.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      questions: questionAnalysis
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational analyst. Analyze the student's performance and provide detailed recommendations.
            First, identify main topics from the questions.
            Then, create meaningful subtopics for each main topic.
            Analyze performance in each subtopic.
            
            Return a valid JSON object (no markdown) with this structure:
            {
              "focusAreas": ["topic1", "topic2", "topic3"],
              "studyTips": ["tip1", "tip2", "tip3"],
              "conceptsToReview": ["concept1", "concept2", "concept3"],
              "strengths": ["strength1", "strength2"],
              "overallAnalysis": "brief analysis",
              "topicAnalysis": [
                {
                  "mainTopic": "Topic Name",
                  "subtopics": [
                    {
                      "name": "Subtopic Name",
                      "mastery": 75,
                      "questions": [1, 2, 3],
                      "status": "Good",
                      "recommendations": ["specific recommendation 1", "specific recommendation 2"]
                    }
                  ]
                }
              ],
              "prioritizedTopics": {
                "critical": ["topic1", "topic2"],
                "needsWork": ["topic3"],
                "good": ["topic4"],
                "excellent": ["topic5"]
              }
            }`
        },
        {
          role: "user",
          content: `Analyze this assessment performance and create topic-based recommendations:
            ${JSON.stringify(promptData, null, 2)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    const recommendationText = completion.choices[0]?.message?.content || '{}';
    
    // Clean the response text - remove any markdown formatting
    const cleanedText = recommendationText
      .replace(/```json\n?/g, '')  // Remove ```json
      .replace(/```\n?/g, '')      // Remove closing ```
      .trim();                     // Remove extra whitespace

    try {
      const recommendations = JSON.parse(cleanedText);
      
      // Validate the structure
      const requiredFields = ['focusAreas', 'studyTips', 'conceptsToReview', 'strengths', 'overallAnalysis', 'topicAnalysis', 'prioritizedTopics'];
      const missingFields = requiredFields.filter(field => !recommendations[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Ensure arrays have content
      if (!recommendations.focusAreas.length || !recommendations.studyTips.length) {
        throw new Error('Focus areas and study tips cannot be empty');
      }

      return recommendations;
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      console.error('Raw response:', recommendationText);
      console.error('Cleaned response:', cleanedText);
      throw new Error('Invalid recommendation format');
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Provide more specific fallback recommendations
    return {
      focusAreas: [
        'Review incorrect answers',
        'Focus on core concepts',
        'Practice problem areas'
      ],
      studyTips: [
        'Create concept summaries',
        'Practice similar questions',
        'Use active recall techniques'
      ],
      conceptsToReview: [
        'Topics from missed questions',
        'Related fundamental concepts',
        'Problem-solving strategies'
      ],
      strengths: [
        'Successfully answered questions',
        'Areas of demonstrated knowledge'
      ],
      overallAnalysis: `Score: ${score}%. ${
        score >= benchmarkScore 
          ? 'Performance meets benchmark but has room for improvement.' 
          : 'Focus needed on core concepts and practice.'
      }`,
      topicAnalysis: [],
      prioritizedTopics: {
        critical: [],
        needsWork: [],
        good: [],
        excellent: []
      }
    };
  }
}
