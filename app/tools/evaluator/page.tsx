'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeacherView from './TeacherView'
import StudentView from './StudentView'
import { fetchQuestions, fetchAnswers, addQuestion, deleteQuestion, submitAnswer, deleteAnswer } from '@/utils/supabase/operations'

export type Question = {
  id: string;
  text: string;
}

export type Answer = {
  id: string;
  question_id: string;
  text: string;
}

export type Answers = Record<string, Answer>;

export default function EvaluatorPage() {
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answers>({})

  useEffect(() => {
    const loadData = async () => {
      const fetchedQuestions = await fetchQuestions();
      const fetchedAnswers = await fetchAnswers();
      setQuestions(fetchedQuestions);
      const answersMap = fetchedAnswers.reduce((acc: Answers, answer: Answer) => {
        acc[answer.question_id] = answer;
        return acc;
      }, {});
      setAnswers(answersMap);
    };
    loadData();
  }, []);

  const handleAddQuestion = async (questionText: string) => {
    const newQuestion = await addQuestion(questionText);
    if (newQuestion) {
      setQuestions(prevQuestions => [newQuestion, ...prevQuestions]);
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    await deleteQuestion(id);
    setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers };
      delete newAnswers[id];
      return newAnswers;
    });
  }

  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    const newAnswer = await submitAnswer(questionId, answerText);
    if (newAnswer) {
      setAnswers(prevAnswers => ({
        ...prevAnswers,
        [questionId]: newAnswer
      }));
    }
  }

  const handleDeleteAnswer = async (questionId: string) => {
    await deleteAnswer(questionId);
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers };
      delete newAnswers[questionId];
      return newAnswers;
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-6">
        <Select onValueChange={(value: 'student' | 'teacher') => setUserType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select user type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-8">
        {userType === 'teacher' ? (
          <TeacherView 
            questions={questions} 
            answers={answers}
            addQuestion={handleAddQuestion} 
            deleteQuestion={handleDeleteQuestion} 
          />
        ) : (
          <StudentView 
            questions={questions} 
            answers={answers}
            submitAnswer={handleSubmitAnswer}
            deleteAnswer={handleDeleteAnswer}
          />
        )}
      </div>
    </div>
  )
}

