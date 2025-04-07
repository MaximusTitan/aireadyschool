export interface LessonPlanFormData {
  subject: string;
  grade: string;
  chapterTopic: string;
  country: string;
  board: string;
  classDuration: string;
  numberOfDays: string;
  learningObjectives?: string;
}

export interface LessonPlanResponse {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  country: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives?: string;
  plan_data: any; // You can define a more specific type for plan_data if needed
  created_at: string;
}

export interface ScheduleItem {
  type: string;
  title: string;
  content: string;
  timeAllocation: number;
}

export interface HomeworkAssignment {
  description: string;
  tasks: string[];
  document_id?: string | null; // Add this line
}

export interface Day {
  day: number;
  topicHeading: string;
  learningOutcomes: string[];
  schedule: ScheduleItem[];
  teachingAids: string[];
  assignment: HomeworkAssignment;
}

export interface Assessment {
  topic: string;
  type: string;
  description: string;
  evaluationCriteria: string[];
}

export interface AssessmentPlan {
  formativeAssessments: Assessment[];
  summativeAssessments: Assessment[];
  progressTrackingSuggestions: string[];
}

export interface LessonPlan {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives: string;
  plan_data: {
    days: Day[];
    assessmentPlan: AssessmentPlan;
  };
}

export interface EditContentState {
  isOpen: boolean;
  type: string;
  data: any;
  dayIndex?: number;
}

export interface GeneratedNotes {
  [key: string]: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface TeacherAssignment {
  grade_id: string;
  section_id: string;
  grade_name: string;
  section_name: string;
}

export interface Student {
  id: string;
  email: string;
  grade_id: string;
  section_id: string;
}

export interface AssignLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan: LessonPlan;
  onAssign: (
    assignType: string,
    selectedValue: string,
    dueDate: Date
  ) => Promise<void>;
}