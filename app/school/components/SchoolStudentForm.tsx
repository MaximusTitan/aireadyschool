"use client";

import { useState, useEffect } from "react";
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
  board_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface SchoolStudentFormProps {
  schoolId: string;
  onSuccess?: () => void;
}

export default function SchoolStudentForm({
  schoolId,
  onSuccess,
}: SchoolStudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      email: "",
      roll_number: "",
      board_id: "",
      grade_id: "",
      section_id: "",
    },
  });

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      const { data } = await supabase
        .from("boards")
        .select("id, name")
        .eq("school_id", schoolId);
      if (data) setBoards(data);
    };
    fetchBoards();
  }, [schoolId, supabase]);

  // When board changes, fetch grades for that board
  const boardChanged = async (board_id: string) => {
    const { data: gradesData } = await supabase
      .from("grades")
      .select("id, name")
      .eq("board_id", board_id);

    // Sort grades numerically
    const sortedGrades = (gradesData || []).sort((a, b) => {
      const aNum = parseInt(a.name.replace("Grade ", ""));
      const bNum = parseInt(b.name.replace("Grade ", ""));
      return aNum - bNum;
    });

    setGrades(sortedGrades);
    form.setValue("board_id", board_id);
    form.setValue("grade_id", "");
    form.setValue("section_id", "");
  };

  // When grade changes, fetch sections for that grade
  const gradeChanged = async (grade_id: string) => {
    const { data: sectionsData } = await supabase
      .from("sections")
      .select("id, name")
      .eq("grade_id", grade_id);

    setSections(
      (sectionsData || []).sort((a, b) => a.name.localeCompare(b.name))
    );
    form.setValue("grade_id", grade_id);
    form.setValue("section_id", "");
  };

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
          grade_id: data.grade_id,
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
          name="board_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board</FormLabel>
              <FormControl>
                <Select onValueChange={boardChanged} value={field.value || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade</FormLabel>
              <FormControl>
                <Select
                  onValueChange={gradeChanged}
                  value={field.value || ""}
                  disabled={!form.getValues("board_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={!form.getValues("grade_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
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
