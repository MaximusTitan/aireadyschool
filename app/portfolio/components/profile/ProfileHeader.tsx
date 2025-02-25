"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StudentData {
  student_email: string;
  name: string;
  grade: number;
  location: string;
  role: string;
  about: string;
  interests: string[];
  profile_slug?: string;
  profile_url?: string;
}

export default function ProfileHeader() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileUrlCopied, setProfileUrlCopied] = useState(false);

  const [editableData, setEditableData] = useState({
    name: "",
    grade: 0,
    location: "",
  });

  useEffect(() => {
    if (studentData) {
      setEditableData({
        name: studentData.name || "",
        grade: studentData.grade || 0,
        location: studentData.location || "",
      });
    }
  }, [studentData]);

  const generateUniqueSlug = (name: string, email: string) => {
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const emailPart = email.split('@')[0].toLowerCase();
    return `${baseSlug}-${emailPart}`;
  };

  const handleShareProfile = async () => {
    if (!userEmail || !studentData?.name) {
      setError("Profile information is incomplete");
      return;
    }

    try {
      let slug = studentData.profile_slug;
      if (!slug) {
        slug = generateUniqueSlug(studentData.name, userEmail);
      }

      const profileUrl = `https://app.aireadyschool.com/portfolio/${slug}`;

      const { error: updateError } = await supabase
        .from("students")
        .update({
          profile_slug: slug,
          profile_url: profileUrl
        })
        .eq("student_email", userEmail);

      if (updateError) throw updateError;

      setStudentData({
        ...studentData,
        profile_slug: slug,
        profile_url: profileUrl
      });

      await navigator.clipboard.writeText(profileUrl);
      setProfileUrlCopied(true);
      setTimeout(() => setProfileUrlCopied(false), 2000);
    } catch (error) {
      console.error("Error generating profile URL:", error);
      setError("Failed to generate profile URL");
    }
  };

  const handleSaveProfile = async () => {
    if (!userEmail) return;

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: editableData.name,
          grade: editableData.grade,
          location: editableData.location,
        })
        .eq("student_email", userEmail);

      if (error) throw error;

      setStudentData({
        ...studentData!,
        ...editableData,
      });
    } catch (error) {
      setError("Failed to save profile");
      console.error("Error saving profile:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setError("User not authenticated");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!userEmail) return;

      const { data, error } = await supabase
        .from("profile_pictures")
        .select("file_url")
        .eq("student_email", userEmail)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return;
        }
        console.error("Error fetching profile picture:", error);
        return;
      }

      if (data?.file_url) {
        setProfilePictureUrl(data.file_url);
        setSelectedImage(data.file_url);
      }
    };

    fetchProfilePicture();
  }, [userEmail, supabase]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userEmail) return;

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("student_email", userEmail)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newData, error: createError } = await supabase
          .from("students")
          .insert([
            {
              student_email: userEmail,
              name: "",
              grade: 0,
              location: "",
              role: "Student",
              about: "",
              interests: [],
            },
          ])
          .select()
          .single();

        if (createError) {
          setError(createError.message);
          return;
        }

        setStudentData(newData);
        return;
      }

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setStudentData(data);
      }
    };

    fetchStudentData();
  }, [userEmail, supabase]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userEmail) return;

    setIsUploading(true);
    setError(null);

    try {
      if (profilePictureUrl) {
        const oldFilePath = profilePictureUrl.split("/").pop();
        if (oldFilePath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([oldFilePath]);
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${userEmail}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("profile_pictures")
        .upsert({
          student_email: userEmail,
          file_url: publicUrl,
        });

      if (dbError) throw dbError;

      setSelectedImage(publicUrl);
      setProfilePictureUrl(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (!studentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isIncompleteProfile =
    !studentData.name || !studentData.grade || !studentData.location;

  return (
    <div className="flex flex-col md:flex-row items-start justify-between gap-12">
      <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors group">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isUploading}
        />
        {selectedImage || profilePictureUrl ? (
          <Image
            src={selectedImage || profilePictureUrl || ""}
            alt="Profile"
            width={192}
            height={192}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 group-hover:text-gray-600">
              Click to upload your profile picture
            </p>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col">
        {isIncompleteProfile ? (
          <div className="p-4 bg-white border rounded-lg w-full">
            <h3 className="font-semibold mb-4">Complete Your Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={editableData.name}
                  onChange={(e) =>
                    setEditableData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <Input
                  type="number"
                  value={editableData.grade}
                  onChange={(e) =>
                    setEditableData((prev) => ({
                      ...prev,
                      grade: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Enter your grade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <Input
                  value={editableData.location}
                  onChange={(e) =>
                    setEditableData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Enter your location"
                />
              </div>
              <Button onClick={handleSaveProfile}>Save Profile</Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="mb-2 text-2xl font-bold">{studentData.name}</div>
              <div className="mb-2 text-gray-600">
                {studentData.role || "Student"}
              </div>
              <div className="text-gray-600 mb-2">
                Grade {studentData.grade}
                <span className="mx-2">•</span>
                {studentData.location}
              </div>
              <div className="mb-4">
                <span className="px-3 py-1 bg-purple-200 text-purple-800 text-sm font-medium rounded-full">
                  Level 1
                </span>
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleShareProfile}
                  className="flex items-center gap-1"
                >
                  {studentData.profile_url ? "Copy Profile Link" : "Generate Profile Link"}
                </Button>
                {profileUrlCopied && (
                  <span className="ml-2 text-xs text-green-600">
                    Copied to clipboard!
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm text-gray-600">Overall Points</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}