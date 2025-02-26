import { createClient } from "@/utils/supabase/server";
import RoleSelector from "./RoleSelector";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = user?.user_metadata.role ?? null;

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="ml-[118px] mt-[12px] p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        Welcome to the Admin Dashboard
      </h1>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">User Information</h2>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center">
            <span className="font-medium w-24">Email:</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-24">Current Role:</span>
            <span>{userRole || "Not set"}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Update Role</h2>
        <RoleSelector initialRole={userRole} />
      </div>
    </div>
  );
};

export default DashboardPage;
