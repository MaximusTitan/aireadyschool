"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { createTeacher } from "@/app/actions/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolTeacherBulkImport from "./SchoolTeacherBulkImport";

const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  assignments: z
    .array(
      z.object({
        board_id: z.string().uuid(),
        grade_id: z.string().uuid(),
        section_id: z.string().uuid(),
        subject_id: z.string().uuid(),
      })
    )
    .min(1, "At least one assignment is required"),
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
  const [assignmentGrades, setAssignmentGrades] = useState<{
    [key: number]: { id: string; name: string }[];
  }>({});
  const [assignmentSubjects, setAssignmentSubjects] = useState<{
    [key: number]: { id: string; name: string }[];
  }>({});
  const [assignmentSections, setAssignmentSections] = useState<{
    [key: number]: { id: string; name: string }[];
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      assignments: [
        { board_id: "", grade_id: "", section_id: "", subject_id: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignments",
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

  // Assignment board changed: fetch corresponding grades and subjects.
  const boardChangedAssignment = async (index: number, board_id: string) => {
    const { data: gradesData } = await supabase
      .from("grades")
      .select("id, name")
      .eq("board_id", board_id);
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("board_id", board_id);
    const sortedGrades = (gradesData || []).sort((a, b) => {
      const aNum = parseInt(a.name.replace("Grade ", ""));
      const bNum = parseInt(b.name.replace("Grade ", ""));
      return aNum - bNum;
    });
    setAssignmentGrades((prev) => ({ ...prev, [index]: sortedGrades }));
    setAssignmentSubjects((prev) => ({ ...prev, [index]: subjectsData || [] }));
    // Reset dependent fields for this assignment.
    form.setValue(`assignments.${index}.board_id`, board_id);
    form.setValue(`assignments.${index}.grade_id`, "");
    form.setValue(`assignments.${index}.section_id`, "");
    form.setValue(`assignments.${index}.subject_id`, "");
  };

  // Assignment grade changed: fetch sections.
  const gradeChangedAssignment = async (index: number, grade_id: string) => {
    const { data: sectionsData } = await supabase
      .from("sections")
      .select("id, name")
      .eq("grade_id", grade_id);
    setAssignmentSections((prev) => ({
      ...prev,
      [index]: (sectionsData || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
    form.setValue(`assignments.${index}.grade_id`, grade_id);
    form.setValue(`assignments.${index}.section_id`, "");
  };

  const onSubmit = async (data: TeacherFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createTeacher({
        name: data.name,
        email: data.email,
        password: data.password,
        schoolId,
        assignments: data.assignments,
      });

      if (!result.success) throw result.error;

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
    <Tabs defaultValue="single">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">Single Teacher</TabsTrigger>
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
                    Note: Teachers can change their password after signing in
                    for the first time.
                  </p>
                </FormItem>
              )}
            />
            {/* Dynamic Assignment fields */}
            {fields.map((field, index) => (
              <div key={field.id} className="border p-4 mb-4">
                <div className="flex justify-between">
                  <h4>Assignment {index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`assignments.${index}.board_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            boardChangedAssignment(index, value)
                          }
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
                  name={`assignments.${index}.grade_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            gradeChangedAssignment(index, value)
                          }
                          value={field.value || ""}
                          disabled={
                            !form.getValues(`assignments.${index}.board_id`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {(assignmentGrades[index] || []).map((g) => (
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
                  name={`assignments.${index}.section_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {(assignmentSections[index] || []).map((s) => (
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
                <FormField
                  control={form.control}
                  name={`assignments.${index}.subject_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {(assignmentSubjects[index] || []).map((s) => (
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
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                append({
                  board_id: "",
                  grade_id: "",
                  section_id: "",
                  subject_id: "",
                })
              }
            >
              Add Assignment
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Teacher"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="bulk">
        <SchoolTeacherBulkImport schoolId={schoolId} onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
}
