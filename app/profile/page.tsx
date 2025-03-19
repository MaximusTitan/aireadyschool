"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Profile() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    role: "",
    grade: "",
    board: "",
    country: "",
  });
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Get student details if role is Student
      let studentDetails = null;
      if (user.user_metadata?.role === "Student") {
        const { data: details } = await supabase
          .from("student_details")
          .select("*")
          .eq("id", user.id)
          .single();
        studentDetails = details;
      }

      setUserData({
        email: user.email || "",
        fullName: user.user_metadata?.name || "",
        role: user.user_metadata?.role || "User",
        grade: studentDetails?.grade || "",
        board: studentDetails?.board || "",
        country: studentDetails?.country || "",
      });
    } catch (error) {
      toast.error("Error loading user data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowProfileDialog(true);
  };

  const updateProfile = async () => {
    setShowProfileDialog(false);
    setUpdating(true);

    try {
      // Update auth profile
      const { error: profileError } = await supabase.auth.updateUser({
        data: { name: userData.fullName },
      });
      if (profileError) throw profileError;

      // Update student details if role is Student
      if (userData.role === "Student") {
        const { error: studentError } = await supabase
          .from("student_details")
          .upsert({
            id: (await supabase.auth.getUser()).data.user?.id,
            grade: userData.grade,
            board: userData.board,
            country: userData.country,
          });
        if (studentError) throw studentError;
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Error updating profile");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setShowPasswordDialog(true);
  };

  const handlePasswordReset = async () => {
    setShowPasswordDialog(false);
    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.password,
      });

      if (error) throw error;

      setPasswords({ password: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error("Error updating password");
      console.error(error);
    } finally {
      setChangingPassword(false);
    }
  };

  const renderStudentFields = () => {
    if (userData.role !== "Student") return null;

    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="grade">Grade</Label>
          <Select
            value={userData.grade}
            onValueChange={(value) =>
              setUserData({ ...userData, grade: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {["6th", "7th", "8th", "9th", "10th", "11th", "12th"].map(
                (grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="board">Education Board</Label>
          <Input
            id="board"
            value={userData.board}
            onChange={(e) =>
              setUserData({ ...userData, board: e.target.value })
            }
            placeholder="e.g., CBSE, ICSE, IB"
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={userData.country}
            onChange={(e) =>
              setUserData({ ...userData, country: e.target.value })
            }
            placeholder="Your country"
            className="bg-white"
          />
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-3xl space-y-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Profile Settings</h1>
          <p className="text-muted-foreground text-lg">
            Manage your account details and preferences
          </p>
        </div>

        <div className="space-y-8">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled
                    className="bg-neutral-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userData.fullName}
                    onChange={(e) =>
                      setUserData({ ...userData, fullName: e.target.value })
                    }
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={userData.role}
                    disabled
                    className="bg-neutral-100"
                  />
                </div>

                {renderStudentFields()}

                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full h-11 text-base font-semibold bg-rose-500 hover:bg-rose-600"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2">
            <CardHeader className="border-b">
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={passwords.password}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          password: e.target.value,
                        })
                      }
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full h-11 text-base font-semibold bg-rose-500 hover:bg-rose-600"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update your profile information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={updateProfile}
              className="bg-rose-500 hover:bg-rose-600"
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update your password? You'll need to use
              the new password next time you log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordReset}
              className="bg-rose-500 hover:bg-rose-600"
            >
              Update Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
