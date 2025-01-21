export interface PLPData {
  studentInformation: {
    name: string;
    grade: string;
    country: string;
    board: string;
  };
  presentLevelsOfPerformance: {
    academic: string;
    social: string;
    behavioral: string;
  };
  annualGoals: Array<{
    goal: string;
    objectives: string[];
  }>;
  specialEducationServices: Array<{
    service: string;
    frequency: string;
  }>;
  accommodationsAndModifications: string[];
  assessmentInformation: {
    methods: string[];
    schedule: string;
  };
  progressMonitoringPlan: {
    methods: string[];
    frequency: string;
  };
  personalContext: {
    disabilities: string[];
    additionalNotes: string;
  };
  subjectSpecificInformation: {
    general: {
      age: string; // Changed from string to match form input
      grade: string; // Retained grade
      gender: string;
      nationality: string;
      board: string; // Retained board
    };
    cognitiveParameters: {
      comprehension?: number;
      understandsInstructions?: number;
      graspsNewConcepts?: number;
      retainsInformation?: number;
      attention?: number;
      focusDuration?: number;
      taskCompletion?: number;
      followsRoutines?: number;
      participation?: number;
      classEngagement?: number;
      asksQuestions?: number;
      groupWork?: number;
    };
    knowledgeParameters: {
      mathematics?: {
        score: number;
        numberSense: number;
        problemSolving: number;
        mathematicalReasoning: number;
        calculationAccuracy: number;
        geometrySkills: number;
      };
      science?: {
        score: number;
        scientificInquiry: number;
        experimentalSkills: number;
        dataInterpretation: number;
        scientificConcepts: number;
        labWork: number;
      };
      languages?: {
        score: number;
        readingComprehension: number;
        writingSkills: number;
        grammarUsage: number;
        vocabulary: number;
        verbalExpression: number;
      };
      socialStudies?: {
        score: number;
        historicalUnderstanding: number;
        geographicAwareness: number;
        culturalComprehension: number;
        currentEventsKnowledge: number;
        analysisOfSocialIssues: number;
      };
      artCreativeSkills?: {
        score: number;
        creativeExpression: number;
        technicalSkills: number;
        visualUnderstanding: number;
        designThinking: number;
      };
    };
    topic: string;
    otherInformation: string;
    goal: string;
  };
}
