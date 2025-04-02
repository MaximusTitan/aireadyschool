"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Eye, EyeOff } from "lucide-react"; // added icon imports

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Get user role from metadata
      const role = signInData.user?.user_metadata?.role;

      // Route based on role
      switch (role) {
        case "dat_admin":
          router.push("/dat/admin");
          break;
        case "dat_judge":
          router.push("/dat/judge");
          break;
        case "dat_school":
          // Check school approval status
          const { data: schoolData } = await supabase
            .from("dat_school_details")
            .select("status")
            .eq("email", email)
            .maybeSingle();

          if (schoolData?.status === "pending") {
            router.push("/dat/school/pending");
          } else if (schoolData?.status === "rejected") {
            setError(
              "Your school registration has been rejected. Please contact support."
            );
          } else {
            router.push("/dat/school");
          }
          break;
        case "dat_student":
          router.push("/dat/student");
          break;
        default:
          setError("Invalid user role");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F7F1EF" }}
    >
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-rose-600">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pr-10" // added padding for icon
              />
              <span
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center cursor-pointer select-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
              </span>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <div>
            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2">⏳</div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
