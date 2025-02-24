"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { COMMON_BOARDS } from "../constants/education";
import SubjectSelector from "./SubjectSelector";
import GradeEditor from "./GradeEditor";
import GradePatternSelector from "./GradePatternSelector";

const boardFormSchema = z.object({
  name: z.string().min(2, "Board name must be at least 2 characters"),
  grades: z.array(
    z.object({
      name: z.string(),
      sections: z.array(z.object({ name: z.string() })),
    })
  ),
});

type BoardFormValues = z.infer<typeof boardFormSchema>;

interface BoardFormProps {
  schoolId: string;
  onSuccess?: () => void;
}

export default function BoardForm({ schoolId, onSuccess }: BoardFormProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<BoardFormValues>({
    resolver: zodResolver(boardFormSchema),
    defaultValues: {
      name: "",
      grades: [],
    },
  });

  const onSubmit = async (data: BoardFormValues) => {
    setIsSubmitting(true);
    try {
      // Insert board
      const { data: board } = await supabase
        .from("boards")
        .insert({
          school_id: schoolId,
          name: data.name,
        })
        .select()
        .single();

      if (!board) throw new Error("Failed to create board");

      // Insert subjects
      const subjectPromises = selectedSubjects.map((name) =>
        supabase.from("subjects").insert({
          board_id: board.id,
          name,
        })
      );

      // Insert grades and sections
      const gradePromises = data.grades.map(async (grade) => {
        const { data: gradeData } = await supabase
          .from("grades")
          .insert({
            board_id: board.id,
            name: grade.name,
          })
          .select()
          .single();

        if (gradeData) {
          const sectionPromises = grade.sections.map((section) =>
            supabase.from("sections").insert({
              grade_id: gradeData.id,
              name: section.name,
            })
          );
          await Promise.all(sectionPromises);
        }
      });

      await Promise.all([...subjectPromises, ...gradePromises]);
      onSuccess?.();
      form.reset();
      setSelectedSubjects([]);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create board. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board Name</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} placeholder="Enter board name" />
                  <select
                    className="w-48 border rounded"
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option value="">Common Boards</option>
                    {COMMON_BOARDS.map((board) => (
                      <option key={board} value={board}>
                        {board}
                      </option>
                    ))}
                  </select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h4 className="font-medium">Subjects</h4>
          <SubjectSelector
            selected={selectedSubjects}
            onSelect={(subject) =>
              setSelectedSubjects([...selectedSubjects, subject])
            }
            onDeselect={(subject) =>
              setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))
            }
          />
        </div>

        <FormField
          control={form.control}
          name="grades"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <GradePatternSelector
                  onSelect={(grades) => field.onChange(grades)}
                />
                <GradeEditor grades={field.value} onChange={field.onChange} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Board"}
        </Button>
      </form>
    </Form>
  );
}
