"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StudentDetails {
  id: string;
  roll_number: string | null;
  email: string;
  name: string;
  grade_name: string;
  section_name: string;
  attendance_percentage?: number;
}

interface GradeData {
  name: string;
}

interface SectionData {
  name: string;
}

interface StudentData {
  id: string;
  roll_number: string | null;
  user_id: string;
  grade_id: string;
  section_id: string;
  grades: GradeData | GradeData[];
  sections: SectionData | SectionData[];
}

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudentDetails() {
      try {
        const response = await fetch(`/api/students/${resolvedParams.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error);
        }

        setStudent(data);
      } catch (err) {
        console.error('Error loading student details:', err);
        setError('Could not load student details');
      } finally {
        setLoading(false);
      }
    }

    loadStudentDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <DashboardLayout title="Student Details">
        <div className="animate-pulse text-center py-8">
          Loading student details...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout title="Student Details">
        <div className="text-red-500 text-center py-8">
          {error || 'Student not found'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Student Details - ${student.name}`}>
      <div className="mb-4">
        <Button 
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </Button>
      </div>
      <div className="space-y-6">
        <DashboardCard title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-base text-gray-900">{student.name}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-base text-gray-900">{student.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Roll Number</label>
              <p className="text-base text-gray-900">{student.roll_number || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Class</label>
              <p className="text-base text-gray-900">{student.grade_name} - {student.section_name}</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}