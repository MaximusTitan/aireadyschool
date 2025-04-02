"use client";
import React, { useState, useEffect } from "react";
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
import { supabase, supabaseAdmin } from "@/app/dat/utils/supabaseClient";
import { Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface School {
  id: string;
  school_name: string;
  city: string;
}

interface Group {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  city: string;
  round: string[];
  group: string[];
  schools: string[];
}

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
}: {
  options: School[] | Group[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAll = () => {
    const allIds = options.map((opt) => opt.id);
    onChange(selected.length === options.length ? [] : allIds);
  };

  const handleSelect = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id]
    );
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selected.length === 0
            ? placeholder
            : selected.length === options.length
              ? "All selected"
              : `${selected.length} selected`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <div className="max-h-[300px] overflow-auto rounded-md border bg-white py-1 text-sm">
            <div
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100"
              onClick={handleSelectAll}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selected.length === options.length
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              Select All
            </div>
            <div className="px-1 py-1">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100"
                  onClick={() => handleSelect(option.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {"school_name" in option ? option.school_name : option.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JudgeForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    city: "",
    round: [],
    group: [],
    schools: [],
  });

  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);

  const cities = [
    "ALL",
    "DELHI",
    "RAIPUR",
    "MUMBAI",
    "PUNE",
    "BANGALORE",
    "HYDERABAD",
    "CHENNAI",
    "LUCKNOW",
    "VIZAG",
    "VIJAYAWADA",
    "BHOPAL",
  ];

  const groups: Group[] = [
    { id: "A", name: "Group A (Grade 5-6)" },
    { id: "B", name: "Group B (Grade 7-8)" },
    { id: "C", name: "Group C (Grade 9-10)" },
    { id: "D", name: "Group D (Grade 11-12)" },
  ];

  const rounds: Group[] = [
    { id: "Round 1", name: "Round 1" },
    { id: "Round 2", name: "Round 2" },
    { id: "Finals", name: "Finals" },
  ];

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("dat_school_details")
        .select("id, school_name, city")
        .eq("status", "approved")
        .order("school_name", { ascending: true });

      if (error) throw error;

      // Initialize with empty arrays if data is null
      const schoolsData = data ?? [];
      setSchools(schoolsData);
      setFilteredSchools(schoolsData);
    } catch (error) {
      console.error("Error fetching schools:", error);
      setErrorMsg("Failed to load schools");
      // Initialize with empty arrays on error
      setSchools([]);
      setFilteredSchools([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (value: string) => {
    if (!value) return;

    setFormData((prev) => ({ ...prev, city: value }));

    // Ensure schools array exists before filtering
    const currentSchools = schools || [];

    if (value === "ALL") {
      setFilteredSchools(currentSchools);
    } else {
      setFilteredSchools(
        currentSchools.filter((school) => school.city === value)
      );
    }
    // Reset both selected schools states
    setSelectedSchools([]);
    setFormData((prev) => ({ ...prev, schools: [] }));
  };

  // Add new function to handle school selection
  const handleSchoolSelection = (selected: string[]) => {
    setSelectedSchools(selected);
    setFormData((prev) => ({ ...prev, schools: selected }));
  };

  const handleGroupSelection = (selected: string[]) => {
    setSelectedGroups(selected);
    setFormData((prev) => ({ ...prev, group: selected }));
  };

  const handleRoundSelection = (selected: string[]) => {
    setSelectedRounds(selected);
    setFormData((prev) => ({ ...prev, round: selected }));
  };

  // Add this new function to check if email exists
  const checkEmailExists = async (email: string) => {
    try {
      // First check in auth using admin client to look up the user
      const { data: adminAuthData, error: adminAuthError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (adminAuthError) {
        console.error("Error checking auth users:", adminAuthError);
        return false;
      }

      const existsInAuth = adminAuthData.users.some(
        (user) => user.email === email
      );
      if (existsInAuth) {
        return true;
      }

      // If not in auth, check judge_details table
      const { data: judgeData, error: judgeError } = await supabase
        .from("dat_judge_details")
        .select("email")
        .eq("email", email)
        .single();

      if (judgeError && judgeError.code !== "PGRST116") {
        console.error("Error checking judge details:", judgeError);
      }

      return !!judgeData;
    } catch (error) {
      console.error("Error checking email:", error);
      return false; // Return false instead of throwing error
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Basic validations first
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.city
      ) {
        throw new Error("Please fill in all required fields");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Check if email exists before proceeding with signup
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        throw new Error("This email is already registered");
      }

      // Rest of validations
      if (formData.round.length === 0) {
        throw new Error("Please select at least one round");
      }
      if (formData.group.length === 0) {
        throw new Error("Please select at least one group");
      }
      if (formData.schools.length === 0) {
        throw new Error("Please select at least one school");
      }

      // Now proceed with actual signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "dat_judge", // changed from 'judge'
            name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      // Only proceed with judge_details insert if auth signup was successful
      if (authData.user) {
        const { error: insertError } = await supabase
          .from("dat_judge_details")
          .insert({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            city: formData.city,
            schools: formData.schools,
            round: formData.round,
            groups: formData.group,
          });

        if (insertError) throw insertError;

        alert(
          "Registration successful! Please check your email for verification."
        );
        window.location.reload();
      }
    } catch (error) {
      const supabaseError = error as { message: string };
      setErrorMsg(supabaseError.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSchoolsSection = () => {
    if (isLoading) {
      return <div className="text-center">Loading schools...</div>;
    }

    return (
      <>
        <MultiSelect
          options={filteredSchools}
          selected={selectedSchools}
          onChange={handleSchoolSelection} // Use the new handler
          placeholder={
            !formData.city ? "Select a city first" : "Select schools..."
          }
          disabled={!formData.city}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedSchools.map((schoolId) => {
            const school = schools.find((s) => s.id === schoolId);
            return school ? (
              <Badge key={schoolId} variant="secondary" className="px-2 py-1">
                {school.school_name}
                <button
                  type="button"
                  className="ml-1 hover:text-red-500"
                  onClick={() => {
                    setSelectedSchools((current) =>
                      current.filter((id) => id !== schoolId)
                    );
                  }}
                >
                  ×
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center mb-4 text-rose-600">
          Judge Registration
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

          <div>
            <Label htmlFor="city">City</Label>
            <Select onValueChange={handleCityChange} required>
              <SelectTrigger id="city">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Schools</Label>
            {renderSchoolsSection()}
          </div>

          <div>
            <Label htmlFor="round">Round</Label>
            <MultiSelect
              options={rounds}
              selected={selectedRounds}
              onChange={handleRoundSelection}
              placeholder="Select rounds"
              disabled={false}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRounds.map((roundId) => (
                <Badge key={roundId} variant="secondary" className="px-2 py-1">
                  {rounds.find((r) => r.id === roundId)?.name}
                  <button
                    type="button"
                    className="ml-1 hover:text-red-500"
                    onClick={() => {
                      const newRounds = selectedRounds.filter(
                        (id) => id !== roundId
                      );
                      setSelectedRounds(newRounds);
                      setFormData((prev) => ({
                        ...prev,
                        round: newRounds,
                      }));
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="group">Groups</Label>
            <MultiSelect
              options={groups}
              selected={selectedGroups}
              onChange={handleGroupSelection}
              placeholder="Select groups"
              disabled={false}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedGroups.map((groupId) => (
                <Badge key={groupId} variant="secondary" className="px-2 py-1">
                  {groups.find((g) => g.id === groupId)?.name}
                  <button
                    type="button"
                    className="ml-1 hover:text-red-500"
                    onClick={() => {
                      const newGroups = selectedGroups.filter(
                        (id) => id !== groupId
                      );
                      setSelectedGroups(newGroups);
                      setFormData((prev) => ({
                        ...prev,
                        group: newGroups,
                      }));
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
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

export default JudgeForm;
