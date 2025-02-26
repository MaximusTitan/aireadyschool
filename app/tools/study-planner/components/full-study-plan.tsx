"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "./loading-spinner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { PdfDownloadButton } from "./pdf-download-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const supabase = createClient()

interface StudyPlanDay {
  day: number
  focusAreas: { topic: string; objective: string }[]
  activities: { action: string; suggestion: string }[]
}

interface FullStudyPlan {
  id: string
  grade: string
  board: string
  subject: string
  syllabus: string
  learning_goal: string
  areas_of_improvement: string
  available_days: number
  available_study_time: number
  Day: string
  "Focus Areas": string
  Activities: string
  created_at: string
}

interface FullStudyPlanProps {
  planId: string
  onClose: () => void
}

export function FullStudyPlan({ planId, onClose }: FullStudyPlanProps) {
  const [studyPlan, setStudyPlan] = useState<FullStudyPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [days, setDays] = useState<StudyPlanDay[]>([])

  const addNewDay = () => {
    const newDay: StudyPlanDay = {
      day: days.length + 1,
      focusAreas: [{ topic: "", objective: "" }],
      activities: [{ action: "", suggestion: "" }],
    }
    setDays([...days, newDay])
  }

  const addNewFocusArea = (dayIndex: number) => {
    const newDays = [...days]
    newDays[dayIndex].focusAreas.push({ topic: "", objective: "" })
    setDays(newDays)
  }

  const addNewActivity = (dayIndex: number) => {
    const newDays = [...days]
    newDays[dayIndex].activities.push({ action: "", suggestion: "" })
    setDays(newDays)
  }

  const fetchStudyPlan = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("study_plans").select("*").eq("id", planId).single()
      if (error) throw error

      setStudyPlan(data)
      setDays(
        JSON.parse(data.Day).map((day: number, index: number) => ({
          day,
          focusAreas: JSON.parse(data["Focus Areas"])[index],
          activities: JSON.parse(data.Activities)[index],
        })),
      )
    } catch (err: any) {
      console.error("Error fetching study plan:", err)
      setError(`An error occurred while fetching the study plan: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [planId])

  useEffect(() => {
    fetchStudyPlan()
  }, [fetchStudyPlan])

  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      if (!studyPlan) return

      const updatedStudyPlan = {
        ...studyPlan,
        Day: JSON.stringify(days.map((d) => d.day)),
        "Focus Areas": JSON.stringify(days.map((d) => d.focusAreas)),
        Activities: JSON.stringify(days.map((d) => d.activities)),
      }

      const { error } = await supabase.from("study_plans").update(updatedStudyPlan).eq("id", planId)
      if (error) throw error
      setIsEditing(false)
      setStudyPlan(updatedStudyPlan)
    } catch (err: any) {
      console.error("Error updating study plan:", err)
      setError(`An error occurred while updating the study plan: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDayChange = (index: number, value: number) => {
    const newDays = [...days]
    newDays[index].day = value
    setDays(newDays)
  }

  const handleFocusAreaChange = (dayIndex: number, areaIndex: number, field: "topic" | "objective", value: string) => {
    const newDays = [...days]
    newDays[dayIndex].focusAreas[areaIndex][field] = value
    setDays(newDays)
  }

  const handleActivityChange = (
    dayIndex: number,
    activityIndex: number,
    field: "action" | "suggestion",
    value: string,
  ) => {
    const newDays = [...days]
    newDays[dayIndex].activities[activityIndex][field] = value
    setDays(newDays)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!studyPlan) {
    return (
      <Alert>
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>The requested study plan could not be found.</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Full Study Plan: {studyPlan.subject}</span>
            <div>
              {isEditing ? (
                <Button onClick={handleUpdate} className="mr-2">
                  Save
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="mr-2">
                  Edit
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Plan Overview</h3>
                {isEditing ? (
                  <>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={studyPlan?.subject}
                      onChange={(e) => setStudyPlan({ ...studyPlan, subject: e.target.value })}
                    />
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      value={studyPlan?.grade}
                      onChange={(e) => setStudyPlan({ ...studyPlan, grade: e.target.value })}
                    />
                    <Label htmlFor="board">Board</Label>
                    <Input
                      id="board"
                      value={studyPlan?.board}
                      onChange={(e) => setStudyPlan({ ...studyPlan, board: e.target.value })}
                    />
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Subject:</strong> {studyPlan?.subject}
                    </p>
                    <p>
                      <strong>Grade:</strong> {studyPlan?.grade}
                    </p>
                    <p>
                      <strong>Board:</strong> {studyPlan?.board}
                    </p>
                  </>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Study Details</h3>
                {isEditing ? (
                  <>
                    <Label htmlFor="available_days">Duration (days)</Label>
                    <Input
                      id="available_days"
                      type="number"
                      value={studyPlan?.available_days}
                      onChange={(e) =>
                        setStudyPlan({
                          ...studyPlan,
                          available_days: Number.parseInt(e.target.value),
                        })
                      }
                    />
                    <Label htmlFor="available_study_time">Daily Study Time (hours)</Label>
                    <Input
                      id="available_study_time"
                      type="number"
                      value={studyPlan?.available_study_time}
                      onChange={(e) =>
                        setStudyPlan({
                          ...studyPlan,
                          available_study_time: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Duration:</strong> {studyPlan?.available_days} days
                    </p>
                    <p>
                      <strong>Daily Study Time:</strong> {studyPlan?.available_study_time} hours
                    </p>
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Learning Goal</h3>
              {isEditing ? (
                <Textarea
                  value={studyPlan?.learning_goal}
                  onChange={(e) => setStudyPlan({ ...studyPlan, learning_goal: e.target.value })}
                />
              ) : (
                <p>{studyPlan?.learning_goal}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Areas of Improvement</h3>
              {isEditing ? (
                <Textarea
                  value={studyPlan?.areas_of_improvement}
                  onChange={(e) => setStudyPlan({ ...studyPlan, areas_of_improvement: e.target.value })}
                />
              ) : (
                <p>{studyPlan?.areas_of_improvement}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Syllabus</h3>
              {isEditing ? (
                <Textarea
                  value={studyPlan?.syllabus}
                  onChange={(e) => setStudyPlan({ ...studyPlan, syllabus: e.target.value })}
                />
              ) : (
                <p>{studyPlan?.syllabus}</p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Day</th>
                    <th className="border border-gray-300 px-4 py-2">Focus Areas</th>
                    <th className="border border-gray-300 px-4 py-2">Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, dayIndex) => (
                    <tr key={dayIndex}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={day.day}
                            onChange={(e) => handleDayChange(dayIndex, Number.parseInt(e.target.value))}
                            className="w-16"
                          />
                        ) : (
                          day.day
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <ul className="list-disc pl-5">
                          {day.focusAreas.map((area, areaIndex) => (
                            <li key={areaIndex}>
                              {isEditing ? (
                                <>
                                  <Input
                                    value={area.topic}
                                    onChange={(e) =>
                                      handleFocusAreaChange(dayIndex, areaIndex, "topic", e.target.value)
                                    }
                                    className="mb-1"
                                    placeholder="Topic"
                                  />
                                  <Input
                                    value={area.objective}
                                    onChange={(e) =>
                                      handleFocusAreaChange(dayIndex, areaIndex, "objective", e.target.value)
                                    }
                                    placeholder="Objective"
                                  />
                                </>
                              ) : (
                                <>
                                  <strong>{area.topic}:</strong> {area.objective}
                                </>
                              )}
                            </li>
                          ))}
                          {isEditing && (
                            <li>
                              <Button onClick={() => addNewFocusArea(dayIndex)} size="sm" variant="outline">
                                Add Focus Area
                              </Button>
                            </li>
                          )}
                        </ul>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <ul className="list-disc pl-5">
                          {day.activities.map((activity, activityIndex) => (
                            <li key={activityIndex}>
                              {isEditing ? (
                                <>
                                  <Input
                                    value={activity.action}
                                    onChange={(e) =>
                                      handleActivityChange(dayIndex, activityIndex, "action", e.target.value)
                                    }
                                    className="mb-1"
                                    placeholder="Action"
                                  />
                                  <Input
                                    value={activity.suggestion}
                                    onChange={(e) =>
                                      handleActivityChange(dayIndex, activityIndex, "suggestion", e.target.value)
                                    }
                                    placeholder="Suggestion"
                                  />
                                </>
                              ) : (
                                <>
                                  <strong>{activity.action}:</strong> {activity.suggestion}
                                </>
                              )}
                            </li>
                          ))}
                          {isEditing && (
                            <li>
                              <Button onClick={() => addNewActivity(dayIndex)} size="sm" variant="outline">
                                Add Activity
                              </Button>
                            </li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditing && (
                <div className="mt-4">
                  <Button onClick={addNewDay} variant="outline">
                    Add New Day
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <PdfDownloadButton plan={studyPlan} />
    </>
  )
}
