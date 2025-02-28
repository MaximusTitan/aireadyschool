"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DashboardCard from "./DashboardCard";

interface Student {
  id: string;
  user_id: string;
  email: string;
  roll_number: string | null;
  grade_name: string;
  section_name: string;
}

interface SupabaseAssignment {
  grade_id: string;
  section_id: string;
  grades: { name: string } | { name: string }[];
  sections: { name: string } | { name: string }[];
}

interface TeacherAssignment {
  grade_id: string;
  section_id: string;
  grade_name: string;
  section_name: string;
}

export default function TeacherStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStudents() {
      try {
        // Get the current logged-in teacher
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          setError("User not authenticated");
          return;
        }

        // Get teacher record
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (teacherError || !teacherData) {
          setLoading(false);
          setError("Teacher record not found");
          return;
        }

        const teacher = teacherData;

        // Get teacher's assignments
        const { data, error: assignmentError } = await supabase
          .from('teacher_assignments')
          .select(`
            grade_id, 
            section_id,
            grades (name),
            sections (name)
          `)
          .eq('teacher_id', teacher.id);

        if (assignmentError) {
          setLoading(false);
          setError("Error loading teacher assignments");
          return;
        }

        // Transform the data to match the TeacherAssignment interface
        const uniqueAssignments = data ?
          Array.from(new Map(
            (data as SupabaseAssignment[]).map(item => {
              // Handle both array and object formats for grades and sections
              let gradeName = '';
              let sectionName = '';
              
              if (Array.isArray(item.grades)) {
                gradeName = item.grades[0]?.name || '';
              } else if (item.grades && typeof item.grades === 'object') {
                gradeName = item.grades.name || '';
              }
              
              if (Array.isArray(item.sections)) {
                sectionName = item.sections[0]?.name || '';
              } else if (item.sections && typeof item.sections === 'object') {
                sectionName = item.sections.name || '';
              }
              
              return [
                `${item.grade_id}-${item.section_id}`,
                {
                  grade_id: item.grade_id,
                  section_id: item.section_id,
                  grade_name: gradeName,
                  section_name: sectionName
                }
              ];
            })
          ).values()) : [];

        // If no assignments, return empty array
        if (uniqueAssignments.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // Get all students in the teacher's assigned grade-sections
        const studentPromises = uniqueAssignments.map(async (assignment) => {
          const { data: studentData, error: studentError } = await supabase
            .from('school_students')
            .select(`
              id,
              user_id,
              roll_number
            `)
            .eq('grade_id', assignment.grade_id)
            .eq('section_id', assignment.section_id);

          if (studentError || !studentData) {
            return [];
          }

          // For each student, get their email from users table
          const studentsWithProfiles = await Promise.all(
            studentData.map(async (student) => {
              const { data: userData } = await supabase
                .from('users')
                .select('email')
                .eq('user_id', student.user_id)
                .single();

              return {
                ...student,
                email: userData?.email || 'No email',
                grade_name: assignment.grade_name,
                section_name: assignment.section_name
              };
            })
          );

          return studentsWithProfiles;
        });

        // Flatten the array of arrays into a single array of students
        const allStudents = (await Promise.all(studentPromises)).flat();
        setStudents(allStudents);
        setLoading(false);
      } catch (err) {
        console.error("Error loading students:", err);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    }

    loadStudents();
  }, [supabase]);

  const handleStudentClick = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
  };

  if (loading) {
    return (
      <DashboardCard title="My Students">
        <div className="animate-pulse text-center py-8">
          Loading students...
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="My Students">
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </DashboardCard>
    );
  }

  if (students.length === 0) {
    return (
      <DashboardCard title="My Students">
        <div className="text-center py-8 text-gray-500">
          No students assigned to your classes yet.
        </div>
      </DashboardCard>
    );
  }

  // Group students by grade and section
  const studentsByClass = students.reduce((acc, student) => {
    const key = `${student.grade_name} - ${student.section_name}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  return (
    <DashboardCard title="My Students">
      <div className="space-y-6">
        {Object.entries(studentsByClass).map(([className, classStudents]) => (
          <div key={className} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium">{className}</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.roll_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
