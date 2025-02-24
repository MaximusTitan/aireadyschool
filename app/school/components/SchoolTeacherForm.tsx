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
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const teacherFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  board_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid(),
  subject_id: z.string().uuid(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface SchoolTeacherFormProps {
  schoolId: string;
  onSuccess?: () => void;
}

export default function SchoolTeacherForm({
  schoolId,
  onSuccess,
}: SchoolTeacherFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: "",
      password: "",
      board_id: "",
      grade_id: "",
      section_id: "",
      subject_id: "",
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

  // When board changes, fetch grades and subjects for that board
  const boardChanged = async (board_id: string) => {
    const { data: gradesData } = await supabase
      .from("grades")
      .select("id, name")
      .eq("board_id", board_id);

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("board_id", board_id);

    // Sort grades numerically
    const sortedGrades = (gradesData || []).sort((a, b) => {
      const aNum = parseInt(a.name.replace("Grade ", ""));
      const bNum = parseInt(b.name.replace("Grade ", ""));
      return aNum - bNum;
    });

    setGrades(sortedGrades);
    setSubjects(subjectsData || []);
    form.setValue("board_id", board_id);
    form.setValue("grade_id", "");
    form.setValue("section_id", "");
    form.setValue("subject_id", "");
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

  const onSubmit = async (data: TeacherFormValues) => {
    setIsSubmitting(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "Teacher",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      // Create user record
      const { error: userError } = await supabase.from("users").insert({
        user_id: authData.user.id,
        site_id: schoolId,
        role_type: "Teacher",
        email: data.email,
        image_credits: 25,
        video_credits: 5,
      });

      if (userError) throw userError;

      // Create teacher record and get the generated id
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .insert({
          user_id: authData.user.id,
          school_id: schoolId,
        })
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Create teacher assignment record using the teacher.id
      const { error: assignError } = await supabase
        .from("teacher_assignments")
        .insert({
          teacher_id: teacherData.id, // Use the teacher.id instead of user_id
          board_id: data.board_id,
          grade_id: data.grade_id,
          section_id: data.section_id,
          subject_id: data.subject_id,
        });

      if (assignError) throw assignError;

      toast({
        title: "Success",
        description: "Teacher registered successfully",
      });
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register teacher. Please try again.",
      });
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
                  placeholder="teacher@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Note: Teachers can change their password after signing in for
                the first time.
              </p>
            </FormItem>
          )}
        />
        {/* Board selector */}
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
        {/* Grade selector */}
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
        {/* Section selector */}
        <FormField
          control={form.control}
          name="section_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
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
        {/* Subject selector */}
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
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
          {isSubmitting ? "Registering..." : "Register Teacher"}
        </Button>
      </form>
    </Form>
  );
}
