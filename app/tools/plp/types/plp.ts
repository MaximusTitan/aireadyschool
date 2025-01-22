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
      age: string;
      grade: string;
      gender: string;
      nationality: string;
      board: string;
    };
    cognitiveParameters: {
      [key: string]: number | undefined; // Allow dynamic cognitive parameters
    };
    knowledgeParameters: {
      [key: string]: {
        [key: string]: number;
      };
    };
    topic: string;
    otherInformation: string;
    goal: string;
  };
}
