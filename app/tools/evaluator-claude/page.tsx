"use client"

import { ExamEvaluator } from "./components/exam-evaluator"

export default function ExamEvaluatorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Exam Answer Evaluator</h1>
      <p className="text-gray-600 mb-8">
        Upload a question paper and an answer sheet as PDFs to evaluate and score the answers. 
        This tool uses Claude AI to analyze the content and provide detailed feedback.
      </p>
      <ExamEvaluator />
    </div>
  )
}
