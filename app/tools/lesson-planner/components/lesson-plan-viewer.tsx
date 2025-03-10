"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, Printer, Share2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LessonPlanProps {
  title: string
  grade: string
  board: string
  sessions: number
  duration: number
  currentSession: {
    title: string
    description: string
    learningOutcomes: string[]
    lessonObjectives: string[]
    plan: {
      duration: string
      activities: {
        title: string
        description: string
        details?: string[]
      }
      materials: {
        title: string
        type: string
      }[]
    }[]
  }
}

export function LessonPlanViewer({ lessonPlan }: { lessonPlan: LessonPlanProps }) {
  const [activeSession, setActiveSession] = useState(1)
  const [reflection, setReflection] = useState("")

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{lessonPlan.title}</h1>
        <p className="text-gray-600">
          {lessonPlan.grade} | {lessonPlan.board} | {lessonPlan.sessions} Sessions - {lessonPlan.duration} Minutes Each
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sessions</h2>
        <div className="space-y-2">
          {Array.from({ length: lessonPlan.sessions }, (_, i) => (
            <div
              key={i + 1}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg relative"
              onClick={() => setActiveSession(i + 1)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 rounded-l-lg" />
              <div className="ml-4">
                <span className="font-medium">Session {i + 1}:</span> {lessonPlan.currentSession.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">{lessonPlan.currentSession.title}</h2>
          <p className="text-gray-600 mb-8">{lessonPlan.currentSession.description}</p>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-4">Learning Outcomes</h3>
              <ul className="space-y-2">
                {lessonPlan.currentSession.learningOutcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="mt-1 rounded-full border p-0.5">
                      <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Lesson Objectives</h3>
              <ul className="space-y-2">
                {lessonPlan.currentSession.lessonObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="mt-1 rounded-full border p-0.5">
                      <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Lesson Plan</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Duration</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead className="w-64">Materials</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPlan.currentSession.plan.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <h4 className="font-medium">{item.activities.title}</h4>
                          <p className="text-gray-600">{item.activities.description}</p>
                          {item.activities.details && (
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {item.activities.details.map((detail, i) => (
                                <li key={i}>{detail}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {item.materials.map((material, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span>{material.title}</span>
                              <Button size="sm" variant="outline" className="text-pink-500">
                                Generate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-8">
        <Button variant="default" className="bg-pink-500 hover:bg-pink-600 text-white">
          Save
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Reflection</h3>
        <Textarea
          placeholder="Enter your insights"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={6}
        />
        <Button variant="default" className="bg-pink-500 hover:bg-pink-600 text-white">
          Save
        </Button>
      </div>
    </div>
  )
}

