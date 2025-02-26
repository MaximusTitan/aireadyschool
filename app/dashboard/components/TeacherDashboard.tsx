"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import SchoolInfo from "./SchoolInfo";
import StatCard from "./StatCard";
import TeacherClasses from "./TeacherClasses";
import TeacherStudents from "./TeacherStudents";

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

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [classCount, setClassCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }
        
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
      <SchoolInfo school={schoolData} userRole="teacher" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="My Classes" 
          value={classCount.toString()} 
          icon="📚" 
          color="bg-blue-50" 
        />
        <StatCard 
          title="My Students" 
          value="--" 
          icon="👨‍🎓" 
          color="bg-green-50" 
        />
        <StatCard 
          title="Assignments" 
          value="--" 
          icon="✏️" 
          color="bg-amber-50" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeacherClasses />
        <TeacherStudents />
      </div>
    </div>
  );
}
