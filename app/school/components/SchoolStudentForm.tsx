"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";

const studentFormSchema = z.object({
  email: z.string().email(),
  roll_number: z.string().min(1),
  section_id: z.string().uuid(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface SchoolStudentFormProps {
  schoolId: string;
  sections: { id: string; name: string; grade: string }[];
  onSuccess?: () => void;
}

export default function SchoolStudentForm({
  schoolId,
  sections,
  onSuccess,
}: SchoolStudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
  });

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        options: {
          data: {
            role: "Student",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      // Create user record
      const { error: userError } = await supabase.from("users").insert({
        user_id: authData.user.id,
        site_id: schoolId,
        role_type: "Student",
      });

      if (userError) throw userError;

      // Create student record
      const { error: studentError } = await supabase
        .from("school_students")
        .insert({
          user_id: authData.user.id,
          school_id: schoolId,
          section_id: data.section_id,
          roll_number: data.roll_number,
        });

      if (studentError) throw studentError;

      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to register student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="student@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roll_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roll Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter roll number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="section_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.grade} - {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Student"}
        </Button>
      </form>
    </Form>
  );
}
