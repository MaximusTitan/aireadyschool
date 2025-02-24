"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/app/tools/lesson-planner/lib/supabase"
import { toast } from "sonner"

interface EditLessonContentProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  content: {
    type: string
    data: any
    dayIndex?: number
  }
  lessonPlanId: string
}

export function EditLessonContent({ isOpen, onClose, onSave, content, lessonPlanId }: EditLessonContentProps) {
  const [formData, setFormData] = useState(content.data)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: currentData } = await supabase
        .from("lesson_plans")
        .select("plan_data")
        .eq("id", lessonPlanId)
        .single()

      if (!currentData) throw new Error("Lesson plan not found")

      const updatedPlanData = { ...currentData.plan_data }

      // Update the specific section based on content type
      switch (content.type) {
        case "learningOutcomes":
          updatedPlanData.days[content.dayIndex!].learningOutcomes = formData
          break
        case "schedule":
          updatedPlanData.days[content.dayIndex!].schedule = formData
          break
        case "teachingAids":
          updatedPlanData.days[content.dayIndex!].teachingAids = formData
          break
        case "assignment":
          updatedPlanData.days[content.dayIndex!].assignment = formData
          break
        case "assessmentPlan":
          updatedPlanData.assessmentPlan = formData
          break
      }

      const { error } = await supabase
        .from("lesson_plans")
        .update({ plan_data: updatedPlanData })
        .eq("id", lessonPlanId)

      if (error) throw error

      toast.success("Changes saved successfully")
      onSave()
    } catch (error) {
      console.error("Error saving changes:", error)
      toast.error("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  const renderEditForm = () => {
    switch (content.type) {
      case "learningOutcomes":
        return (
          <div className="space-y-4">
            {formData.map((outcome: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => {
                    const newOutcomes = [...formData]
                    newOutcomes[index] = e.target.value
                    setFormData(newOutcomes)
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFormData(formData.filter((_: any, i: number) => i !== index))
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setFormData([...formData, ""])
              }}
            >
              Add Outcome
            </Button>
          </div>
        )

      case "schedule":
        return (
          <div className="space-y-4">
            {formData.map((item: any, index: number) => (
              <div key={index} className="space-y-2 border p-4 rounded-lg">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Title</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const newSchedule = [...formData]
                        newSchedule[index] = { ...item, title: e.target.value }
                        setFormData(newSchedule)
                      }}
                    />
                  </div>
                  <div className="w-24">
                    <Label>Time (min)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.timeAllocation}
                      onChange={(e) => {
                        const newSchedule = [...formData]
                        newSchedule[index] = { ...item, timeAllocation: Number.parseInt(e.target.value) }
                        setFormData(newSchedule)
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={item.content}
                    onChange={(e) => {
                      const newSchedule = [...formData]
                      newSchedule[index] = { ...item, content: e.target.value }
                      setFormData(newSchedule)
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(formData.filter((_: any, i: number) => i !== index))
                  }}
                >
                  Remove Item
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setFormData([
                  ...formData,
                  {
                    type: "activity",
                    title: "",
                    content: "",
                    timeAllocation: 15,
                  },
                ])
              }}
            >
              Add Schedule Item
            </Button>
          </div>
        )

      case "teachingAids":
        return (
          <div className="space-y-4">
            {formData.map((aid: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={aid}
                  onChange={(e) => {
                    const newAids = [...formData]
                    newAids[index] = e.target.value
                    setFormData(newAids)
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFormData(formData.filter((_: any, i: number) => i !== index))
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setFormData([...formData, ""])
              }}
            >
              Add Teaching Aid
            </Button>
          </div>
        )

      case "assignment":
        return (
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Tasks</Label>
              {formData.tasks.map((task: string, index: number) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={task}
                    onChange={(e) => {
                      const newTasks = [...formData.tasks]
                      newTasks[index] = e.target.value
                      setFormData({ ...formData, tasks: newTasks })
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newTasks = formData.tasks.filter((_: any, i: number) => i !== index)
                      setFormData({ ...formData, tasks: newTasks })
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setFormData({ ...formData, tasks: [...formData.tasks, ""] })
                }}
              >
                Add Task
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {content.type.replace(/([A-Z])/g, " $1").toLowerCase()}</DialogTitle>
          <DialogDescription>Make changes to the content below.</DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderEditForm()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
