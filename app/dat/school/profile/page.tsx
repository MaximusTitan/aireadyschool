"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SchoolProfile {
  contact_name: string;
  designation: string;
  email: string;
  phone: string;
  school_name: string;
  website_address: string;
  education_board: string;
  computers: string;
  total_children: string;
  area: string;
  city: string;
}

export default function SchoolProfilePage() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data, error } = await supabase
          .from("dat_school_details")
          .select("*")
          .eq("email", user.email)
          .single();

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
    window.location.href = "/sign-in";
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <p>No profile found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        {/* Header with back button and logout button */}
        <div className="mb-8 flex justify-between items-center">
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
                School Profile
              </h1>
              <p className="text-gray-600">View your school`s information</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Logout
          </Button>
        </div>

        {/* School Info Card */}
        <Card className="mb-6 border-rose-200">
          <CardHeader className="pb-2">
            <h2 className="text-2xl font-bold text-rose-600">
              {profile.school_name}
            </h2>
            <p className="text-gray-500">{profile.education_board}</p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="border-rose-200">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-rose-600">
                Contact Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">
                    Contact Person
                  </label>
                  <p className="font-medium">{profile.contact_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Designation</label>
                  <p className="font-medium">{profile.designation}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Details */}
          <Card className="border-rose-200">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-rose-600">
                School Details
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Website</label>
                  <p className="font-medium">
                    {profile.website_address || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Number of Computers
                  </label>
                  <p className="font-medium">{profile.computers}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Total Students
                  </label>
                  <p className="font-medium">{profile.total_children}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Location</label>
                  <p className="font-medium">{`${profile.area}, ${profile.city}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
