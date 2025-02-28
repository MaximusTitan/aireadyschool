"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import DashboardCard from "./DashboardCard";

interface StudentClass {
  subject_name: string;
  teacher_email?: string;
}

// Update the TeacherAssignment interface to match the actual data structure
interface TeacherAssignment {
  subjects: {
    name: string;
  };
  teachers: {
    user_id: string;
  };
}

export default function StudentClasses() {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadClasses() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get student record
      const { data: student } = await supabase
        .from('school_students')
        .select('grade_id, section_id')
        .eq('user_id', user.id)
        .single();
      
      if (student) {
        // Get subjects for the student's grade and section
        const { data: assignmentsData } = await supabase
          .from('teacher_assignments')
          .select(`
            subjects(name),
            teachers(user_id)
          `)
          .eq('grade_id', student.grade_id)
          .eq('section_id', student.section_id);
          
        if (assignmentsData && assignmentsData.length > 0) {
          // For each assignment, get the teacher's email
          const classesWithTeachers = await Promise.all(
            assignmentsData.map(async (assignment: any) => {
              const subjectName = assignment.subjects.name || 
                (Array.isArray(assignment.subjects) && assignment.subjects[0]?.name);
              
              const teacherId = assignment.teachers.user_id || 
                (Array.isArray(assignment.teachers) && assignment.teachers[0]?.user_id);
              
              if (teacherId) {
                const { data: userData } = await supabase
                  .from('users')
                  .select('email')
                  .eq('user_id', teacherId)
                  .single();
                  
                return {
                  subject_name: subjectName || "Unknown Subject",
                  teacher_email: userData?.email || "No email"
                };
              }
              
              return {
                subject_name: subjectName || "Unknown Subject",
                teacher_email: "Not assigned"
              };
            })
          );
          
          setClasses(classesWithTeachers);
        }
      }
      
      setLoading(false);
    }
    
    loadClasses();
  }, [supabase]);
  
  if (loading) {
    return <div className="animate-pulse">Loading classes...</div>;
  }
  
  if (classes.length === 0) {
    return (
      <DashboardCard title="My Subjects">
        <div className="text-center py-8">
          <p className="text-gray-500">No subjects assigned yet.</p>
        </div>
      </DashboardCard>
    );
  }
  
  return (
    <DashboardCard title="My Subjects">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.subject_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.teacher_email || "Not assigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
