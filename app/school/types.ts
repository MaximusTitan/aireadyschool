export interface Board {
  id: string;
  name: string;
}

export interface Grade {
  id: string;
  name: string;
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

export interface Teacher {
  id: string;
  auth: {
    email: string;
  };
  assignments: TeacherAssignment[];
}

export interface Student {
  id: string;
  roll_number: string;
  auth: {
    email: string;
  };
  grade: {
    id: string;
    name: string;
    board: {
      id: string;
      name: string;
    };
  };
  section: {
    id: string;
    name: string;
  };
}
