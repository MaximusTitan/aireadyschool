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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";

const assignmentFormSchema = z.object({
  teacher_id: z.string().uuid(),
  section_id: z.string().uuid(),
  subject_id: z.string().uuid(),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface Teacher {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  grade: string;
}

interface Subject {
  id: string;
  name: string;
}

interface TeacherAssignmentFormProps {
  teachers: Teacher[];
  sections: Section[];
  subjects: Subject[];
  onSuccess?: () => void;
}

export default function TeacherAssignmentForm({
  teachers,
  sections,
  subjects,
  onSuccess,
}: TeacherAssignmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
  });

  const onSubmit = async (data: AssignmentFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("teacher_assignments").insert({
        teacher_id: data.teacher_id,
        section_id: data.section_id,
        subject_id: data.subject_id,
      });

      if (error) throw error;

      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="teacher_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teacher</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Assigning..." : "Assign Teacher"}
        </Button>
      </form>
    </Form>
  );
}
