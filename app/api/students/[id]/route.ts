import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface Grade {
  name: string;
}

interface Section {
  name: string;
}

interface StudentData {
  id: string;
  roll_number: string;
  user_id: string;
  grade_id: string;
  section_id: string;
  grades: Grade | Grade[];
  sections: Section | Section[];
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to extract the ID
    const { id: studentId } = await context.params;
    
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('school_students')
      .select(`
        id,
        roll_number,
        user_id,
        grade_id,
        section_id,
        grades (name),
        sections (name)
      `)
      .eq('id', studentId)
      .single<StudentData>();

    if (studentError) throw studentError;

    if (studentData) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(studentData.user_id);
      if (userError) throw userError;

      const gradeName = Array.isArray(studentData.grades)
        ? studentData.grades[0]?.name
        : studentData.grades?.name;

      const sectionName = Array.isArray(studentData.sections)
        ? studentData.sections[0]?.name
        : studentData.sections?.name;

      return NextResponse.json({
        id: studentData.id,
        roll_number: studentData.roll_number,
        email: user?.email || 'N/A',
        name: user?.user_metadata?.name || 'N/A',
        grade_name: gradeName || 'N/A',
        section_name: sectionName || 'N/A'
      });
    }

    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}