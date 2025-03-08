"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Markdown from "react-markdown"
import { jsPDF } from "jspdf"

interface Evaluation {
  totalScore: number
  feedback: string
  questionBreakdown: Array<{
    question: string
    score: number
    maxScore: number
    feedback: string
  }>
}

const isValidEvaluation = (data: any): data is Evaluation => {
  return data && typeof data === "object" && "totalScore" in data && "questionBreakdown" in data
}

export function ExamEvaluator() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null)
  const [answerSheet, setAnswerSheet] = useState<File | null>(null)
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [evaluation, setEvaluation] = useState<Evaluation | string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleQuestionPaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQuestionPaper(e.target.files[0])
      setError("")
    }
  }

  const handleAnswerSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnswerSheet(e.target.files[0])
      setError("")
    }
  }

  const clearQuestionPaper = () => {
    setQuestionPaper(null)
  }

  const clearAnswerSheet = () => {
    setAnswerSheet(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!questionPaper || !answerSheet || !gradeLevel || !subject) {
      setError("Please upload both question paper and answer sheet, and fill in all required fields.")
      return
    }

    // Validate file types
    if (questionPaper.type !== "application/pdf" || answerSheet.type !== "application/pdf") {
      setError("Please upload PDF files for both question paper and answer sheet.")
      return
    }

    setIsLoading(true)
    setError("")
    setEvaluation(null)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90))
    }, 1000)

    const formData = new FormData()
    formData.append("questionPaper", questionPaper)
    formData.append("answerSheet", answerSheet)
    formData.append("subject", subject)
    formData.append("gradeLevel", gradeLevel)

    try {
      const response = await fetch("/api/evaluate-exam", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        if (isValidEvaluation(data.evaluation)) {
          setEvaluation(data.evaluation)
        } else {
          setEvaluation(data.evaluation)
        }
      } else {
        setError(data.error || "Something went wrong!")
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      setError("Failed to upload files or evaluate the exam.")
    } finally {
      clearInterval(interval)
      setUploadProgress(100)
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!evaluation) return

    const doc = new jsPDF()
    let yOffset = 10

    doc.setFontSize(18)
    doc.text("Exam Evaluation Results", 10, yOffset)
    yOffset += 10

    doc.setFontSize(12)
    if (typeof evaluation === "string") {
      doc.text(evaluation, 10, yOffset, { maxWidth: 190 })
    } else {
      doc.text(`Total Score: ${evaluation.totalScore}`, 10, yOffset)
      yOffset += 10

      doc.text(`Overall Feedback:`, 10, yOffset)
      yOffset += 7
      doc.text(evaluation.feedback, 10, yOffset, { maxWidth: 190 })
      yOffset += doc.getTextDimensions(evaluation.feedback, { maxWidth: 190 }).h + 10

      doc.text(`Question Breakdown:`, 10, yOffset)
      yOffset += 10

      evaluation.questionBreakdown.forEach((item, index) => {
        doc.setFontSize(14)
        doc.text(`Question ${index + 1}:`, 10, yOffset)
        yOffset += 7
        doc.setFontSize(12)
        doc.text(`Score: ${item.score}/${item.maxScore}`, 10, yOffset)
        yOffset += 7
        doc.text(`Question: ${item.question}`, 10, yOffset, { maxWidth: 190 })
        yOffset += doc.getTextDimensions(item.question, { maxWidth: 190 }).h + 5
        doc.text(`Feedback: ${item.feedback}`, 10, yOffset, { maxWidth: 190 })
        yOffset += doc.getTextDimensions(item.feedback, { maxWidth: 190 }).h + 10

        // Add a new page if we're running out of space
        if (yOffset > 270 && index < evaluation.questionBreakdown.length - 1) {
          doc.addPage()
          yOffset = 10
        }
      })
    }

    doc.save("exam_evaluation.pdf")
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Exam Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="questionPaper">Question Paper (PDF)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="questionPaper"
                      type="file"
                      accept="application/pdf"
                      onChange={handleQuestionPaperChange}
                      disabled={isLoading}
                    />
                    {questionPaper && (
                      <Button type="button" variant="outline" size="sm" onClick={clearQuestionPaper} disabled={isLoading}>
                        Clear
                      </Button>
                    )}
                  </div>
                  {questionPaper && <p className="text-sm text-gray-500">{questionPaper.name}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="answerSheet">Answer Sheet (PDF)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="answerSheet"
                      type="file"
                      accept="application/pdf"
                      onChange={handleAnswerSheetChange}
                      disabled={isLoading}
                    />
                    {answerSheet && (
                      <Button type="button" variant="outline" size="sm" onClick={clearAnswerSheet} disabled={isLoading}>
                        Clear
                      </Button>
                    )}
                  </div>
                  {answerSheet && <p className="text-sm text-gray-500">{answerSheet.name}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} disabled={isLoading}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="geography">Geography</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={isLoading}>
                    <SelectTrigger id="gradeLevel">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={`grade-${i + 1}`}>
                          Grade {i + 1}
                        </SelectItem>
                      ))}
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Evaluate Exam"
                )}
              </Button>

              {isLoading && <Progress value={uploadProgress} className="h-2 w-full" />}
            </form>
          </CardContent>
        </Card>

        {evaluation && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Evaluation Results</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download results as PDF</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              {typeof evaluation === "string" ? (
                <div className="prose max-w-none dark:prose-invert">
                  <Markdown>{evaluation}</Markdown>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Total Score</h3>
                    <span className="text-2xl font-bold">{evaluation.totalScore}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Overall Feedback</h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <Markdown>{evaluation.feedback}</Markdown>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
                    <div className="space-y-6">
                      {evaluation.questionBreakdown.map((item, index) => (
                        <div key={index} className="space-y-2 p-4 bg-muted rounded-md">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <span className="font-medium">
                              Score: {item.score}/{item.maxScore}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">Question:</p>
                            <p className="mb-2">{item.question}</p>
                            <p className="font-medium">Feedback:</p>
                            <div className="prose-sm max-w-none dark:prose-invert">
                              <Markdown>{item.feedback}</Markdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
