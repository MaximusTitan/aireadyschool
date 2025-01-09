import { createClient } from "@/utils/supabase/server";

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = user?.user_metadata.role ?? null;
  const school = user?.user_metadata.site_id ?? null;

  return (
    <div>
      <h1>Welcome to the App!</h1>
      <p>Your email: {user?.email}</p>
      <p>Your role: {userRole}</p>
      <p>Your school: {school}</p>
    </div>
  );
};

export default DashboardPage;
