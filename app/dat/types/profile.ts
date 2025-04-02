export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  parent_name: string;
  grade: string;
  photo?: string;
  area: string;
  city: string;
  school_name?: string;
}

export interface SchoolProfile {
  id: string;
  contact_name: string;
  designation: string;
  email: string;
  phone: string;
  school_name: string;
  website_address: string;
  education_board: string;
  computers: number;
  total_children: number;
  area: string;
  city: string;
}
