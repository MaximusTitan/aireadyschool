import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Fetch lessons for the user ordered by creation time descending
  const { data, error: fetchError } = await supabase
    .from("lesson_cont_gen")
    .select("*")
    .eq("user_email", user.email)
    .order("created_at", { ascending: false });
    
  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch lesson history" }, { status: 500 });
  }
  
  return NextResponse.json({ lessons: data });
}
