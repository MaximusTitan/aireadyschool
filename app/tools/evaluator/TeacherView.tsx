'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Question, Answers } from './page'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TeacherViewProps = {
  questions: Question[];
  answers: Answers;
  addQuestion: (questionText: string) => void;
  deleteQuestion: (id: string) => void;
}

export default function TeacherView({ questions, answers, addQuestion, deleteQuestion }: TeacherViewProps) {
  const [newQuestion, setNewQuestion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newQuestion.trim()) {
      addQuestion(newQuestion.trim())
      setNewQuestion('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Teacher View</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter a new question"
            className="flex-grow"
          />
          <Button type="submit">Add Question</Button>
        </div>
      </form>
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {question.text}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {answers[question.id] ? (
                <div>
                  <h4 className="font-semibold mb-2">Student's answer:</h4>
                  <p className="bg-gray-100 p-3 rounded">{answers[question.id].text}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No answer submitted yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

