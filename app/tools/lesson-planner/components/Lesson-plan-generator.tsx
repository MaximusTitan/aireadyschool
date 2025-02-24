"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, BookOpen } from "lucide-react"
import { supabase } from "@/app/tools/lesson-planner/lib/supabase"
import { format } from "date-fns"

interface LessonPlan {
  id: string
  subject: string
  chapter_topic: string
  grade: string
  board: string
  created_at: string
}

const subjectIcons: { [key: string]: string } = {
  Mathematics: "📐",
  Science: "🔬",
  English: "📚",
  History: "🏛️",
  Geography: "🌍",
  Physics: "⚡",
  Chemistry: "🧪",
  Biology: "🧬",
  Social: "👥",
  default: "📖",
}

export default function LessonPlanGenerator() {
  const router = useRouter()
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])

  useEffect(() => {
    fetchLessonPlans()
  }, [])

  const fetchLessonPlans = async () => {
    try {
      const { data, error } = await supabase.from("lesson_plans").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setLessonPlans(data || [])
    } catch (error) {
      console.error("Error fetching lesson plans:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("lesson_plans").delete().eq("id", id)
      if (error) throw error
      await fetchLessonPlans()
    } catch (error) {
      console.error("Error deleting lesson plan:", error)
    }
  }

  const getSubjectIcon = (subject: string) => {
    const normalizedSubject = Object.keys(subjectIcons).find((key) => subject.toLowerCase().includes(key.toLowerCase()))
    return subjectIcons[normalizedSubject || "default"]
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">Lesson Plan Generator</h1>
        <p className="text-gray-600 mb-4">Generates lesson content to aid educators in preparing teaching materials.</p>
        <Button onClick={() => router.push("/tools/lesson-planner/create")} className="bg-pink-600 hover:bg-pink-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Lesson Plan
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Past Lesson Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessonPlans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <span className="text-2xl">{getSubjectIcon(plan.subject)}</span>
                      <span className="font-medium">{plan.subject}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-gray-900">{plan.chapter_topic}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-pink-600 font-medium">Grade {plan.grade}</span>
                      <span className="text-gray-500 text-sm">{format(new Date(plan.created_at), "dd-MMM-yy")}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">{plan.board}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 text-pink-600 hover:text-pink-700 border-pink-200 hover:border-pink-300"
                    onClick={() => router.push(`/tools/lesson-planner/output?id=${plan.id}`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {lessonPlans.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            <p>No lesson plans found. Create your first lesson plan!</p>
          </Card>
        )}
      </div>
    </div>
  )
}

