"use server"

import { supabase, type AssignedAssessment, type StudentWithAssessments } from "./lib/supabase"
import { compareAssessments, processAssessmentData } from "./lib/utils"
import type { StudentData } from "./lib/types"

// Update the getStudentsWithMultipleAssessments function to check for both baseline and final assessments
export async function getStudentsWithMultipleAssessments(): Promise<StudentWithAssessments[]> {
  try {
    // Get all completed assessments
    const { data: assessments, error } = await supabase
      .from("assigned_assessments")
      .select("*")
      .eq("completed", true)
      .order("assigned_at", { ascending: false })

    if (error) throw error
    if (!assessments) return []

    // Group assessments by student email
    const studentAssessments: Record<string, AssignedAssessment[]> = {}

    assessments.forEach((assessment: AssignedAssessment) => {
      if (!assessment.student_email) return

      if (!studentAssessments[assessment.student_email]) {
        studentAssessments[assessment.student_email] = []
      }

      studentAssessments[assessment.student_email].push(assessment)
    })

    // Filter students who have both baseline and final assessments
    const studentsWithBothAssessments = Object.entries(studentAssessments)
      .filter(([_, assessments]) => {
        const hasBaseline = assessments.some((a) => a.test_name === "baseline")
        const hasFinal = assessments.some((a) => a.test_name === "final")
        return hasBaseline && hasFinal
      })
      .map(([email, assessments]) => ({
        email,
        name: email.split("@")[0], // Use email prefix as name
        assessments,
      }))

    return studentsWithBothAssessments
  } catch (error) {
    console.error("Error fetching students with multiple assessments:", error)
    return []
  }
}

// Update the getStudentProgressData function to use test_name field and handle undefined values
export async function getStudentProgressData(studentEmail: string): Promise<StudentData | null> {
  try {
    // Get baseline assessment for the student
    const { data: baselineAssessments, error: baselineError } = await supabase
      .from("assigned_assessments")
      .select("*")
      .eq("student_email", studentEmail)
      .eq("completed", true)
      .eq("test_name", "baseline")

    if (baselineError) throw baselineError
    if (!baselineAssessments || baselineAssessments.length === 0) {
      console.log(`No baseline assessment found for student: ${studentEmail}`)
      return null
    }

    // Get final assessment for the student
    const { data: finalAssessments, error: finalError } = await supabase
      .from("assigned_assessments")
      .select("*")
      .eq("student_email", studentEmail)
      .eq("completed", true)
      .eq("test_name", "final")

    if (finalError) throw finalError
    if (!finalAssessments || finalAssessments.length === 0) {
      console.log(`No final assessment found for student: ${studentEmail}`)
      return null
    }

    // Use the most recent assessment of each type if there are multiple
    const baselineAssessment = processAssessmentData(
      baselineAssessments.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0],
    )

    const finalAssessment = processAssessmentData(
      finalAssessments.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0],
    )

    if (!baselineAssessment || !finalAssessment) {
      console.log(`Could not process assessments for student: ${studentEmail}`)
      return null
    }

    // Compare the assessments
    const progressData = compareAssessments(baselineAssessment, finalAssessment)

    // Add student info
    progressData.name = studentEmail.split("@")[0] // Use email prefix as name
    progressData.email = studentEmail

    return progressData
  } catch (error) {
    console.error("Error fetching student progress data:", error)
    return null
  }
}

export async function getAllStudentsProgressData(): Promise<StudentData[]> {
  try {
    const studentsWithMultipleAssessments = await getStudentsWithMultipleAssessments()
    const progressDataPromises = studentsWithMultipleAssessments.map((student) => getStudentProgressData(student.email))

    const progressDataResults = await Promise.all(progressDataPromises)

    // Filter out null results
    return progressDataResults.filter((data): data is StudentData => data !== null)
  } catch (error) {
    console.error("Error fetching all students progress data:", error)
    return []
  }
}

