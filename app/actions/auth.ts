'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface CreateTeacherParams {
  name: string;
  email: string;
  password: string;
  schoolId: string;
  boardId: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
}

interface CreateStudentParams {
  name: string;
  email: string;
  password: string;
  schoolId: string;
  boardId: string;
  gradeId: string;
  sectionId: string;
  rollNumber: string;
}

interface BulkCreateStudentParams {
  students: {
    name: string;
    email: string;
    password: string;
    schoolId: string;
    boardId: string;
    gradeId: string;
    sectionId: string;
    rollNumber: string;
  }[];
}

export async function createTeacher(params: CreateTeacherParams) {
  const { name, email, password, schoolId, boardId, gradeId, sectionId, subjectId } = params;

  try {
    // Create auth user with email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "Teacher" },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user created");

    // Update metadata to include name
    await supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        name,
        role: 'Teacher',
        school_id: schoolId,
        board_id: boardId,
        grade_id: gradeId,
        section_id: sectionId,
        subject_id: subjectId,
      },
    });

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      user_id: authData.user.id,
      site_id: schoolId,
      role_type: "Teacher",
      email: email,
      image_credits: 25,
      video_credits: 5,
    });

    if (userError) throw userError;

    // Create teacher record and get the generated id
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // Create teacher assignment record
    const { error: assignError } = await supabase
      .from("teacher_assignments")
      .insert({
        teacher_id: teacherData.id,
        board_id: boardId,
        grade_id: gradeId,
        section_id: sectionId,
        subject_id: subjectId,
      });

    if (assignError) throw assignError;

    return { success: true };
  } catch (error) {
    console.error("Error creating teacher:", error);
    return { success: false, error };
  }
}

export async function createStudent(params: CreateStudentParams) {
  const { name, email, password, schoolId, boardId, gradeId, sectionId, rollNumber } = params;

  try {
    // Create auth user with email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "Student" },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user created");

    // Update metadata to include name
    await supabase.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        name,
        role: 'Student',
        school_id: schoolId,
        board_id: boardId,
        grade_id: gradeId,
        section_id: sectionId,
        roll_number: rollNumber,
      },
    });

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      user_id: authData.user.id,
      site_id: schoolId,
      role_type: "Student",
      email: email,
      image_credits: 25,
      video_credits: 5,
    });

    if (userError) throw userError;

    // Create student record
    const { error: studentError } = await supabase
      .from("school_students")
      .insert({
        user_id: authData.user.id,
        school_id: schoolId,
        grade_id: gradeId,
        section_id: sectionId,
        roll_number: rollNumber,
      });

    if (studentError) throw studentError;

    return { success: true };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error };
  }
}

export async function createBulkStudents(params: BulkCreateStudentParams) {
  try {
    for (const student of params.students) {
      const result = await createStudent(student);
      if (!result.success) throw result.error;
    }
    return { success: true };
  } catch (error) {
    console.error("Error in bulk creation:", error);
    return { success: false, error };
  }
}
