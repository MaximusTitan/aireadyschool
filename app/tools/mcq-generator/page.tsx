"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ClassSelection from "./components/ClassSelection"
import SubjectSelection from "./components/SubjectSelection"
import TopicInput from "./components/TopicInput"
import AssessmentTypeSelection from "./components/AssessmentTypeSelection"
import DifficultySelection from "./components/DifficultySelection"
import QuestionCount from "./components/QuestionCount"
import Assessment from "./components/Assessment"
import BoardSelection from "./components/BoardSelection"
import LearningOutcomesInput from "./components/LearningOutcomesInput"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const supabase = createClient()

interface FormData {
  board: string
  classLevel: string
  subject: string
  topic: string
  assessmentType: string
  difficulty: string
  questionCount: number
  learningOutcomes: string[]
  selectedDocument?: string | null
}

// Updated DocumentFile interface: removed country property.
interface DocumentFile {
  id: string
  grade: string
  education_board: string
  subject: string
  topic: string
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    board: "",
    classLevel: "Grade 9",
    subject: "Math",
    topic: "",
    assessmentType: "mcq",
    difficulty: "Medium",
    questionCount: 10,
    learningOutcomes: [],
    selectedDocument: null,
  })
  const [assessment, setAssessment] = useState<any[] | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Answer[]>([])
  const [savedAssessments, setSavedAssessments] = useState<
    Array<{
      id: string
      subject: string
      topic: string
      questions: any[]
      answers?: any[]
      board?: string
      class_level: string
      assessment_type: string
      learning_outcomes?: string[]
      created_at: string
    }>
  >([])
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])
  const [isDocumentSelected, setIsDocumentSelected] = useState(false)

  // --- Handlers for updating form fields ---
  const handleBoardChange = (value: string) =>
    setFormData((prev) => ({ ...prev, board: value }))
  const handleGradeChange = (value: string) =>
    setFormData((prev) => ({ ...prev, classLevel: value }))
  const handleSubjectChange = (value: string) =>
    setFormData((prev) => ({ ...prev, subject: value }))

  // When the user selects a document, update formData accordingly.
  const handleDocumentSelect = (docId: string) => {
    setIsDocumentSelected(true)
    const selectedDoc = documentFiles.find((doc) => doc.id === docId)
    if (selectedDoc) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        board: selectedDoc.education_board,
        classLevel: selectedDoc.grade,
        subject: selectedDoc.subject,
        topic: selectedDoc.topic,
        selectedDocument: docId,
      }))
      console.log("Updated form data:", {
        board: selectedDoc.education_board,
        classLevel: selectedDoc.grade,
        subject: selectedDoc.subject,
        topic: selectedDoc.topic,
      })
    }
  }

  useEffect(() => {
    fetchUserAndData()
  }, [])

  const fetchUserAndData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("User not authenticated")

      await Promise.all([
        fetchSavedAssessments(user.email || ""),
        fetchKnowledgeBaseDocs(user.email || ""),
      ])
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to fetch user data. Please try again or log in.")
    }
  }

  const fetchSavedAssessments = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false })

      if (error) throw error

      setSavedAssessments(data || [])
    } catch (error) {
      console.error("Error fetching saved assessments:", error)
      setError("Failed to fetch saved assessments. Please try again.")
    }
  }

  const fetchKnowledgeBaseDocs = async (email: string) => {
    try {
      const { data, error } = await supabase.from("knowledge_base").select("*")
      if (error) throw error
      setDocumentFiles(data || [])
    } catch (error) {
      console.error("Error fetching knowledge_base docs:", error)
      setError("Failed to fetch documents. Please try again.")
    }
  }

  // Submission handler: if a document is selected, override the payload with its values.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setAssessment(null)
    setShowResults(false)
    setUserAnswers([])

    try {
      let submissionData: any = { ...formData }
      
      // Add model to submissionData
      submissionData.model = formData.board === "CAIE" ? "claude-3-5-sonnet-20240620" : "gpt-4o"
      console.log("Selected model:", submissionData.model);
      
      if (isDocumentSelected && formData.selectedDocument) {
        const selectedDoc = documentFiles.find(
          (doc) => doc.id === formData.selectedDocument
        )
        if (selectedDoc && selectedDoc.topic) {
          submissionData.topic = selectedDoc.topic
          submissionData.board = selectedDoc.education_board
          submissionData.subject = selectedDoc.subject
        } else {
          setError("Selected document not found or missing topic.")
          setIsLoading(false)
          return
        }
      }

      console.log("Submitting form data:", submissionData)
      let apiRoute = "/api/generate-assessment"
      if (isDocumentSelected && formData.selectedDocument) {
        apiRoute = "/api/rag-assessment"
      }

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      })
      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      if (!data.assessment || !Array.isArray(data.assessment)) {
        throw new Error("Invalid assessment data received")
      }

      setAssessment(data.assessment)
      setAssessmentId(data.id)

      // Refresh saved assessments
      const user = await supabase.auth.getUser()
      if (user.data.user?.email) {
        fetchSavedAssessments(user.data.user.email)
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setError(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please check the console for more details and try again.`
      )
    } finally {
      setIsLoading(false)
    }
  }

  interface Answer {
    questionIndex: number
    selectedAnswer: string
  }

  const handleAnswerSubmit = (answers: Answer[]): void => {
    setUserAnswers(answers)
    setShowResults(true)
  }

  interface Assessment {
    id: string
    board?: string
    class_level: string
    subject: string
    topic: string
    assessment_type: string
    difficulty: string
    questions: any[]
    answers?: any[]
    learning_outcomes?: string[]
  }

  interface AssessmentError {
    message: string
  }

  const handleLoadAssessment = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single<Assessment>()

      if (error) {
        throw error
      }

      setAssessment(data.questions)
      setAssessmentId(data.id)
      setFormData({
        board: data.board || "",
        classLevel: data.class_level,
        subject: data.subject,
        topic: data.topic,
        assessmentType: data.assessment_type,
        difficulty: data.difficulty,
        questionCount: data.questions.length,
        learningOutcomes: data.learning_outcomes || [],
      })
      setShowResults(false)
      setUserAnswers(data.answers || [])

      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error: unknown) {
      const err = error as AssessmentError
      console.error("Error loading assessment:", error)
      setError(`Failed to load assessment: ${err.message}`)
    }
  }

  const handleViewAnswers = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single<Assessment>()

      if (error) {
        throw error
      }

      setAssessment(data.questions)
      setAssessmentId(data.id)
      setFormData({
        board: data.board || "",
        classLevel: data.class_level,
        subject: data.subject,
        topic: data.topic,
        assessmentType: data.assessment_type,
        difficulty: data.difficulty,
        questionCount: data.questions.length,
        learningOutcomes: data.learning_outcomes || [],
      })
      setShowResults(true)
      setUserAnswers(data.answers || [])
    } catch (error: unknown) {
      const err = error as AssessmentError
      console.error("Error loading assessment answers:", error)
      setError(`Failed to load assessment answers: ${err.message}`)
    }
  }

  const handleReset = () => {
    setAssessment(null)
    setAssessmentId(null)
    setShowResults(false)
    setUserAnswers([])
    setError("")
    setIsDocumentSelected(false)
    setFormData({
      board: "",
      classLevel: "",
      subject: "",
      topic: "",
      assessmentType: formData.assessmentType,
      difficulty: formData.difficulty,
      questionCount: formData.questionCount,
      learningOutcomes: formData.learningOutcomes,
      selectedDocument: null,
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">Assessment Generator</h1>
        <p className="text-muted-foreground text-lg">
          Create interactive multiple-choice, descriptive, fill in the blanks questions for students to assess their
          understanding.
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardContent className="p-6 space-y-8">
          {!assessment ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Selection */}
              <div className="mb-4">
                <Select onValueChange={(value) => handleDocumentSelect(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentFiles.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.subject} - Grade {doc.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* If a document is selected, auto-fill board, grade, and subject and disable manual changes.
                  Additionally, display the selected values as text for clarity. */}
              {isDocumentSelected ? (
                <>
                  <div className="grid md:grid-cols-1 gap-8">
                    <BoardSelection
                      value={formData.board}
                      onChange={handleBoardChange}
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">Selected Board: {formData.board}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <ClassSelection
                      value={formData.classLevel}
                      onChange={handleGradeChange}
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">Selected Grade: {formData.classLevel}</p>
                    <SubjectSelection
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">Selected Subject: {formData.subject}</p>
                  </div>
                  <div>
                    <AssessmentTypeSelection
                      value={formData.assessmentType}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, assessmentType: value }))
                      }
                    />
                  </div>
                </>
              ) : (
                // Otherwise, allow manual selection.
                <>
                  <div className="grid md:grid-cols-1 gap-8">
                    <BoardSelection
                      value={formData.board}
                      onChange={(value) => setFormData({ ...formData, board: value })}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    <ClassSelection
                      value={formData.classLevel}
                      onChange={(value) => setFormData({ ...formData, classLevel: value })}
                    />
                    <SubjectSelection
                      value={formData.subject}
                      onChange={(value) => setFormData({ ...formData, subject: value })}
                    />
                    <AssessmentTypeSelection
                      value={formData.assessmentType}
                      onChange={(value) => setFormData({ ...formData, assessmentType: value })}
                    />
                  </div>
                </>
              )}

              {/* Topic Input */}
              <TopicInput
                value={formData.topic}
                onChange={(value) => setFormData({ ...formData, topic: value })}
                disabled={isDocumentSelected}
              />

              {/* Learning Outcomes */}
              <LearningOutcomesInput
                value={formData.learningOutcomes}
                onChange={(value) => setFormData({ ...formData, learningOutcomes: value })}
              />

              {/* Third Row - Difficulty and Question Count */}
              <div className="grid md:grid-cols-2 gap-8">
                <DifficultySelection
                  value={formData.difficulty}
                  onChange={(value) => setFormData({ ...formData, difficulty: value })}
                />
                <QuestionCount
                  value={formData.questionCount}
                  onChange={(value) => setFormData({ ...formData, questionCount: value })}
                />
              </div>

              {/* Generate Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Assessment"
                )}
              </Button>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" onClick={handleReset} className="border-neutral-500">
                  ← Back to Generator
                </Button>
              </div>
              <Assessment
                assessment={assessment}
                assessmentType={formData.assessmentType}
                onSubmit={handleAnswerSubmit}
                showResults={showResults}
                userAnswers={userAnswers}
                assessmentId={assessmentId || ""}
                topic={formData.topic}
              />
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>{error}</p>
              <p className="mt-2 text-sm">Please check the browser console for more details.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Assessments Card */}
      {savedAssessments.length > 0 && (
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-2xl font-bold">Saved Assessments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative w-full overflow-auto max-h-[400px] scrollbar-thin">
              <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                  background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                  background-color: rgba(0, 0, 0, 0.1);
                  border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(0, 0, 0, 0.2);
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                  background-color: rgba(255, 255, 255, 0.1);
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(255, 255, 255, 0.2);
                }
              `}</style>
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted sticky top-0 bg-white dark:bg-gray-950">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Board</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/4">Title</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Grade</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {savedAssessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">{assessment.board}</td>
                      <td className="p-4 align-middle truncate max-w-[200px]">{assessment.topic}</td>
                      <td className="p-4 align-middle">{assessment.class_level}</td>
                      <td className="p-4 align-middle">{assessment.subject}</td>
                      <td className="p-4 align-middle capitalize">{assessment.assessment_type}</td>
                      <td className="p-4 align-middle">
                        {new Date(assessment.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleLoadAssessment(assessment.id)} variant="ghost" size="icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-pencil"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button onClick={() => handleViewAnswers(assessment.id)} variant="ghost" size="icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-eye"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span className="sr-only">View Answers</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
