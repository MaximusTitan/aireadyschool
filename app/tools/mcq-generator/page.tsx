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
import CountrySelection from "./components/CountrySelection"
import BoardSelection from "./components/BoardSelection"
import LearningOutcomesInput from "./components/LearningOutcomesInput"
import { createClient } from "@/utils/supabase/client"
import type { CountryKey } from "@/types/assessment"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const supabase = createClient()

interface FormData {
  country: CountryKey | ""
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

// Updated DocumentFile interface to include public_url
interface DocumentFile {
  file_name: string
  public_url: string
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    country: "",
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
      country?: string
      board?: string
      class_level: string
      assessment_type: string
      difficulty: string
      learning_outcomes?: string[]
      created_at: string
    }>
  >([])
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])
  const [isDocumentSelected, setIsDocumentSelected] = useState(false)

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

      await Promise.all([fetchSavedAssessments(user.email || ""), fetchDocumentFiles(user.email || "")])
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

  // Modified to fetch both file_name and public_url from document-vault
  const fetchDocumentFiles = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("document-vault")
        .select("file_name, public_url")
        .eq("type", "file")
        .eq("user_email", email)

      if (error) throw error

      setDocumentFiles(data || [])
    } catch (error) {
      console.error("Error fetching document files:", error)
      setError("Failed to fetch document files. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setAssessment(null)
    setShowResults(false)
    setUserAnswers([])

    try {
      const submissionData: any = { ...formData }
      let apiRoute = "/api/generate-assessment"

      // If a document is selected, use its public_url as the topic for the rag-assessment API
      if (isDocumentSelected && formData.selectedDocument) {
        apiRoute = "/api/rag-assessment"
        const selectedDoc = documentFiles.find((doc) => doc.file_name === formData.selectedDocument)
        if (selectedDoc && selectedDoc.public_url) {
          submissionData.topic = selectedDoc.public_url
        } else {
          setError("Selected document not found or missing public URL")
          setIsLoading(false)
          return
        }
      }

      console.log("Submitting form data:", submissionData)

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      const user = await supabase.auth.getUser()
      if (user.data.user?.email) {
        fetchSavedAssessments(user.data.user.email)
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setError(
        `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please check the console for more details and try again.`,
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
    country?: string
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
      const { data, error } = await supabase.from("assessments").select("*").eq("id", id).single<Assessment>()

      if (error) {
        throw error
      }

      setAssessment(data.questions)
      setAssessmentId(data.id)
      setFormData({
        ...formData,
        country: (data.country as CountryKey) || "",
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
      const { data, error } = await supabase.from("assessments").select("*").eq("id", id).single<Assessment>()

      if (error) {
        throw error
      }

      setAssessment(data.questions)
      setAssessmentId(data.id)
      setFormData({
        country: (data.country as CountryKey) || "",
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
    setFormData((prevData) => ({ ...prevData, selectedDocument: null }))
  }

  const handleDocumentSelect = (fileName: string) => {
    setIsDocumentSelected(true)
    setFormData((prevData) => ({ ...prevData, selectedDocument: fileName }))
    console.log("Selected document:", fileName)
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
                <Select onValueChange={handleDocumentSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentFiles.map((doc) => (
                      <SelectItem key={doc.file_name} value={doc.file_name}>
                        {doc.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* First Row - Country and Board */}
              <div className="grid md:grid-cols-2 gap-8">
                <CountrySelection
                  value={formData.country}
                  onChange={(value: CountryKey) => setFormData({ ...formData, country: value, board: "" })}
                />
                <BoardSelection
                  value={formData.board}
                  onChange={(value) => setFormData({ ...formData, board: value })}
                  country={formData.country}
                />
              </div>

              {/* Second Row - Class, Subject and Assessment Type */}
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

