import { createClient } from "@/utils/supabase/server";
import ResearchWorkSection, { ResearchWork } from "./ResearchWorkSection";

export default async function ResearchWorkLoader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <div>Please log in to manage research works</div>;
  }

  const { data: researchWorks } = await supabase
    .from("research_works")
    .select("*")
    .eq("student_email", user.email)
    .order("updated_at", { ascending: false });

  return <ResearchWorkSection />;
}
