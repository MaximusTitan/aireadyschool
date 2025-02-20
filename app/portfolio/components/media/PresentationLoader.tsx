import { createClient } from "@/utils/supabase/server";
import PresentationSection, { Presentation } from "./PresentationSection";

export default async function PresentationLoader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    console.error("User email not found");
    return <div>Please log in to manage presentations</div>;
  }

  const { data: presentations } = await supabase
    .from("presentations")
    .select("*")
    .eq("student_email", user.email)
    .order("updated_at", { ascending: false });

  return <PresentationSection />;
}
