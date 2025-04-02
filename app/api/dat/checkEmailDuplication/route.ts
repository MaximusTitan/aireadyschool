import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  const { email } = await request.json();

  // Use listUsers() as a workaround for getUserByEmail
  const { data: listUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ exists: false });
  }
  if (listUsersData?.users.some((user) => user.email === email)) {
    return NextResponse.json({ exists: true });
  }

  // Check in student_details table
  const { data: student } = await supabaseAdmin
    .from("student_details")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (student) return NextResponse.json({ exists: true });

  // Check in school_details table
  const { data: school } = await supabaseAdmin
    .from("school_details")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (school) return NextResponse.json({ exists: true });

  return NextResponse.json({ exists: false });
}
