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
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createStudent } from "@/app/actions/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolStudentBulkImport from "./SchoolStudentBulkImport";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
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
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
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
      const result = await createStudent({
        name: data.name,
        email: data.email,
        password: data.password,
        schoolId,
        boardId: data.board_id,
        gradeId: data.grade_id,
        sectionId: data.section_id,
        rollNumber: data.roll_number,
      });

      if (!result.success) throw result.error;

      toast({
        title: "Success",
        description: "Student registered successfully",
      });
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register student. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="single">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">Single Student</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    Note: Students can change their password after signing in
                    for the first time.
                  </p>
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
                    <Select
                      onValueChange={boardChanged}
                      value={field.value || ""}
                    >
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
      </TabsContent>

      <TabsContent value="bulk">
        <SchoolStudentBulkImport schoolId={schoolId} onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
}
