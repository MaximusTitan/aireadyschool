"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, School, UserPlus, UserPlus2, AlertCircle } from "lucide-react";
import SchoolTeacherForm from "../../components/SchoolTeacherForm";
import SchoolStudentForm from "../../components/SchoolStudentForm";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function AddMemberPage() {
  const [userSiteId, setUserSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("site_id")
            .eq("user_id", user.id)
            .single();
          
          if (userError) {
            throw new Error("Could not fetch user data");
          }
          
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
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
  }, [supabase]);

  const handleSuccess = () => {
    router.push("/school/members");
  };

  return (
    <div className="container py-10 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()} 
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Link href="/school/members" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Members
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm">Add New</span>
        </div>
        
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-primary" />
            Add New Member
          </h1>
          {schoolName && (
            <p className="text-muted-foreground mt-1 flex items-center">
              <School className="h-4 w-4 mr-1.5" />
              <span>{schoolName}</span>
            </p>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4 mx-auto" />
            </div>
          </div>
        ) : userSiteId ? (
          <Tabs defaultValue="teacher" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="teacher" className="flex items-center justify-center gap-2">
                <UserPlus2 className="h-4 w-4" />
                Teacher
              </TabsTrigger>
              <TabsTrigger value="student" className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Student
              </TabsTrigger>
            </TabsList>
            
            <div className="bg-muted/40 rounded-lg p-6">
              <TabsContent value="teacher" className="mt-0 p-0">
                <SchoolTeacherForm
                  schoolId={userSiteId}
                  onSuccess={handleSuccess}
                />
              </TabsContent>
              
              <TabsContent value="student" className="mt-0 p-0">
                <SchoolStudentForm
                  schoolId={userSiteId}
                  onSuccess={handleSuccess}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="bg-muted/30 p-8 rounded-lg border text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">School not set up</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need to complete your school setup before you can add members.
            </p>
            <Button asChild size="lg">
              <Link href="/school">Go to School Setup</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
