"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentProfile } from "@/app/dat/types/profile";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data, error } = await supabase
          .from("dat_student_details")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
        if (!error) {
          setProfile(data);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="w-full p-6">
          <Skeleton className="h-8 w-[250px] mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="w-full p-6">
          <p>No profile found.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="w-full p-6">
        {/* Header with back button and logout button */}
        <div className="mb-8 flex justify-between items-center w-full">
          {/* Left aligned content */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                Student Profile
              </h1>
              <p className="text-gray-600">
                View and manage your personal information
              </p>
            </div>
          </div>

          {/* Right aligned logout button */}
          <div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 border-rose-200">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-4">
              {profile?.photo ? (
                <Image
                  src={profile.photo}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="text-2xl text-rose-600">
                    {profile?.name[0]}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-rose-600">
                  {profile.name}
                </h1>
                <p className="text-gray-500">Grade {profile.grade}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-rose-200">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-rose-600">
                Personal Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{profile.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Parent&apos;s Name
                  </label>
                  <p className="font-medium">{profile?.parent_name}</p>
                </div>
                {profile.school_name && (
                  <div>
                    <label className="text-sm text-gray-500">School</label>
                    <p className="font-medium">{profile.school_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-rose-600">
                Location Details
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Area</label>
                  <p className="font-medium">{profile.area}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">City</label>
                  <p className="font-medium">{profile.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
