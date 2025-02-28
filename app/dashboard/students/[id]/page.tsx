"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface StudentDetails {
  id: string;
  roll_number: string | null;
  email: string;
  name: string;
  grade_name: string;
  section_name: string;
  attendance_percentage?: number;
  chat_threads?: ChatThread[];
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

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatThreadsLoading, setChatThreadsLoading] = useState(true);
  const [chatThreadsError, setChatThreadsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // First load student details
        setLoading(true);
        const studentResponse = await fetch(`/api/students/${resolvedParams.id}`);
        const studentData = await studentResponse.json();
        
        if (!studentResponse.ok) {
          throw new Error(studentData.error);
        }

        setStudent(studentData);
        
        // Fetch chat threads directly using Supabase
        setChatThreadsLoading(true);
        try {
          const supabase = createClient();
          
          // First get the user ID associated with this student
          const { data: studentData, error: studentError } = await supabase
            .from('school_students')
            .select('user_id')
            .eq('id', resolvedParams.id)
            .single();
            
          if (studentError) {
            throw new Error('Student not found');
          }
  
          const userId = studentData.user_id;
          
          // Now fetch chat threads for this user
          const { data: chatThreads, error: chatThreadsError } = await supabase
            .from('chat_threads')
            .select('id, title, created_at, updated_at')
            .eq('user_id', userId)
            .eq('archived', false)
            .order('updated_at', { ascending: false });
            
          if (chatThreadsError) {
            throw new Error('Failed to fetch chat history');
          }
          
          // Update student with chat threads
          setStudent(prevStudent => 
            prevStudent ? { ...prevStudent, chat_threads: chatThreads } : null
          );
        } catch (chatErr) {
          console.error('Error loading chat threads:', chatErr);
          setChatThreadsError('Failed to load chat history');
        } finally {
          setChatThreadsLoading(false);
        }
      } catch (err) {
        console.error('Error loading student details:', err);
        setError('Could not load student details');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.id]);

  const navigateToChatThread = (threadId: string) => {
    router.push(`/tools/gen-chat?thread=${threadId}`);
  };

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

        <DashboardCard title="Chat History">
          <div className="p-6">
            {chatThreadsLoading ? (
              <div className="animate-pulse text-center py-4">
                Loading chat history...
              </div>
            ) : chatThreadsError ? (
              <div className="text-red-500 text-center py-4">
                {chatThreadsError}
              </div>
            ) : (student.chat_threads && student.chat_threads.length > 0) ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chat Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.chat_threads.map((thread) => (
                      <tr 
                        key={thread.id} 
                        onClick={() => navigateToChatThread(thread.id)}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{thread.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(thread.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(thread.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">No chat history available</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}