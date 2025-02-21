-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Schools table (modified to match your existing structure)
create table schools (
    id uuid primary key default uuid_generate_v4(),
    site_id text unique not null,
    name text not null,
    address text,
    contact_info jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Boards table (CBSE, ICSE, etc.)
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

-- Teachers table (connects to your existing users table)
create table teachers (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    school_id text not null references schools(site_id),
    created_at timestamp with time zone default now(),
    unique(user_id, school_id)
);

-- School Students table (renamed from students)
create table school_students (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    school_id text not null references schools(site_id),
    section_id uuid not null references sections(id),
    roll_number text,
    created_at timestamp with time zone default now(),
    unique(user_id, school_id)
);

-- Teacher Assignments table (connects teachers to sections and subjects)
create table teacher_assignments (
    id uuid primary key default uuid_generate_v4(),
    teacher_id uuid not null references teachers(id),
    section_id uuid not null references sections(id),
    subject_id uuid not null references subjects(id),
    created_at timestamp with time zone default now(),
    unique(teacher_id, section_id, subject_id)
);

-- Triggers for updated_at
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

-- Indexes for better performance
create index idx_boards_school on boards(school_id);
create index idx_grades_board on grades(board_id);
create index idx_sections_grade on sections(grade_id);
create index idx_subjects_board on subjects(board_id);
create index idx_teachers_school on teachers(school_id);
create index idx_school_students_school on school_students(school_id);
create index idx_school_students_section on school_students(section_id);