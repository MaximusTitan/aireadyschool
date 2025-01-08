import { createClient } from "@/utils/supabase/server";
import RoleSelector from "./RoleSelector";

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = user?.user_metadata.role ?? null;

  return (
    <div>
      <h1>Welcome to the App!</h1>
      <p>Your email: {user?.email}</p>
      <p>Your role: {userRole}</p>
      <RoleSelector initialRole={userRole} />
    </div>
  );
};

export default DashboardPage;
