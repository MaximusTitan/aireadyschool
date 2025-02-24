"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Clock, Download } from "lucide-react"
import { supabase } from "@/app/tools/lesson-planner/lib/supabase"
import jsPDF from "jspdf"
import {EditLessonContent }from "@/app/tools/lesson-planner/components/edit-lesson-plan"

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

  const fetchLessonPlan = useCallback(async () => {
    if (!id) {
      setError("No lesson plan ID provided")
      return
    }

    try {
      const { data, error } = await supabase.from("lesson_plans").select("*").eq("id", id).single()

      if (error) throw error
      if (data) setLessonPlan(data as LessonPlan)
      else setError("Lesson plan not found")
    } catch (error) {
      console.error("Error fetching lesson plan:", error)
      setError("Failed to fetch lesson plan. Please try again.")
    }
  }, [id])

  useEffect(() => {
    fetchLessonPlan()
  }, [fetchLessonPlan])

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
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Day {day.day}: {day.topicHeading}
        </h2>
        <div className="text-gray-600 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Total Time: {lessonPlan.class_duration} minutes / {lessonPlan.class_duration} minutes allocated
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Learning Outcomes</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit("learningOutcomes", day.learningOutcomes, day.day - 1)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mb-2">By the end of this session, students will be able to:</p>
          <ul className="list-disc pl-5 space-y-1">
            {day.learningOutcomes.map((outcome, index) => (
              <li key={index} className="text-gray-600">
                {outcome}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Detailed Schedule</h3>
            <Button variant="ghost" size="icon" onClick={() => handleEdit("schedule", day.schedule, day.day - 1)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {day.schedule.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{item.title || item.type}</div>
                  <div className="text-gray-500">{item.timeAllocation} min</div>
                </div>
                <p className="text-gray-600">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Teaching Aids</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit("teachingAids", day.teachingAids, day.day - 1)}
            >
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Assignment</h3>
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
    </div>
  )

  const renderAssessmentPlan = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">Assessment Plan</h2>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </div>

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" className="text-gray-600 hover:text-gray-900" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-pink-600 hover:text-pink-700" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="day-1" className="space-y-6">
            <TabsList>
              {lessonPlan.plan_data.days.map((day) => (
                <TabsTrigger
                  key={`day-${day.day}`}
                  value={`day-${day.day}`}
                  className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                >
                  Day {day.day}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="assessment"
                className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
              >
                Assessment Plan
              </TabsTrigger>
            </TabsList>

            {lessonPlan.plan_data.days.map((day) => (
              <TabsContent key={`day-${day.day}`} value={`day-${day.day}`}>
                {renderDayContent(day)}
              </TabsContent>
            ))}

            <TabsContent value="assessment">{renderAssessmentPlan()}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={() => router.push("/create")} className="bg-pink-600 hover:bg-pink-700 text-white">
          Generate New Lesson Plan
        </Button>
      </div>
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
  )
}
