import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Create a helper function to handle the actual logic
async function getLessonPlan(id: string) {
  if (!id) {
    return { error: 'Missing lesson plan ID', status: 400 };
  }

  try {
    const supabase = await createClient();

    const { data: lessonPlan, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!lessonPlan) {
      return { error: 'Lesson plan not found', status: 404 };
    }

    return { data: lessonPlan };
  } catch (error) {
    console.error('Lesson plan fetch error:', error);
    return { error: 'Failed to fetch lesson plan', status: 500 };
  }
}

// Use any type to bypass the TypeScript errors
export async function GET(
  req: NextRequest,
  ctx: any
) {
  const id = ctx.params?.id;
  const result = await getLessonPlan(id);
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  
  return NextResponse.json(result.data);
}