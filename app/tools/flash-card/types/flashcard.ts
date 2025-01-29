export type FlashcardType = "basic" | "fill-in-blank" | "multiple-choice"

export interface Flashcard {
  id: string
  question: string
  answer: string
  type: FlashcardType
  options?: string[] // For multiple choice questions
  created_at: Date
}

