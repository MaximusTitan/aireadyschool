import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AssessmentEvaluation, ProcessedAssessment, StudentData } from "./types"
import type { AssignedAssessment } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

export function processAssessmentData(assessment: AssignedAssessment): ProcessedAssessment | null {
  if (!assessment || !assessment.evaluation) return null

  try {
    const evaluation: AssessmentEvaluation =
      typeof assessment.evaluation === "string" ? JSON.parse(assessment.evaluation) : assessment.evaluation

    // Check if required properties exist
    if (!evaluation.PERFORMANCE_METRICS || !evaluation.TOPIC_ANALYSIS) {
      console.error("Missing required properties in evaluation data")
      return null
    }

    // Extract basic metrics with fallbacks
    const overallScore = (evaluation.PERFORMANCE_METRICS.overallScore || 0) / 100
    const correctAnswers = evaluation.PERFORMANCE_METRICS.correctAnswers || 0
    const incorrectAnswers = evaluation.PERFORMANCE_METRICS.incorrectAnswers || 0
    const totalQuestions = correctAnswers + incorrectAnswers
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0

    // Safely access mainTopics with fallback
    const mainTopics = evaluation.TOPIC_ANALYSIS.mainTopics || []

    // Calculate average confidence across topics
    const confidenceSum = mainTopics.reduce((sum, topic) => sum + (topic.confidenceLevel || 0), 0)
    const confidenceLevel = mainTopics.length > 0 ? confidenceSum / (mainTopics.length * 100) : 0

    // Extract topic data
    const topics = mainTopics.map((topic) => ({
      name: topic.name || "Unknown Topic",
      score: (topic.topicScore || 0) / 100,
      confidence: (topic.confidenceLevel || 0) / 100,
    }))

    // Safely access knowledge gaps and strength areas with fallbacks
    const knowledgeGaps = evaluation.CONCEPT_UNDERSTANDING?.knowledgeGaps || []
    const strengthAreas = evaluation.CONCEPT_UNDERSTANDING?.strengthAreas || []

    return {
      id: assessment.id,
      date: evaluation.STUDENT_METADATA?.dateOfAssessment || assessment.assigned_at,
      overallScore,
      accuracy,
      correctAnswers,
      totalQuestions,
      confidenceLevel,
      topics,
      knowledgeGaps,
      strengthAreas,
    }
  } catch (error) {
    console.error("Error processing assessment data:", error)
    return null
  }
}

export function compareAssessments(
  baselineAssessment: ProcessedAssessment,
  finalAssessment: ProcessedAssessment,
): StudentData {
  // Calculate overall improvement
  const overallImprovement = finalAssessment.overallScore - baselineAssessment.overallScore

  // Combine topics from both assessments
  const allTopicNames = new Set([
    ...baselineAssessment.topics.map((t) => t.name),
    ...finalAssessment.topics.map((t) => t.name),
  ])

  // Create topic comparison data
  const topics = Array.from(allTopicNames).map((topicName) => {
    const baselineTopic = baselineAssessment.topics.find((t) => t.name === topicName)
    const finalTopic = finalAssessment.topics.find((t) => t.name === topicName)

    return {
      name: topicName,
      baselineScore: baselineTopic?.score || 0,
      finalScore: finalTopic?.score || 0,
    }
  })

  // Define the DetailedResponse type
  interface DetailedResponse {
    topic: string
    question: string
    type: "Short Answer" | "MCQ"
    baselineScore?: number
    finalScore?: number
    baselineCorrect?: boolean
    finalCorrect?: boolean
  }

  // Create mock detailed responses based on knowledge gaps and strength areas
  const detailedResponses: DetailedResponse[] = [
    // Create responses from knowledge gaps
    ...(baselineAssessment.knowledgeGaps || []).slice(0, 3).map((gap) => ({
      topic: topics.find((t) => t.name.includes(gap.split(" ")[0]))?.name || "General",
      question: `Understanding of ${gap}`,
      type: "Short Answer" as const,
      baselineScore: 0.3,
      finalScore: 0.6,
    })),
    // Create responses from strength areas
    ...(baselineAssessment.strengthAreas || []).slice(0, 3).map((strength) => ({
      topic: topics.find((t) => t.name.includes(strength.split(" ")[0]))?.name || "General",
      question: `Application of ${strength}`,
      type: "MCQ" as const,
      baselineCorrect: true,
      finalCorrect: true,
    })),
  ]

  return {
    id: finalAssessment.id,
    name: "Student", // This will be replaced with actual name
    email: "", // This will be replaced with actual email
    baseline: baselineAssessment,
    final: finalAssessment,
    overallImprovement,
    topics,
    detailedResponses,
  }
}

