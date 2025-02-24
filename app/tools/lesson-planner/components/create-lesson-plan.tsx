"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { generateLessonPlan } from "../actions/generateLessonPlan"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function CreateLessonPlan() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const lessonPlan = await generateLessonPlan(formData)

      if (!lessonPlan || !lessonPlan.plan_data) {
        throw new Error("Received empty or invalid lesson plan")
      }

      router.push(`/tools/lesson-planner/output?id=${lessonPlan.id}`)
    } catch (error) {
      console.error("Error generating lesson plan:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError(`Failed to generate lesson plan: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">Lesson Plan Generator</h1>
        <p className="text-gray-600">Generates lesson content to aid educators in preparing teaching materials.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select name="grade" required defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Grade {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classDuration">Duration (in mins)</Label>
                <Input
                  id="classDuration"
                  name="classDuration"
                  type="number"
                  placeholder="Add duration"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfDays">No. of Days</Label>
                <Select name="numberOfDays" required defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of days" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} {i === 0 ? "day" : "days"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="board">Education Board</Label>
                <Select name="board" required defaultValue="CBSE">
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="State">State Board</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Add subject" required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="chapterTopic">Topics</Label>
                <Input id="chapterTopic" name="chapterTopic" placeholder="Add topics" required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="learningObjectives">Lesson Objective </Label>
                <Textarea
                  id="learningObjectives"
                  name="learningObjectives"
                  placeholder="Add lesson objective"
                  rows={3}
                />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white" disabled={isLoading}>
              {isLoading ? "Generating Lesson Plan..." : "Generate Lesson Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}