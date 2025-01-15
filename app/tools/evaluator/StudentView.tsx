'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Question, Answer, updateAnswer, fetchAIFeedback, updateAIFeedback, AIFeedback, fetchLatestAnswer, fetchQuestionWithRubrics, updateSelfRubrics, updateSelfFeedback } from '@/utils/supabase/operations'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Pencil, Check, X, Sparkles, BotIcon as Robot } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

type StudentViewProps = {
  questions: Question[];
  answers: Record<string, Answer>;
  submitAnswer: (questionId: string, answerText: string) => Promise<void>;
  deleteAnswer: (questionId: string) => void;
  updateAnswerList: (updatedAnswer: Answer) => void;
}

export default function StudentView({ questions, answers, submitAnswer, deleteAnswer, updateAnswerList }: StudentViewProps) {
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({})
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  const [editedAnswer, setEditedAnswer] = useState<string>('')
  const [editError, setEditError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, AIFeedback>>({});
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<Record<string, boolean>>({});
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  useEffect(() => {
    Object.values(answers).forEach(answer => {
      if (answer.ai_obtained_score !== null || answer.human_obtained_score !== null || answer.self_score !== null) {
        setFeedback(prev => ({
          ...prev,
          [answer.question_id]: {
            ai_obtained_score: answer.ai_obtained_score,
            ai_feedback: answer.ai_feedback,
            human_obtained_score: answer.human_obtained_score,
            human_feedback: answer.human_feedback,
            self_score: answer.self_score,
            self_feedback: answer.self_feedback
          }
        }));
      }
    });
  }, [answers]);

  const handleAnswerChange = (questionId: string, text: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: text
    }))
  }

  const handleSubmit = async (questionId: string) => {
    if (currentAnswers[questionId]?.trim() === '') {
      setEditError('Your answer cannot be empty');
      return;
    }
    await submitAnswer(questionId, currentAnswers[questionId] || '');
    setCurrentAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    setEditError(null);
    
    // Fetch the latest answer
    const latestAnswer = await fetchLatestAnswer(questionId);
    if (latestAnswer) {
      updateAnswerList(latestAnswer);
      const question = questions.find(q => q.id === questionId);
      if (question && !question.rubrics && !question.rubrics_human) {
        // Call /api/ai-feedback if both rubrics are empty
        await generateAndUpdateSelfFeedback(questionId, latestAnswer.id, latestAnswer.text, question.score);
      } else {
        // Generate and update feedback
        await generateAndUpdateFeedback(questionId, latestAnswer.id, latestAnswer.text);
      }
    }
  }

  const generateAndUpdateFeedback = async (questionId: string, answerId: string, answerText: string) => {
    const question = await fetchQuestionWithRubrics(questionId);
    if (!question) return;

    setIsLoadingFeedback(prev => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          answer: answerText,
          rubrics: question.rubrics_human || question.rubrics,
          totalScore: question.score,
          answerId: answerId,
          isHuman: question.rubrics_human !== null
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch feedback');
      const feedbackData: AIFeedback = await response.json();

      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ...feedbackData,
          self_score: null,
          self_feedback: null
        }
      }));

      // Update the database with the new feedback
      await updateAIFeedback(answerId, feedbackData, question.rubrics_human !== null);

    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ai_obtained_score: null,
          ai_feedback: 'Failed to generate feedback. Please try again.',
          human_obtained_score: null,
          human_feedback: null,
          self_score: null,
          self_feedback: null
        }
      }));
    } finally {
      setIsLoadingFeedback(prev => ({ ...prev, [questionId]: false }));
    }
  }

  const startEditing = (answer: Answer) => {
    setEditingAnswer(answer.question_id)
    setEditedAnswer(answer.text)
  }

  const handleEdit = async (answer: Answer) => {
    if (editedAnswer.trim() === '') {
      setEditError('Your answer cannot be empty');
      return;
    }
    const updatedAnswer = await updateAnswer(answer.id, editedAnswer);
    if (updatedAnswer) {
      updateAnswerList(updatedAnswer);
      // Clear the feedback when the answer is edited
      setFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[answer.question_id];
        return newFeedback;
      });
      // Generate and update feedback for the edited answer
      await generateAndUpdateFeedback(answer.question_id, answer.id, editedAnswer);
    }
    setEditingAnswer(null);
    setEditError(null);
  }

  const cancelEdit = () => {
    setEditingAnswer(null);
    setEditedAnswer('');
    setEditError(null);
  }

  const getFeedback = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer) return;

    setIsLoadingFeedback(prev => ({ ...prev, [questionId]: true }));

    try {
      let feedbackData = await fetchAIFeedback(answer.id);
      
      // Check if feedback is null and make API call if necessary
      if (!feedbackData || (feedbackData.ai_obtained_score === null && feedbackData.ai_feedback === null && 
          feedbackData.human_obtained_score === null && feedbackData.human_feedback === null)) {
        feedbackData = await fetchAndStoreFeedback(questionId, answer);
      }

      if (feedbackData) {
        setFeedback(prev => ({
          ...prev,
          [questionId]: feedbackData
        }));
      } else {
        throw new Error('No feedback available');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ai_obtained_score: null,
          ai_feedback: 'Failed to load feedback. Please try again.',
          human_obtained_score: null,
          human_feedback: null,
          self_score: null,
          self_feedback: null
        }
      }));
    } finally {
      setIsLoadingFeedback(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const fetchAndStoreFeedback = async (questionId: string, answer: Answer): Promise<AIFeedback> => {
    const question = questions.find(q => q.id === questionId);
    if (!question) throw new Error('Question not found');

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.text,
        answer: answer.text,
        rubrics: question.rubrics_human || question.rubrics,
        totalScore: question.score,
        answerId: answer.id,
        isHuman: question.rubrics_human !== null
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch feedback');
    const feedbackData: AIFeedback = await response.json();

    // Update the database with the new feedback
    await updateAIFeedback(answer.id, feedbackData, question.rubrics_human !== null);

    return feedbackData;
  };

  const fetchSelfFeedback = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer) return;

    setIsLoadingFeedback(prev => ({ ...prev, [questionId]: true }));

    try {
      let feedbackData = await fetchAIFeedback(answer.id);
      if (feedbackData && (feedbackData.self_score === null && feedbackData.self_feedback === null)) {
        // All fields are null, call /api/ai-feedback
        const question = questions.find(q => q.id === questionId);
        if (question) {
          const response = await fetch('/api/ai-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: question.text,
              answer: answer.text,
              totalScore: question.score,
              questionId: question.id,
              answerId: answer.id,
            }),
          });
          if (!response.ok) throw new Error('Failed to generate AI feedback');
          feedbackData = await response.json();
        }
      }

      if (feedbackData) {
        setFeedback(prev => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            ...feedbackData
          }
        }));
      } else {
        throw new Error('No self-generated feedback available');
      }
    } catch (error) {
      console.error('Error fetching or generating self-generated feedback:', error);
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          self_score: null,
          self_feedback: 'Failed to load or generate self-generated feedback. Please try again.',
        }
      }));
    } finally {
      setIsLoadingFeedback(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const generateAndUpdateSelfFeedback = async (questionId: string, answerId: string, answerText: string, totalScore: number) => {
    setIsLoadingFeedback(prev => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions.find(q => q.id === questionId)?.text,
          answer: answerText,
          totalScore,
          questionId,
          answerId,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate AI feedback');
      const data = await response.json();
      
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          self_score: data.self_score,
          self_feedback: data.self_feedback,
        }
      }));

    } catch (error) {
      console.error('Error generating self-feedback:', error);
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          self_score: null,
          self_feedback: 'Failed to generate self-feedback. Please try again.',
        }
      }));
    } finally {
      setIsLoadingFeedback(prev => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <div>
      <style jsx global>{scrollbarStyles}</style>
      <h2 className="text-2xl font-bold mb-4">Student View</h2>
      {questions.length === 0 ? (
        <p>No questions available yet.</p>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <Card key={question.id} className="relative">
              <CardHeader>
                <CardTitle className="pr-24">
                  <span>{question.text}</span>
                </CardTitle>
                {answers[question.id] && (
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => fetchSelfFeedback(question.id)}
                        >
                          AI Feedback<Robot className="h-4 w-4 ml-1" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto custom-scrollbar" onPointerDownOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle>AI Feedback</DialogTitle>
                          <DialogDescription>
                            Here's the AI-generated feedback for your answer:
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 p-4 bg-gray-100 rounded-md">
                          {isLoadingFeedback[question.id] ? (
                            <p>Generating AI feedback...</p>
                          ) : feedback[question.id] && feedback[question.id].self_score !== null ? (
                            <>
                              <p className="font-semibold mb-2">
                                Score: {feedback[question.id].self_score}/{question.score}
                              </p>
                              <p className="font-semibold mb-2">AI Feedback:</p>
                              <p>{feedback[question.id].self_feedback}</p>
                            </>
                          ) : (
                            <p>No AI feedback available. Please try again.</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {(question.rubrics || question.rubrics_human) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => getFeedback(question.id)}
                          >
                            Feedback<Sparkles className="h-4 w-4 ml-1" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto custom-scrollbar" onPointerDownOutside={(e) => e.preventDefault()}>
                          <DialogHeader>
                            <DialogTitle>Feedback</DialogTitle>
                            <DialogDescription>
                              Here's the feedback for your answer:
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 p-4 bg-gray-100 rounded-md">
                            {isLoadingFeedback[question.id] ? (
                              <p>Loading feedback...</p>
                            ) : feedback[question.id] ? (
                              <div>
                                {feedback[question.id].human_obtained_score !== null ? (
                                  <>
                                    <p className="font-semibold mb-2">
                                      Human Score: {feedback[question.id].human_obtained_score}/{question.score}
                                    </p>
                                    <p className="font-semibold mb-2">Human Feedback:</p>
                                    <p>{feedback[question.id].human_feedback}</p>
                                  </>
                                ) : feedback[question.id].ai_obtained_score !== null ? (
                                  <>
                                    <p className="font-semibold mb-2">
                                      AI Score: {feedback[question.id].ai_obtained_score}/{question.score}
                                    </p>
                                    <p className="font-semibold mb-2">AI Feedback:</p>
                                    <p>{feedback[question.id].ai_feedback}</p>
                                  </>
                                ) : (
                                  <p>No feedback available</p>
                                )}
                              </div>
                            ) : (
                              <p>No feedback available</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Class: {question.class} | Score: {question.score}
                </div>
              </CardHeader>
              <CardContent>
                {answers[question.id] ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Your submitted answer:</h4>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(answers[question.id])}
                          aria-label="Edit answer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAnswer(question.id)}
                          aria-label="Delete answer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {editingAnswer === question.id ? (
                      <div>
                        <Textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          className="mb-2 min-h-[200px]"
                        />
                        {editError && <p className="text-red-500 text-sm mb-2">{editError}</p>}
                        <div className="flex justify-end space-x-2">
                          <Button onClick={() => handleEdit(answers[question.id])}>
                            <Check className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                          <Button variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="bg-gray-100 p-3 rounded">{answers[question.id].text}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Textarea
                      value={currentAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here"
                      className="mb-2"
                    />
                    {editError && <p className="text-red-500 text-sm mb-2">{editError}</p>}
                    <Button onClick={() => handleSubmit(question.id)}>Submit Answer</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

