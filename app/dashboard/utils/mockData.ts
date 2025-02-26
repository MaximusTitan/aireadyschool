export interface School {
  id: string;
  site_id: string;
  name: string;
  address?: string;
}

export interface Board {
  id: string;
  school_id: string;
  name: string;
}

export interface Grade {
  id: string;
  board_id: string;
  name: string;
}

export interface Section {
  id: string;
  grade_id: string;
  name: string;
}

export interface Subject {
  id: string;
  board_id: string;
  name: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  name: string; // Added for convenience
}

export interface Student {
  id: string;
  user_id: string;
  school_id: string;
  grade_id: string;
  section_id: string;
  roll_number: string;
  name: string; // Added for convenience
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  board_id: string;
  grade_id: string;
  section_id: string;
  subject_id: string;
}
