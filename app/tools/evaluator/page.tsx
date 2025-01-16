"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TeacherView from "./TeacherView";
import StudentView from "./StudentView";
import {
  fetchQuestions,
  fetchAnswers,
  addQuestion,
  deleteQuestion,
  submitAnswer,
  deleteAnswer,
  Question as QuestionType,
  Answer as AnswerType,
} from "@/utils/supabase/operations";
import { ChevronLeft, Link } from "lucide-react";

export type Answers = Record<string, AnswerType>;

export default function EvaluatorPage() {
  const [userType, setUserType] = useState<"student" | "teacher">("teacher");
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const loadData = async () => {
      const fetchedQuestions = await fetchQuestions();
      const fetchedAnswers = await fetchAnswers();
      setQuestions(fetchedQuestions);
      const answersMap = fetchedAnswers.reduce(
        (acc: Answers, answer: AnswerType) => {
          acc[answer.question_id] = answer;
          return acc;
        },
        {}
      );
      setAnswers(answersMap);
    };
    loadData();
  }, []);

  const handleAddQuestion = async (
    questionText: string,
    class_: string,
    score: number
  ) => {
    const newQuestion = await addQuestion(questionText, class_, score);
    if (newQuestion) {
      setQuestions((prevQuestions) => [newQuestion, ...prevQuestions]);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    await deleteQuestion(id);
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      delete newAnswers[id];
      return newAnswers;
    });
  };

  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    const newAnswer = await submitAnswer(questionId, answerText);
    if (newAnswer) {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: newAnswer,
      }));
    }
  };

  const handleDeleteAnswer = async (questionId: string) => {
    await deleteAnswer(questionId);
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      delete newAnswers[questionId];
      return newAnswers;
    });
  };

  const handleUpdateQuestion = (updatedQuestion: QuestionType) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  const handleUpdateAnswer = (updatedAnswer: AnswerType) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [updatedAnswer.question_id]: updatedAnswer,
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/tools"
            className="mr-2 text-neutral-500 hover:text-neutral-700 "
          >
            <ChevronLeft />
          </Link>
          <h1 className="text-4xl font-bold text-rose-500">Evaluator</h1>
        </div>
        <Select
          onValueChange={(value: "student" | "teacher") => setUserType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              defaultValue="teacher"
              placeholder="Select user type"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border border-neutral-200 p-4 rounded-md">
        <div className="mt-8">
          {userType === "teacher" ? (
            <TeacherView
              questions={questions}
              answers={answers}
              addQuestion={handleAddQuestion}
              deleteQuestion={handleDeleteQuestion}
              updateQuestionList={handleUpdateQuestion}
            />
          ) : (
            <StudentView
              questions={questions}
              answers={answers}
              submitAnswer={handleSubmitAnswer}
              deleteAnswer={handleDeleteAnswer}
              updateAnswerList={handleUpdateAnswer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
