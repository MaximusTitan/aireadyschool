"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import crypto from "crypto";
import { supabase, supabaseAdmin } from "@/app/dat/utils/supabaseClient";

// Add this type near the top of the file
type CustomError = {
  message: string;
};

const AdminForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hashPassword = (password: string): string => {
    // Simple hashing for demonstration - in production use more secure methods
    return crypto.createHash("sha256").update(password).digest("hex");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error("Please fill in all required fields");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Use regular auth signup instead of admin auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "dat_admin",
            name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert into dat_admin_details table
        const hashedPassword = hashPassword(formData.password);
        const { error: adminDetailsError } = await supabaseAdmin
          .from("dat_admin_details")
          .insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            password_hash: hashedPassword,
          });

        if (adminDetailsError) throw adminDetailsError;

        alert(
          "Admin registration successful! Please check your email for verification."
        );
        window.location.href = "/";
      }
    } catch (error: unknown) {
      if (
        error instanceof Error ||
        (error && typeof error === "object" && "message" in error)
      ) {
        setErrorMsg((error as CustomError).message);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center mb-4 text-rose-600">
          Admin Registration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}

          <Button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminForm;
