"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, School, UserPlus, Users, UserPlus2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TeachersList from "../components/TeachersList";
import StudentsList from "../components/StudentsList";
import SchoolTeacherForm from "../components/SchoolTeacherForm";
import SchoolStudentForm from "../components/SchoolStudentForm";
import { Badge } from "@/components/ui/badge";

export default function MembersPage() {
  const [userSiteId, setUserSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("teachers");
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("site_id")
            .eq("user_id", user.id)
            .single();
          
          if (userData?.site_id) {
            setUserSiteId(userData.site_id);
            
            // Get school name
            const { data: schoolData } = await supabase
              .from("schools")
              .select("name")
              .eq("site_id", userData.site_id)
              .single();
            
            if (schoolData) {
              setSchoolName(schoolData.name);
            }

            // Get counts
            const { count: teachersCount } = await supabase
              .from("teachers")
              .select("id", { count: 'exact', head: true })
              .eq("school_id", userData.site_id);
              
            const { count: studentsCount } = await supabase
              .from("school_students")
              .select("id", { count: 'exact', head: true })
              .eq("school_id", userData.site_id);
            
            setTeacherCount(teachersCount || 0);
            setStudentCount(studentsCount || 0);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
  }, [supabase]);

  const refreshCounts = async () => {
    if (!userSiteId) return;
    
    const { count: teachersCount } = await supabase
      .from("teachers")
      .select("id", { count: 'exact', head: true })
      .eq("school_id", userSiteId);
      
    const { count: studentsCount } = await supabase
      .from("school_students")
      .select("id", { count: 'exact', head: true })
      .eq("school_id", userSiteId);
    
    setTeacherCount(teachersCount || 0);
    setStudentCount(studentsCount || 0);
    
    // Refresh the tab content
    setActiveTab(prev => prev);
  };

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    refreshCounts();
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="mr-2 h-8 w-8 text-primary" />
              School Members
            </h1>
            {!isLoading && schoolName && (
              <p className="text-muted-foreground flex items-center">
                <School className="h-4 w-4 mr-1.5" />
                <span>{schoolName}</span>
              </p>
            )}
          </div>
          
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Add a new teacher or student to your school.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="teacher" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="teacher">Teacher</TabsTrigger>
                  <TabsTrigger value="student">Student</TabsTrigger>
                </TabsList>
                
                <TabsContent value="teacher" className="p-1">
                  {userSiteId && (
                    <SchoolTeacherForm
                      schoolId={userSiteId}
                      onSuccess={handleAddSuccess}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="student" className="p-1">
                  {userSiteId && (
                    <SchoolStudentForm
                      schoolId={userSiteId}
                      onSuccess={handleAddSuccess}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-52" />
              <div className="rounded-md border shadow-sm overflow-hidden">
                <div className="bg-muted/50 p-4">
                  <Skeleton className="h-8 w-full max-w-md mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : userSiteId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <UserPlus2 className="h-4 w-4" />
                <span>Teachers</span>
                <Badge variant="outline" className="ml-1">{teacherCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Students</span>
                <Badge variant="outline" className="ml-1">{studentCount}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teachers">
              <TeachersList schoolId={userSiteId} />
            </TabsContent>
            <TabsContent value="students">
              <StudentsList schoolId={userSiteId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-12 text-center">
            <School className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">School not set up</h3>
            <p className="text-muted-foreground mb-6">
              You need to complete your school setup first.
            </p>
            <Button asChild>
              <a href="/school">Go to School Setup</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
