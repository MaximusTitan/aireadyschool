"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { useAuth } from "@/hooks/use-auth" // Import the existing auth hook

const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Literature",
    "Art",
    "Music",
    "Physical Education",
  ]
  
  const sections = ["A", "B", "C", "D", "E", "F"]
  
  export default function CreateLessonPlan() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const { email: userEmail, loading: isAuthChecking } = useAuth()
    const [redirectAttempted, setRedirectAttempted] = useState(false)
    
    // Prevent automatic redirects during initial auth check
    useEffect(() => {
      // Only consider redirecting if:
      // 1. We're not already loading
      // 2. Auth check is complete
      // 3. We haven't already attempted to redirect
      if (!isAuthChecking && !userEmail && !redirectAttempted) {
        console.log("Auth state:", { userEmail, isAuthChecking, redirectAttempted });
        
        // Set a flag to prevent multiple redirect attempts
        setRedirectAttempted(true);
        
        // Add a delay to ensure we're not in a temporary auth state
        const timer = setTimeout(() => {
          // Double-check auth state after delay
          if (!userEmail) {
            console.log("No user found after delay, redirecting");
            toast.error("Please log in to create a lesson plan");
            router.push("/sign-in");
          }
        }, 1500); // 1.5 second delay
        
        return () => clearTimeout(timer);
      }
    }, [userEmail, isAuthChecking, redirectAttempted, router]);
    
    // Show loading state when checking auth
    if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      )
    }
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      
      if (!userEmail) {
        toast.error("Please log in to create a lesson plan")
        router.push("/sign-in") // Use sign-in instead of login
        return
      }
      
      setIsLoading(true)
  
      try {
        const formData = new FormData(event.currentTarget)
        const lessonPlan = await generateLessonPlan(formData, userEmail)
  
        if (!lessonPlan || !lessonPlan.plan_data) {
          throw new Error("Received empty or invalid lesson plan")
        }
  
        router.push(`/tools/lesson-planner/output?id=${lessonPlan.id}`)
      } catch (error) {
        console.error("Error generating lesson plan:", error)
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        toast.error(`Failed to generate lesson plan: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }
  
    return (
      <div className="min-h-screen bg-backgroundApp">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" className="mb-6" onClick={() => router.push("/tools/lesson-planner")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
  
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Lesson Plan</h1>
            <p className="text-gray-600">
              Creates structured and optimized lesson plans for educators based on the subject, topic, grade, lesson
              objectives and duration provided.
            </p>
          </div>
  
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select name="subject" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject.toLowerCase()}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select name="grade" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade" />
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
                    <Label htmlFor="board">Board</Label>
                    <Select name="board" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"].map((board) => (
                          <SelectItem key={board} value={board}>
                            {board}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="chapterTopic">Lesson Title</Label>
                  <Input id="chapterTopic" name="chapterTopic" placeholder="Enter the title of your lesson" required />
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="classDuration">Session Duration (Minutes)</Label>
                    <Input
                      id="classDuration"
                      name="classDuration"
                      type="number"
                      min="1"
                      placeholder="Enter duration"
                      required
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="numberOfDays">Number of Sessions</Label>
                    <Input
                      id="numberOfDays"
                      name="numberOfDays"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Enter number of sessions"
                      required
                    />
                  </div>
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="lessonObjectives">Lesson Objectives</Label>
                  <Textarea
                    id="lessonObjectives"
                    name="lessonObjectives"
                    placeholder="What are the main objectives of this lesson?"
                    rows={3}
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="learningObjectives">Learning Outcomes</Label>
                  <Textarea
                    id="learningObjectives"
                    name="learningObjectives"
                    placeholder="What should students be able to do after this lesson?"
                    rows={3}
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                  <Textarea
                    id="additionalInstructions"
                    name="additionalInstructions"
                    placeholder="Any specific instructions or notes for this lesson plan?"
                    rows={3}
                  />
                </div>
  
                <div className="flex justify-center mt-6">
                  <Button 
                    type="submit" 
                    className="bg-rose-600 hover:bg-rose-700 text-white px-10" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Generating..." : "Generate Lesson Plan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

