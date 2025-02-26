"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import DashboardCard from "./DashboardCard";

interface TeacherClass {
  id: string;
  board_name: string;
  grade_name: string;
  section_name: string;
  subject_name: string;
}

// Add interface to match Supabase join query return type
interface TeacherAssignmentRow {
  id: string;
  boards: { name: string };
  grades: { name: string };
  sections: { name: string };
  subjects: { name: string };
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadClasses() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get teacher record
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (teacher) {
        // Get teacher assignments with joined data for boards, grades, sections and subjects
        const { data } = await supabase
          .from('teacher_assignments')
          .select(`
            id,
            boards!inner(name),
            grades!inner(name),
            sections!inner(name),
            subjects!inner(name)
          `)
          .eq('teacher_id', teacher.id);
          
        if (data) {
          // Cast the data to the correct type
          const assignmentData = data as unknown as TeacherAssignmentRow[];
          const formattedClasses = assignmentData.map(item => ({
            id: item.id,
            board_name: item.boards.name,
            grade_name: item.grades.name,
            section_name: item.sections.name,
            subject_name: item.subjects.name
          }));
          
          setClasses(formattedClasses);
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
      <DashboardCard title="My Classes">
        <div className="text-center py-8">
          <p className="text-gray-500">No classes assigned yet.</p>
        </div>
      </DashboardCard>
    );
  }
  
  return (
    <DashboardCard title="My Classes">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Board</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.board_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.grade_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.section_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.subject_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
