import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AssignedAssessment = {
  id: string
  assessment_id: number
  teacher_id: string | null
  grade_id: string | null
  section_id: string | null
  student_id: string | null
  assigned_at: string
  due_date: string | null
  completed: boolean
  student_answers: any | null
  score: number | null
  evaluation: any | null
  lesson_plan: any | null
  student_email: string | null
  test_name: string | null // Add this field
}

export type StudentWithAssessments = {
  email: string
  name: string
  assessments: AssignedAssessment[]
}

