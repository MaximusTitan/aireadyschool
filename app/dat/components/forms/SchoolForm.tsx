"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Eye, EyeOff } from "lucide-react"; // import icons for toggle

const SchoolForm: React.FC = () => {
  const [formData, setFormData] = useState({
    contactName: "",
    designation: "",
    email: "",
    phone: "",
    schoolName: "",
    websiteAddress: "",
    educationBoard: "",
    computers: "",
    totalChildren: "",
    area: "",
    city: "",
    password: "", // Added password field
  });
  const [errorMsg, setErrorMsg] = useState(""); // Added error message state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // new state for toggling password view

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (value: string) => {
    setFormData({ ...formData, city: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // New: Check duplication via API
      const res = await fetch("/api/dat/checkEmailDuplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const { exists } = await res.json();
      if (exists) {
        setErrorMsg("Email already exists");
        return;
      }

      // Prepare school data and include the password
      const schoolData = {
        contact_name: formData.contactName,
        designation: formData.designation,
        email: formData.email,
        phone: formData.phone,
        school_name: formData.schoolName,
        website_address: formData.websiteAddress,
        education_board: formData.educationBoard,
        computers: formData.computers,
        total_children: formData.totalChildren,
        area: formData.area,
        city: formData.city,
        password: formData.password, // save the password
      };

      // First, insert into school_details
      const { error: insertError } = await supabase
        .from("dat_school_details")
        .insert(schoolData);
      if (insertError) {
        setErrorMsg(insertError.message);
        return;
      }

      // Only if the school_details insertion succeeded, proceed with auth signUp
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.contactName,
            phone: formData.phone,
            role: "dat_school", // added role for school user
          },
        },
      });
      if (authError) {
        setErrorMsg(authError.message);
        return;
      }

      // Send welcome email with complete school details
      const emailRes = await fetch("/api/dat/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.contactName,
          schoolName: formData.schoolName,
          phone: formData.phone,
          designation: formData.designation,
          websiteAddress: formData.websiteAddress,
          educationBoard: formData.educationBoard,
          computers: formData.computers,
          totalChildren: formData.totalChildren,
          area: formData.area,
          city: formData.city,
        }),
      });

      if (!emailRes.ok) {
        console.error("Failed to send welcome email");
      }

      alert(
        "Registration successful! Please check your email for verification and welcome message."
      );
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4 text-rose-600">
            School Registration
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Enter school details to create a new account
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contactName">Name of the Contact Person</Label>
              <Input
                id="contactName"
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                type="text"
                name="designation"
                value={formData.designation}
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
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="websiteAddress">Website Address</Label>
              <Input
                id="websiteAddress"
                type="text"
                name="websiteAddress"
                value={formData.websiteAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="educationBoard">Education Board</Label>
              <Input
                id="educationBoard"
                type="text"
                name="educationBoard"
                value={formData.educationBoard}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="computers">
                Number of Working Computers in Lab
              </Label>
              <Input
                id="computers"
                type="text"
                name="computers"
                value={formData.computers}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="totalChildren">
                Total Children in 5-12 Grades
              </Label>
              <Input
                id="totalChildren"
                type="text"
                name="totalChildren"
                value={formData.totalChildren}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Select onValueChange={handleCityChange}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELHI">DELHI</SelectItem>
                  <SelectItem value="RAIPUR">RAIPUR</SelectItem>
                  <SelectItem value="MUMBAI">MUMBAI</SelectItem>
                  <SelectItem value="PUNE">PUNE</SelectItem>
                  <SelectItem value="BANGALORE">BANGALORE</SelectItem>
                  <SelectItem value="HYDERABAD">HYDERABAD</SelectItem>
                  <SelectItem value="CHENNAI">CHENNAI</SelectItem>
                  <SelectItem value="LUCKNOW">LUCKNOW</SelectItem>
                  <SelectItem value="VIZAG">VIZAG</SelectItem>
                  <SelectItem value="VIJAYAWADA">VIJAYAWADA</SelectItem>
                  <SelectItem value="BHOPAL">BHOPAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}
            <div>
              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">⏳</div>
                    Submitting...
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SchoolForm;
