import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AssessmentEvaluation, ProcessedAssessment, StudentData } from "./types"
import type { AssignedAssessment } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function processAssessmentData(assessment: AssignedAssessment): ProcessedAssessment | null {
  if (!assessment.evaluation) return null

  try {
    const evaluation: AssessmentEvaluation =
      typeof assessment.evaluation === "string" ? JSON.parse(assessment.evaluation) : assessment.evaluation

    // Extract basic metrics
    const overallScore = evaluation.PERFORMANCE_METRICS.overallScore / 100
    const correctAnswers = evaluation.PERFORMANCE_METRICS.correctAnswers
    const incorrectAnswers = evaluation.PERFORMANCE_METRICS.incorrectAnswers
    const totalQuestions = correctAnswers + incorrectAnswers
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0

    // Calculate average confidence across topics
    const confidenceSum = evaluation.TOPIC_ANALYSIS.mainTopics.reduce((sum, topic) => sum + topic.confidenceLevel, 0)
    const confidenceLevel =
      evaluation.TOPIC_ANALYSIS.mainTopics.length > 0
        ? confidenceSum / (evaluation.TOPIC_ANALYSIS.mainTopics.length * 100)
        : 0

    // Extract topic data
    const topics = evaluation.TOPIC_ANALYSIS.mainTopics.map((topic) => ({
      name: topic.name,
      score: topic.topicScore / 100,
      confidence: topic.confidenceLevel / 100,
    }))

    return {
      id: assessment.id,
      date: evaluation.STUDENT_METADATA.dateOfAssessment,
      overallScore,
      accuracy,
      correctAnswers,
      totalQuestions,
      confidenceLevel,
      topics,
      knowledgeGaps: evaluation.CONCEPT_UNDERSTANDING.knowledgeGaps,
      strengthAreas: evaluation.CONCEPT_UNDERSTANDING.strengthAreas,
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
    ...baselineAssessment.knowledgeGaps.slice(0, 3).map((gap) => ({
      topic: topics.find((t) => t.name.includes(gap.split(" ")[0]))?.name || "General",
      question: `Understanding of ${gap}`,
      type: "Short Answer" as const,
      baselineScore: 0.3,
      finalScore: 0.6,
    })),
    // Create responses from strength areas
    ...baselineAssessment.strengthAreas.slice(0, 3).map((strength) => ({
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

