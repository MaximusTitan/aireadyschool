-- Schools table
create table schools (
    id uuid primary key default uuid_generate_v4(),
    site_id text unique not null,
    name text not null,
    address text,
    contact_info jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create updated_at trigger for schools
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_schools_updated_at
    before update on schools
    for each row
    execute function update_updated_at_column();

-- Boards table
create table boards (
    id uuid primary key default uuid_generate_v4(),
    school_id text not null references schools(site_id),
    name text not null,
    created_at timestamp with time zone default now(),
    unique(school_id, name)
);

-- Grades table
create table grades (
    id uuid primary key default uuid_generate_v4(),
    board_id uuid not null references boards(id),
    name text not null,
    created_at timestamp with time zone default now(),
    unique(board_id, name)
);

-- Sections table
create table sections (
    id uuid primary key default uuid_generate_v4(),
    grade_id uuid not null references grades(id),
    name text not null,
    created_at timestamp with time zone default now(),
    unique(grade_id, name)
);

-- Subjects table
create table subjects (
    id uuid primary key default uuid_generate_v4(),
    board_id uuid not null references boards(id),
    name text not null,
    created_at timestamp with time zone default now(),
    unique(board_id, name)
);

-- Teachers table
create table teachers (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    school_id text not null references schools(site_id),
    created_at timestamp with time zone default now(),
    unique(user_id, school_id)
);

-- School Students table
create table school_students (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    school_id text not null references schools(site_id),
    grade_id uuid not null references grades(id),
    section_id uuid not null references sections(id),
    roll_number text,
    created_at timestamp with time zone default now(),
    unique(user_id, school_id),
    unique(school_id, grade_id, section_id, roll_number)
);

-- Teacher Assignments table
create table teacher_assignments (
    id uuid primary key default uuid_generate_v4(),
    teacher_id uuid not null references teachers(id),
    board_id uuid not null references boards(id),
    grade_id uuid not null references grades(id),
    section_id uuid not null references sections(id),
    subject_id uuid not null references subjects(id),
    created_at timestamp with time zone default now(),
    unique(teacher_id, board_id, grade_id, section_id, subject_id)
);

-- Create indexes for better performance

-- Schools indexes
create index idx_schools_site_id on schools(site_id);

-- Boards indexes
create index idx_boards_school on boards(school_id);

-- Grades indexes
create index idx_grades_board on grades(board_id);

-- Sections indexes
create index idx_sections_grade on sections(grade_id);

-- Subjects indexes
create index idx_subjects_board on subjects(board_id);

-- Teachers indexes
create index idx_teachers_school on teachers(school_id);
create index idx_teachers_user on teachers(user_id);

-- School Students indexes
create index idx_school_students_school on school_students(school_id);
create index idx_school_students_grade on school_students(grade_id);
create index idx_school_students_section on school_students(section_id);
create index idx_school_students_user on school_students(user_id);

-- Teacher Assignments indexes
create index idx_teacher_assignments_teacher on teacher_assignments(teacher_id);
create index idx_teacher_assignments_board on teacher_assignments(board_id);
create index idx_teacher_assignments_grade on teacher_assignments(grade_id);
create index idx_teacher_assignments_section on teacher_assignments(section_id);
create index idx_teacher_assignments_subject on teacher_assignments(subject_id);

-- Add comments to tables
comment on table schools is 'Schools registered in the system';
comment on table boards is 'Educational boards (like CBSE, ICSE) within schools';
comment on table grades is 'Grade levels within each board';
comment on table sections is 'Sections within each grade';
comment on table subjects is 'Subjects taught within each board';
comment on table teachers is 'Teachers registered in schools';
comment on table school_students is 'Students enrolled in schools';
comment on table teacher_assignments is 'Teacher assignments to board-grade-section-subject combinations';

-- Create a view for easily getting students with their user profile information
CREATE OR REPLACE VIEW student_profiles AS
SELECT 
  ss.id AS student_id,
  ss.user_id,
  ss.school_id,
  ss.grade_id,
  ss.section_id,
  ss.roll_number,
  g.name AS grade_name,
  s.name AS section_name,
  up.first_name,
  up.last_name,
  up.email
FROM 
  school_students ss
JOIN 
  grades g ON ss.grade_id = g.id
JOIN 
  sections s ON ss.section_id = s.id
LEFT JOIN 
  user_profiles up ON ss.user_id = up.user_id;

-- Create a view for teacher assignments with expanded information
CREATE OR REPLACE VIEW teacher_assignments_expanded AS
SELECT 
  ta.id AS assignment_id,
  ta.teacher_id,
  ta.board_id,
  ta.grade_id,
  ta.section_id,
  ta.subject_id,
  b.name AS board_name,
  g.name AS grade_name,
  s.name AS section_name,
  subj.name AS subject_name
FROM 
  teacher_assignments ta
JOIN 
  boards b ON ta.board_id = b.id
JOIN 
  grades g ON ta.grade_id = g.id
JOIN 
  sections s ON ta.section_id = s.id
JOIN 
  subjects subj ON ta.subject_id = subj.id;