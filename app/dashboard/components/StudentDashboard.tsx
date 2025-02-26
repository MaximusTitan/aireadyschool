"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import SchoolInfo from "./SchoolInfo";
import StatCard from "./StatCard";
import DashboardCard from "./DashboardCard";
import StudentClasses from "./StudentClasses";

interface School {
  id: string;
  name: string;
  address?: string;
  site_id: string;
}

interface Student {
  id: string;
  user_id: string;
  school_id: string;
  grade_id: string;
  section_id: string;
  roll_number?: string;
}

interface StudentInfo {
  grade_name: string;
  section_name: string;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get student data
      const { data: student } = await supabase
        .from('school_students')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setStudentData(student);

      if (student) {
        // Get school info
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id, name, address, site_id')
          .eq('site_id', student.school_id)
          .single();

        setSchool(schoolData);
        
        // Get grade and section names
        const { data: gradeData } = await supabase
          .from('grades')
          .select('name')
          .eq('id', student.grade_id)
          .single();
          
        const { data: sectionData } = await supabase
          .from('sections')
          .select('name')
          .eq('id', student.section_id)
          .single();
          
        if (gradeData && sectionData) {
          setStudentInfo({
            grade_name: gradeData.name,
            section_name: sectionData.name
          });
        }
      }
      
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  if (!studentData || !school) {
    return <div>Student data not found. Please contact administrator.</div>;
  }

  return (
    <div>
      <SchoolInfo school={school} userRole="student" />
      
      <div className="mb-6">
        <DashboardCard title="Student Information">
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Grade</p>
              <p className="font-medium">{studentInfo?.grade_name || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Section</p>
              <p className="font-medium">{studentInfo?.section_name || "N/A"}</p>
            </div>
            {studentData.roll_number && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">Roll Number</p>
                <p className="font-medium">{studentData.roll_number}</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
      
      <StudentClasses />
    </div>
  );
}
