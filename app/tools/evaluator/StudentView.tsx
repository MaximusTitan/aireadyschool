'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Question, Answers } from './page'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from 'lucide-react'

type StudentViewProps = {
  questions: Question[];
  answers: Answers;
  submitAnswer: (questionId: string, answerText: string) => void;
  deleteAnswer: (questionId: string) => void;
}

export default function StudentView({ questions, answers, submitAnswer, deleteAnswer }: StudentViewProps) {
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({})

  const handleAnswerChange = (questionId: string, text: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: text
    }))
  }

  const handleSubmit = (questionId: string) => {
    submitAnswer(questionId, currentAnswers[questionId] || '')
    setCurrentAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[questionId]
      return newAnswers
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Student View</h2>
      {questions.length === 0 ? (
        <p>No questions available yet.</p>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>{question.text}</CardTitle>
              </CardHeader>
              <CardContent>
                {answers[question.id] ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Your submitted answer:</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAnswer(question.id)}
                        aria-label="Delete answer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="bg-gray-100 p-3 rounded">{answers[question.id].text}</p>
                  </div>
                ) : (
                  <div>
                    <Textarea
                      value={currentAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here"
                      className="mb-2"
                    />
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

