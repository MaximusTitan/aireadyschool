export interface Board {
  id: string;
  name: string;
  grades?: Grade[];
  subjects?: Subject[];
}

export interface Grade {
  id: string;
  name: string;
  sections?: Section[];
  board?: {
    id: string;
    name: string;
  };
}

export interface Section {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  board_id: string;
}

export interface TeacherAssignment {
  id: string;
  board: {
    id: string;
    name: string;
  };
  grade: {
    name: string;
  };
  section: {
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
}

export interface TeacherData {
  teacher: {
    id: string;
    user_id: string;
  };
  subject: {
    id: string;
    name: string;
  };
}

export interface Teacher {
  id: string;
  auth: {
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    board_id: string;
  };
  assignments?: TeacherAssignment[];
}

export interface Student {
  id: string;
  auth: {
    email: string;
  };
  roll_number?: string;
  grade?: Grade;
  section?: Section;
}
