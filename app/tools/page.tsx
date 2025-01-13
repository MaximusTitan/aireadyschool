import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ToolsPage from "./ToolsPage";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <main className="min-h-screen bg-background">
      <ToolsPage />
    </main>
  );
}
