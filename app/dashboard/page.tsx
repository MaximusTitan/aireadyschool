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
      <div className="bg-backgroundApp p-4 flex flex-wrap items-center gap-2">
        <a
          href="/admin"
          className="bg-white hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-xs transition-all flex items-center gap-1 font-bold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Admin Panel
        </a>

        <span className="text-xs text-gray-500 italic px-2 py-1 bg-white rounded-md font-bold">
          Role management is now in Admin Panel
        </span>
      </div>

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
