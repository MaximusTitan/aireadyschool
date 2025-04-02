"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const RoleSelector = ({ initialRole }: { initialRole: string | null }) => {
  const [selectedRole, setSelectedRole] = useState(initialRole ?? "Student");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const updateRole = async (newRole: string) => {
    setMessage("");
    const { error } = await supabase.auth.updateUser({
      data: { role: newRole },
    });
    if (error) {
      console.error("Error updating role:", error);
    } else {
      setSelectedRole(newRole);
      setMessage("Role updated successfully");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div>
      <select
        value={selectedRole}
        onChange={(e) => updateRole(e.target.value)}
        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Admin">Admin</option>
        <option value="School">School</option>
        <option value="Teacher">Teacher</option>
        <option value="Student">Student</option>
        <option value="dat_admin">DAT ADMIN</option>
        <option value="dat_school">DAT SCHOOL</option>
        <option value="dat_student">DAT STUDENT</option>
        <option value="dat_judge">DAT JUDGE</option>
      </select>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
    </div>
  );
};

export default RoleSelector;
