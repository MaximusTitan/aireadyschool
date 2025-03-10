"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Download, Video, Layout, FileText, File } from "lucide-react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"
import { EditLessonContent } from "../components/edit-lesson-content"
import { GenerateNotesDialog } from "../components/generate-notes-dialog"
import { AddContentDropdown } from "../components/add-content-dropdown"
import { useToast } from "@/components/ui/use-toast"

interface ScheduleItem {
  type: string
  title: string
  content: string
  timeAllocation: number
}

interface Assignment {
  description: string
  tasks: string[]
}

interface Day {
  day: number
  topicHeading: string
  learningOutcomes: string[]
  schedule: ScheduleItem[]
  teachingAids: string[]
  assignment: Assignment
}

interface Assessment {
  topic: string
  type: string
  description: string
  evaluationCriteria: string[]
}

interface AssessmentPlan {
  formativeAssessments: Assessment[]
  summativeAssessments: Assessment[]
  progressTrackingSuggestions: string[]
}

interface LessonPlan {
  id: string
  subject: string
  chapter_topic: string
  grade: string
  board: string
  class_duration: number
  number_of_days: number
  learning_objectives: string
  plan_data: {
    days: Day[]
    assessmentPlan: AssessmentPlan
  }
}

interface EditContentState {
  isOpen: boolean
  type: string
  data: any
  dayIndex?: number
}

interface GeneratedNotes {
  [key: string]: string
}

interface UploadedFile {
  id: string
  name: string
  type: string
  url: string
}

