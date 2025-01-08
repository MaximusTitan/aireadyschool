"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const RoleSelector = ({ initialRole }: { initialRole: string | null }) => {
  const [selectedRole, setSelectedRole] = useState(initialRole ?? "Student");
  const supabase = createClient();

  const updateRole = async (newRole: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { role: newRole },
    });
    if (error) {
      console.error("Error updating role:", error);
    } else {
      setSelectedRole(newRole);
    }
  };

  return (
    <select value={selectedRole} onChange={(e) => updateRole(e.target.value)}>
      <option value="Admin">Admin</option>
      <option value="School">School</option>
      <option value="Teacher">Teacher</option>
      <option value="Student">Student</option>
    </select>
  );
};

export default RoleSelector;
