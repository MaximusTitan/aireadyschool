import { z } from "zod"

// Schema for topic comparison data
export const topicComparisonSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().describe("The name of the main topic"),
      baselineScore: z.number().describe("The score for this topic in the baseline assessment (0-100)"),
      finalScore: z.number().describe("The score for this topic in the final assessment (0-100)"),
      improvement: z.number().describe("The percentage improvement between baseline and final (can be negative)"),
      keyInsights: z.array(z.string()).describe("Key insights about improvement or decline in this topic"),
    }),
  ),
  overallInsights: z.array(z.string()).describe("Overall insights about the student's progress across topics"),
  recommendedFocusAreas: z.array(z.string()).describe("Areas where the student should focus for further improvement"),
  strengthAreas: z.array(z.string()).describe("Areas where the student shows strong understanding or improvement"),
})

// Schema for skill development data
export const skillDevelopmentSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().describe("The name of the skill or concept"),
      baselineLevel: z.number().describe("The proficiency level in the baseline assessment (0-100)"),
      finalLevel: z.number().describe("The proficiency level in the final assessment (0-100)"),
      growthPercentage: z.number().describe("The percentage growth in this skill"),
      category: z
        .string()
        .describe('The category this skill belongs to (e.g., "Knowledge", "Application", "Analysis")'),
    }),
  ),
  skillCategories: z.array(
    z.object({
      name: z.string().describe("The name of the skill category"),
      averageGrowth: z.number().describe("The average growth percentage across all skills in this category"),
      skills: z.array(z.string()).describe("The names of skills in this category"),
    }),
  ),
  insights: z.array(z.string()).describe("Insights about skill development patterns"),
})

// Schema for learning patterns data
export const learningPatternsSchema = z.object({
  confidenceMetrics: z.object({
    baselineConfidence: z.number().describe("Overall confidence level in baseline assessment (0-100)"),
    finalConfidence: z.number().describe("Overall confidence level in final assessment (0-100)"),
    confidenceGrowth: z.number().describe("Percentage growth in confidence"),
    accuracyToConfidenceRatio: z.number().describe("Ratio of actual performance to confidence level"),
  }),
  learningStyle: z.object({
    dominantStyle: z.string().describe("The student's dominant learning style based on assessment data"),
    recommendedApproaches: z.array(z.string()).describe("Teaching approaches that might work well for this student"),
    challengeAreas: z.array(z.string()).describe("Areas where the student faces learning challenges"),
    strengths: z.array(z.string()).describe("The student's learning strengths"),
  }),
  progressionInsights: z.array(z.string()).describe("Insights about how the student progresses in learning"),
})

// Combined schema for all AI analysis
export const aiAnalysisSchema = z.object({
  studentName: z.string().describe("The name of the student"),
  overallImprovement: z.number().describe("The overall percentage improvement between baseline and final assessments"),
  topicComparison: topicComparisonSchema,
  skillDevelopment: skillDevelopmentSchema,
  learningPatterns: learningPatternsSchema,
  recommendedInterventions: z
    .array(z.string())
    .describe("Recommended interventions or teaching strategies based on the analysis"),
  keyTakeaways: z.array(z.string()).describe("Key takeaways from comparing the baseline and final assessments"),
})

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>
export type TopicComparison = z.infer<typeof topicComparisonSchema>
export type SkillDevelopment = z.infer<typeof skillDevelopmentSchema>
export type LearningPatterns = z.infer<typeof learningPatternsSchema>

