export interface AssessmentData {
    overallScore: number
    accuracy: number
    completionTime: number
    confidence: number
    mcqCorrect: number
    mcqTotal: number
    shortAnswerScore: number
}

export interface TopicData {
    name: string
    baselineScore: number
    finalScore: number
}

export interface TopicAnalysis {
    mainTopics: MainTopic[]
}

export interface MainTopic {
    name: string
    subtopics: string[]
    topicScore: number
    masteryLevel: string
    confidenceLevel: number
    subtopicPerformance: SubtopicPerformance[]
    weakUnderstandingTopics: string[]
    strongUnderstandingTopics: string[]
}

export interface SubtopicPerformance {
    name: string
    score: number
    mistakePatterns: string[]
    confidenceRating: number
    difficultyRating: number
    questionsCorrect: number
    questionsAttempted: number
    averageResponseTime: number
}

export interface StudentMetadata {
    board: string
    grade: string
    studentId: string
    assessmentId: string
    evaluationType: string
    dateOfAssessment: string
}

export interface PerformanceMetrics {
    percentile: number
    overallScore: number
    correctAnswers: number
    incorrectAnswers: number
    performanceRating: string
    accuracyByDifficulty: {
      easy: number
      medium: number
      hard: number
    }
    attemptsDistribution: {
      easyQuestions: number
      mediumQuestions: number
      hardQuestions: number
    }
}

export interface ConceptUnderstanding {
    knowledgeGaps: string[]
    strengthAreas: string[]
    conceptHierarchy: ConceptHierarchy[]
    recommendedFocusAreas: string[]
    conceptUnderstandingLevels: any
}

export interface ConceptHierarchy {
    primaryConcept: string
    relatedConcepts: string[]
    understandingScore: number
}

export interface LearningStyleIndicators {
    learningPaceMetrics: {
      challengeAreas: string[]
      fastLearningAreas: string[]
    }
    preferredQuestionTypes: string[]
}

export interface AssessmentEvaluation {
    TOPIC_ANALYSIS: TopicAnalysis
    STUDENT_METADATA: StudentMetadata
    PERFORMANCE_METRICS: PerformanceMetrics
    CONCEPT_UNDERSTANDING: ConceptUnderstanding
    LEARNING_STYLE_INDICATORS: LearningStyleIndicators
}

export interface ProcessedAssessment {
    id: string
    date: string
    overallScore: number
    accuracy: number
    correctAnswers: number
    totalQuestions: number
    confidenceLevel: number
    topics: {
      name: string
      score: number
      confidence: number
    }[]
    knowledgeGaps: string[]
    strengthAreas: string[]
}

export interface StudentData {
    id: string
    name: string
    email: string
    baseline: ProcessedAssessment
    final: ProcessedAssessment
    overallImprovement: number
    topics: {
      name: string
      baselineScore: number
      finalScore: number
    }[]
    detailedResponses: DetailedResponse[]
}

export interface DetailedResponse {
    topic: string
    question: string
    type: "MCQ" | "Short Answer"
    baselineCorrect?: boolean
    finalCorrect?: boolean
    baselineScore?: number
    finalScore?: number
}