export default function OutputContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("day-1")
  const [editContent, setEditContent] = useState<EditContentState>({
    isOpen: false,
    type: "",
    data: null,
  })
  const [generateNotesDialog, setGenerateNotesDialog] = useState<{
    isOpen: boolean
    activity: { title: string; content: string } | null
  }>({
    isOpen: false,
    activity: null,
  })
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNotes>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: UploadedFile[] }>({})
  const { toast } = useToast()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  // Check authentication state directly in component
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession()
        const email = data.session?.user?.email || null
        setUserEmail(email)
        setIsAuthChecking(false)
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthChecking(false)
      }
    }
    
    checkAuth()
    
    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email || null)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchLessonPlan = useCallback(async () => {
    if (!id) {
      setError("No lesson plan ID provided")
      return
    }

    try {
      // First verify the lesson plan exists
      const { data: lessonPlanData, error: lessonPlanError } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .single()

      if (lessonPlanError) throw lessonPlanError
      
      // Set the lesson plan data immediately
      if (lessonPlanData) {
        setLessonPlan(lessonPlanData as LessonPlan)
        
        // Check ownership only for informational purposes, don't prevent viewing
        if (userEmail && lessonPlanData.user_email && lessonPlanData.user_email !== userEmail) {
          console.warn("User viewing a lesson plan they don't own")
        }
      } else {
        setError("Lesson plan not found")
      }

      // Rest of your fetch logic for notes and files remains the same
      try {
        const { data: notesData, error: notesError } = await supabase
          .from("generated_notes")
          .select("*")
          .eq("lesson_plan_id", id)

        if (notesError) throw notesError
        if (notesData) {
          const notesObj: GeneratedNotes = {}
          notesData.forEach((note) => {
            notesObj[note.activity_title] = note.content
          })
          setGeneratedNotes(notesObj)
        }
      } catch (notesError) {
        console.warn("Error fetching generated notes:", notesError)
      }

      try {
        const { data: filesData, error: filesError } = await supabase
          .from("uploaded_files")
          .select("*")
          .eq("lesson_plan_id", id)

        if (filesError) throw filesError
        if (filesData) {
          const filesObj: { [key: string]: UploadedFile[] } = {}
          filesData.forEach((file) => {
            if (!filesObj[file.section_id]) filesObj[file.section_id] = []
            filesObj[file.section_id].push({
              id: file.id,
              name: file.file_name,
              type: file.file_type,
              url: file.file_url,
            })
          })
          setUploadedFiles(filesObj)
        }
      } catch (filesError) {
        console.warn("Error fetching uploaded files:", filesError)
      }
    } catch (error) {
      console.error("Error fetching lesson plan data:", error)
      setError("Failed to fetch lesson plan data. Please try again.")
    }
  }, [id, userEmail])

  // Fetch lesson plan when we have an ID, regardless of auth state
  useEffect(() => {
    if (id) {
      fetchLessonPlan()
    }
  }, [id, fetchLessonPlan])

  const handleEdit = (type: string, data: any, dayIndex?: number) => {
    setEditContent({
      isOpen: true,
      type,
      data,
      dayIndex,
    })
  }

  const handleSave = async () => {
    await fetchLessonPlan()
  }

  const handleGenerateNotes = (activityTitle: string, activityContent: string) => {
    setGenerateNotesDialog({
      isOpen: true,
      activity: {
        title: activityTitle,
        content: activityContent,
      },
    })
  }

  const handleNotesGenerated = async (notes: string) => {
    if (generateNotesDialog.activity && lessonPlan && userEmail) {
      try {
        const { data, error } = await supabase
          .from("generated_notes")
          .upsert({
            lesson_plan_id: lessonPlan.id,
            activity_title: generateNotesDialog.activity.title,
            content: notes,
            // User association is maintained through lesson_plan_id foreign key
          })
          .select()

        if (error) throw error

        setGeneratedNotes((prev) => ({
          ...prev,
          [generateNotesDialog.activity!.title]: notes,
        }))

        toast({
          title: "Success",
          description: "Notes saved successfully",
        })
      } catch (error) {
        console.error("Error saving generated notes:", error)
        toast({
          title: "Error",
          description: "Failed to save notes. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (file: File, type: string, sectionId: string) => {
    if (!lessonPlan) return
    
    try {
      // If user is not authenticated, show toast but don't redirect
      if (!userEmail) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upload files",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Uploading...",
        description: `Uploading ${file.name}`,
      })

      // Create a user and lesson specific path for better organization
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      
      // Create path structure: userEmail/lessonPlanId/fileName
      // Replace special characters in email with underscores for valid path
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_')
      const filePath = `${safeEmail}/${lessonPlan.id}/${fileName}`

      console.log(`Uploading file to path: ${filePath}`)

      // Upload file to Supabase Storage with user-specific path
      const { error: uploadError } = await supabase.storage
        .from("lesson-plan-materials")
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type
        })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("lesson-plan-materials").getPublicUrl(filePath)

      // Save file info to database with user email association
      const { data: fileData, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          lesson_plan_id: lessonPlan.id,
          section_id: sectionId,
          file_name: file.name,
          file_type: type,
          file_url: publicUrl,
          // The user_email relationship is maintained through the lesson_plan_id foreign key
        })
        .select()

      if (dbError) {
        console.error("Database error:", dbError)
        throw dbError
      }

      // Update UI
      const newFile = {
        id: fileData[0].id,
        name: file.name,
        type,
        url: publicUrl,
      }

      setUploadedFiles((prev) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), newFile],
      }))

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: typeof error === 'object' && error !== null && 'message' in error ? 
          (error as { message: string }).message : 
          "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p>{error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    )
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Loading...</h1>
      </div>
    )
  }

  const renderDayContent = (day: Day) => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Session {day.day}: {day.topicHeading}
        </h2>
        <p className="text-gray-600 mt-4">
          {day.schedule.find((item) => item.type === "introduction")?.content ||
            "This session focuses on key concepts related to the topic."}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
        <ul className="space-y-2">
          {day.learningOutcomes.map((outcome, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
              </span>
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Objectives</h3>
        <ul className="space-y-2">
          {day.schedule
            .filter((item) => item.type === "mainContent" || item.type === "activity")
            .slice(0, 2)
            .map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                  <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                </span>
                <span>{item.title}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Plan</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-24">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Activities</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-64">Materials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {day.schedule.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {String(item.timeAllocation).padStart(2, "0")}:{String(0).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{item.title || item.type}</div>
                    <div className="mt-1 text-sm text-gray-500">{item.content}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Lesson Content</div>
                        <AddContentDropdown
                          onUpload={(file, type) => handleFileUpload(file, type, `material-${day.day}-${index}`)}
                        />
                      </div>
                      <div className="text-gray-500">{item.title}</div>
                      <button
                        className="text-rose-500 hover:text-rose-600 text-sm mt-1 flex items-center gap-1"
                        onClick={() => handleGenerateNotes(item.title, item.content)}
                        aria-label={generatedNotes[item.title] ? "View generated notes" : "Generate notes"}
                      >
                        {generatedNotes[item.title] ? "See the content" : "Generate"}
                      </button>
                      {uploadedFiles[`material-${day.day}-${index}`]?.map((file, fileIndex) => {
                        // Generate standardized file name based on type and count
                        const displayName = `${file.type}_${fileIndex + 1}`;
                        
                        return (
                          <div key={file.id} className="mt-2 text-sm">
                            <a
                              href={file.url}
                              target="_blank"                              
                              
                              
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                              title={file.name} // Show original filename on hover
                            >
                              {displayName}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Teaching Aids</h3>
          <Button variant="ghost" size="icon" onClick={() => handleEdit("teachingAids", day.teachingAids, day.day - 1)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          {day.teachingAids.map((aid, index) => (
            <li key={index} className="text-gray-600">
              {aid}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assignment</h3>
          <Button variant="ghost" size="icon" onClick={() => handleEdit("assignment", day.assignment, day.day - 1)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600 mb-2">{day.assignment.description}</p>
        <ul className="list-disc pl-5 space-y-1">
          {day.assignment.tasks.map((task, index) => (
            <li key={index} className="text-gray-600">
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  const renderAssessmentPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Assessment Plan</h2>
        <AddContentDropdown onUpload={(file, type) => handleFileUpload(file, type, "assessment-plan")} />
      </div>

      {uploadedFiles["assessment-plan"]?.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold mb-2">Uploaded Materials</h3>
          <div className="space-y-2">
            {uploadedFiles["assessment-plan"].map((file) => (
              <div key={file.id} className="flex items-center gap-2">
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {file.type}: {file.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Formative Assessments</h3>
          <div className="space-y-4">
            {lessonPlan.plan_data.assessmentPlan.formativeAssessments.map((assessment, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium mb-2">{assessment.topic}</div>
                <p className="text-gray-600 mb-2">{assessment.description}</p>
                <div className="text-sm text-gray-500">Type: {assessment.type}</div>
                <div className="mt-2">
                  <div className="font-medium text-sm mb-1">Evaluation Criteria:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {assessment.evaluationCriteria.map((criteria, idx) => (
                      <li key={idx} className="text-gray-600">
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Summative Assessments</h3>
          <div className="space-y-4">
            {lessonPlan.plan_data.assessmentPlan.summativeAssessments.map((assessment, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium mb-2">{assessment.topic}</div>
                <p className="text-gray-600 mb-2">{assessment.description}</p>
                <div className="text-sm text-gray-500">Type: {assessment.type}</div>
                <div className="mt-2">
                  <div className="font-medium text-sm mb-1">Evaluation Criteria:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {assessment.evaluationCriteria.map((criteria, idx) => (
                      <li key={idx} className="text-gray-600">
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Progress Tracking Suggestions</h3>
          <ul className="list-disc pl-5 space-y-1">
            {lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.map((suggestion, index) => (
              <li key={index} className="text-gray-600">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  const handleDownload = () => {
    if (!lessonPlan) return

    const doc = new jsPDF()
    let yOffset = 20

    // Helper functions for PDF generation
    const addHeading = (text: string, size = 16) => {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(size)
        doc.text(text, 20, yOffset)
        yOffset += 10
      }

    const addText = (text: string, size = 12) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, 170)
      doc.text(lines, 20, yOffset)
      yOffset += (lines.length * size) / 2 + 5
    }

    const addBulletPoint = (text: string, indent = 20) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(12)
      const lines = doc.splitTextToSize(text, 160)
      doc.text("•", indent, yOffset)
      doc.text(lines, indent + 5, yOffset)
      yOffset += (lines.length * 12) / 2 + 5
    }

    const checkNewPage = () => {
      if (yOffset > 270) {
        doc.addPage()
        yOffset = 20
      }
    }

    // Title and Basic Information
    addHeading(`${lessonPlan.subject} - ${lessonPlan.chapter_topic}`, 20)
    addText(`Grade: ${lessonPlan.grade}`)
    addText(`Board: ${lessonPlan.board}`)
    addText(`Duration: ${lessonPlan.class_duration} minutes`)
    addText(`Number of Days: ${lessonPlan.number_of_days}`)
    if (lessonPlan.learning_objectives) {
      addText(`Learning Objectives: ${lessonPlan.learning_objectives}`)
    }
    yOffset += 10

    // Daily Plans
    lessonPlan.plan_data.days.forEach((day, index) => {
      checkNewPage()
      addHeading(`Day ${day.day}: ${day.topicHeading}`, 16)

      // Learning Outcomes
      addHeading("Learning Outcomes:", 14)
      day.learningOutcomes.forEach((outcome) => {
        checkNewPage()
        addBulletPoint(outcome)
      })
      yOffset += 5

      // Schedule
      checkNewPage()
      addHeading("Schedule:", 14)
      day.schedule.forEach((item) => {
        checkNewPage()
        addText(`${item.title || item.type} (${item.timeAllocation} min):`)
        addText(item.content)
        yOffset += 2
      })

      // Teaching Aids
      checkNewPage()
      addHeading("Teaching Aids:", 14)
      day.teachingAids.forEach((aid) => {
        checkNewPage()
        addBulletPoint(aid)
      })

      // Assignment
      checkNewPage()
      addHeading("Assignment:", 14)
      addText(day.assignment.description)
      day.assignment.tasks.forEach((task) => {
        checkNewPage()
        addBulletPoint(task)
      })

      yOffset += 10
    })

    // Assessment Plan
    checkNewPage()
    addHeading("Assessment Plan", 16)
    yOffset += 5

    // Formative Assessments
    addHeading("Formative Assessments:", 14)
    lessonPlan.plan_data.assessmentPlan.formativeAssessments.forEach((assessment) => {
      checkNewPage()
      addText(`${assessment.topic} (${assessment.type})`)
      addText(assessment.description)
      addText("Evaluation Criteria:")
      assessment.evaluationCriteria.forEach((criteria) => {
        checkNewPage()
        addBulletPoint(criteria)
      })
      yOffset += 5
    })

    // Summative Assessments
    checkNewPage()
    addHeading("Summative Assessments:", 14)
    lessonPlan.plan_data.assessmentPlan.summativeAssessments.forEach((assessment) => {
      checkNewPage()
      addText(`${assessment.topic} (${assessment.type})`)
      addText(assessment.description)
      addText("Evaluation Criteria:")
      assessment.evaluationCriteria.forEach((criteria) => {
        checkNewPage()
        addBulletPoint(criteria)
      })
      yOffset += 5
    })

    // Progress Tracking
    checkNewPage()
    addHeading("Progress Tracking Suggestions:", 14)
    lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.forEach((suggestion) => {
      checkNewPage()
      addBulletPoint(suggestion)
    })

    // Save the PDF
    const fileName = `${lessonPlan.subject}_${lessonPlan.chapter_topic}_Grade${lessonPlan.grade}.pdf`
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()

    doc.save(fileName)
  }

  return (
    <div className="min-h-screen bg-backgroundApp">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="outline" className="mb-6" onClick={() => router.push("/tools/lesson-planner")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {lessonPlan && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Lesson Plan: {lessonPlan.chapter_topic}</h1>
              <p className="text-gray-600 mt-2">
                {lessonPlan.grade} Grade | {lessonPlan.board} | {lessonPlan.number_of_days} Sessions -{" "}
                {lessonPlan.class_duration} Minutes Each
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Sessions</h2>
              <div className="space-y-2">
                {lessonPlan.plan_data.days.map((day) => (
                  <div
                    key={`session-${day.day}`}
                    className="border rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab(`day-${day.day}`)}
                  >
                    <div className="flex">
                      <div className="w-1 bg-rose-500 mr-4"></div>
                      <div>
                        <span className="font-medium">Session {day.day}</span>: {day.topicHeading}
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="border rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveTab("assessment")}
                >
                  <div className="flex">
                    <div className="w-1 bg-rose-500 mr-4"></div>
                    <div>
                      <span className="font-medium">Assessment Plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              {activeTab.startsWith("day-") &&
                renderDayContent(lessonPlan.plan_data.days[Number.parseInt(activeTab.split("-")[1]) - 1])}
              {activeTab === "assessment" && renderAssessmentPlan()}
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={() => router.push("/tools/lesson-planner/create")}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Generate New Lesson Plan
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </>
        )}

        {generateNotesDialog.activity && (
          <GenerateNotesDialog
            isOpen={generateNotesDialog.isOpen}
            onClose={() => setGenerateNotesDialog({ isOpen: false, activity: null })}
            activity={generateNotesDialog.activity}
            storedNotes={generatedNotes[generateNotesDialog.activity.title] || null}
            onNotesGenerated={handleNotesGenerated}
          />
        )}
        {editContent.isOpen && (
          <EditLessonContent
            isOpen={editContent.isOpen}
            onClose={() => setEditContent({ ...editContent, isOpen: false })}
            onSave={handleSave}
            content={editContent}
            lessonPlanId={lessonPlan.id}
          />
        )}
      </div>
    </div>
  )
}

