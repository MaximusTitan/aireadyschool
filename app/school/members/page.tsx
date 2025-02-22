"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import SchoolTeacherForm from "../components/SchoolTeacherForm";
import SchoolStudentForm from "../components/SchoolStudentForm";
import TeachersList from "../components/TeachersList";
import StudentsList from "../components/StudentsList";

export default function MembersPage() {
  const [userSiteId, setUserSiteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("site_id")
          .eq("user_id", user.id)
          .single();

        if (userData) {
          setUserSiteId(userData.site_id);
        }
      }
    };

    getUserData();
  }, [supabase]);

  if (!userSiteId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Manage School Members</h1>
      <Tabs defaultValue="teachers">
        <TabsList className="mb-6">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        <TabsContent value="teachers">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
              <SchoolTeacherForm
                schoolId={userSiteId}
                onSuccess={() => alert("Teacher added successfully")}
              />
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Teachers List</h2>
              <TeachersList schoolId={userSiteId} />
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="students">
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
              <SchoolStudentForm
                schoolId={userSiteId}
                onSuccess={() => alert("Student added successfully")}
              />
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Students List</h2>
              <StudentsList schoolId={userSiteId} />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
