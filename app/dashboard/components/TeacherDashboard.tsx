"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import SchoolInfo from "./SchoolInfo";
import StatCard from "./StatCard";
import TeacherClasses from "./TeacherClasses";
import TeacherStudents from "./TeacherStudents";
import Link from "next/link";
import { BookOpen, ClipboardList, CheckSquare, Users, FileText } from "lucide-react";
import AnnouncementSender from "./AnnouncementSender";

// Define proper interfaces to match Supabase response
interface School {
  id: string;
  site_id: string;
  name: string;
  address?: string;
}

interface TeacherData {
  id: string;
  school_id: string;
  // Define schools as an optional single School object (not an array)
  schools?: School;
}

// Interface for the raw data returned from Supabase
interface SupabaseTeacherResponse {
  id: string;
  school_id: string;
  schools: {
    id: string;
    site_id: string;
    name: string;
    address: string;
  };
}

// Quick Access Tool Component
interface QuickAccessToolProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickAccessTool({ title, description, href, icon }: QuickAccessToolProps) {
  return (
    <Link 
      href={href}
      className="flex items-center p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-colors group"
    >
      <div className="mr-3 text-gray-500 group-hover:text-primary">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-700 group-hover:text-primary">{title}</h3>
        <p className="text-xs text-gray-500 line-clamp-1">{description}</p>
      </div>
    </Link>
  );
}

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [classCount, setClassCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [studentCount, setStudentCount] = useState<number>(0);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Get user name from metadata
        if (user.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        }
        
        // Rest of existing fetch code
        const { data: teacher } = await supabase
          .from('teachers')
          .select(`
            id,
            school_id,
            schools (
              id,
              site_id,
              name,
              address
            )
          `)
          .eq('user_id', user.id)
          .single();
          
        if (teacher) {
          // First convert to unknown, then to TeacherData
          const teacherDataConverted: TeacherData = {
            id: teacher.id,
            school_id: teacher.school_id
          };
          
          setTeacherData(teacherDataConverted);
          
          // Set school data from the joined query
          if (teacher.schools) {
            // Extract school from the array or single object
            const schoolInfo = Array.isArray(teacher.schools) 
              ? teacher.schools[0] 
              : teacher.schools;
              
            setSchoolData({
              id: schoolInfo.id,
              site_id: schoolInfo.site_id,
              name: schoolInfo.name,
              address: schoolInfo.address
            });
          }
          
          // Get assignment counts
          const { count: classesCount } = await supabase
            .from('teacher_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacher.id);
            
          if (classesCount !== null) {
            setClassCount(classesCount);
          }
          
          // Get student count for this teacher
          let studentCountVal = 0;
          const { data: assignments } = await supabase
            .from('teacher_assignments')
            .select('grade_id, section_id')
            .eq('teacher_id', teacher.id);
            
          if (assignments && assignments.length > 0) {
            // For each assignment, count the number of students
            const promises = assignments.map(async (assignment) => {
              const { count } = await supabase
                .from('school_students')
                .select('*', { count: 'exact', head: true })
                .eq('grade_id', assignment.grade_id)
                .eq('section_id', assignment.section_id);
                
              return count || 0;
            });
            
            const counts = await Promise.all(promises);
            studentCountVal = counts.reduce((sum, count) => sum + count, 0);
            setStudentCount(studentCountVal);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, [supabase]);
  
  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }
  
  if (!teacherData || !schoolData) {
    return <div>No teacher data found. Please complete your profile setup.</div>;
  }
  
  return (
    <div className="space-y-6">
      {userName && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome, {userName}
          </h1>
          <p className="text-gray-500 mt-1">Have a productive day teaching!</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <SchoolInfo school={schoolData} userRole="teacher" size="small" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard 
              title="My Classes" 
              value={classCount.toString()} 
              icon="📚" 
              color="bg-blue-50" 
            />
            <StatCard 
              title="My Students" 
              value={studentCount.toString()} 
              icon="👨‍🎓" 
              color="bg-green-50" 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeacherClasses />
            <TeacherStudents />
          </div>
          
          {/* New Announcement Sender section */}
          <AnnouncementSender />
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Quick Access</h2>
            <div className="space-y-2">
              <QuickAccessTool 
                title="Lesson Plan Generator" 
                description="Create lesson plans" 
                href="/tools/lesson-planner" 
                icon={<BookOpen size={18} />} 
              />
              <QuickAccessTool 
                title="Assessment Generator" 
                description="Create interactive multiple-choice questions" 
                href="/tools/mcq-generator" 
                icon={<ClipboardList size={18} />} 
              />
              <QuickAccessTool 
                title="Evaluator" 
                description="Evaluate student answers" 
                href="/tools/evaluator" 
                icon={<CheckSquare size={18} />} 
              />
              <QuickAccessTool 
                title="Personalized Learning Plan" 
                description="Plan individualized education for students" 
                href="/tools/plp" 
                icon={<Users size={18} />} 
              />
              <QuickAccessTool 
                title="Assignment Generator" 
                description="Generate assignments" 
                href="/tools/assignment-generator" 
                icon={<FileText size={18} />} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
