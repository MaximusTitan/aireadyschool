export interface StudyPlanInput {
    country: string
    board: string
    grade: string
    subject: string
    difficulties: string
    purpose: string
    days: string
  }
  
  export interface StudyPlanResponse {
    success: boolean
    error?: string
    content?: string
  }
  
  