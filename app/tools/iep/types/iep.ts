export interface IEPData {
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
}
