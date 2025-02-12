import { createClient } from "@/utils/supabase/client"

export async function generateLessonPlan(formData: FormData) {
  const supabase = createClient();
  
  // Call the new API endpoint
  const res = await fetch("/api/generateLessonPlan", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

