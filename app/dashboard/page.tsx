"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import DashboardLayout from "./components/DashboardLayout";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";

type UserRole = "Teacher" | "Student";

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get role from auth metadata
      const role = user.user_metadata?.role as UserRole;
      if (role) {
        setUserRole(role);
      }
      setLoading(false);
    }

    getUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!userRole) {
    return <div>Access denied. Please log in.</div>;
  }

  return (
    <>
      <DashboardLayout
        title={`${userRole} Dashboard`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={userRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : userRole === "Teacher" ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard />
            )}
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>
    </>
  );
}
