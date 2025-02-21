"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import SubjectSelector from "./SubjectSelector";
import GradeEditor from "./GradeEditor";
import GradePatternSelector from "./GradePatternSelector";

const schoolFormSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  contact_info: z.object({
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Please enter a valid phone number"),
  }),
  boards: z.array(
    z.object({
      name: z.string().min(2, "Board name must be at least 2 characters"),
      subjects: z.array(z.string()),
      grades: z.array(
        z.object({
          name: z.string(),
          sections: z.array(z.object({ name: z.string() })),
        })
      ),
    })
  ),
});

type SchoolFormValues = z.infer<typeof schoolFormSchema>;

export default function SchoolOnboarding() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      address: "",
      contact_info: {
        email: "",
        phone: "",
      },
      boards: [{ name: "", subjects: [], grades: [] }],
    },
  });

  const onSubmit = async (data: SchoolFormValues) => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      // Generate a site_id from school name
      const site_id = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");

      // Insert school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: data.name,
          site_id,
          address: data.address,
          contact_info: data.contact_info,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Update user's site_id
      await supabase.from("users").update({ site_id }).eq("user_id", user.id);

      // Insert boards with their grades, sections, and subjects
      for (const board of data.boards) {
        // Create board
        const { data: boardData } = await supabase
          .from("boards")
          .insert({
            school_id: site_id,
            name: board.name,
          })
          .select()
          .single();

        if (boardData) {
          // Insert subjects
          const subjectPromises = board.subjects.map((subject) =>
            supabase.from("subjects").insert({
              board_id: boardData.id,
              name: subject,
            })
          );

          // Insert grades and their sections
          const gradePromises = board.grades.map(async (grade) => {
            const { data: gradeData } = await supabase
              .from("grades")
              .insert({
                board_id: boardData.id,
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
        }
      }

      // Refresh the page to show the school dashboard
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create school. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">Set Up Your School</h1>
          <p className="text-sm text-muted-foreground">
            Please provide your school details to get started
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic School Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter school address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_info.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="school@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_info.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Boards Configuration */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Boards</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentBoards = form.getValues("boards");
                      form.setValue("boards", [
                        ...currentBoards,
                        { name: "", subjects: [], grades: [] },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Board
                  </Button>
                </div>

                {form.watch("boards").map((_, boardIndex) => (
                  <div
                    key={boardIndex}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`boards.${boardIndex}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Board Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="CBSE, ICSE, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {boardIndex > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="mt-7"
                          onClick={() => {
                            const currentBoards = form.getValues("boards");
                            form.setValue(
                              "boards",
                              currentBoards.filter((_, i) => i !== boardIndex)
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Subjects */}
                    <FormField
                      control={form.control}
                      name={`boards.${boardIndex}.subjects`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subjects</FormLabel>
                          <FormControl>
                            <SubjectSelector
                              selected={field.value}
                              onSelect={(subject) =>
                                field.onChange([...field.value, subject])
                              }
                              onDeselect={(subject) =>
                                field.onChange(
                                  field.value.filter((s) => s !== subject)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Grades and Sections */}
                    <FormField
                      control={form.control}
                      name={`boards.${boardIndex}.grades`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grades & Sections</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <GradePatternSelector
                                onSelect={(grades) => field.onChange(grades)}
                              />
                              <GradeEditor
                                grades={field.value}
                                onChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
