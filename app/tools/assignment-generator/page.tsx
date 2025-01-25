"use client";

import type React from "react";
import { useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AssignmentForm } from "./components/AssignmentForm";
import { AssignmentDisplay } from "./components/AssignmentDisplay";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  gradeLevel: z.string().min(1, "Grade level is required"),
  assignmentType: z.string().min(1, "Assignment type is required"),
  textInput: z.string().min(1, "Topic is required"),
  learningObjective: z.string().min(1, "Learning objective is required"),
  collaboration: z
    .enum(["Yes", "No"])
    .refine((val) => ["Yes", "No"].includes(val), {
      message: "Collaboration must be either 'Yes' or 'No'",
    }),
  dueDate: z
    .number()
    .min(1, "Number of days is required")
    .max(365, "Maximum 365 days"),
});

type FormData = z.infer<typeof formSchema>;

const sendAssignmentRequest = async function (
  prompt: string,
  retries = 3
): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch("/api/generate-assignment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate assignment");
    }
    const data = await response.json();

    if (!data.title || !data.content) {
      if (retries > 0) {
        console.log("Invalid response format, retrying...");
        return sendAssignmentRequest(prompt, retries - 1);
      } else {
        throw new Error("Failed to generate a response in the valid format");
      }
    }
    return {
      title: data.title,
      content: data.content,
    };
  } catch (error) {
    // Handle errors and retry if possible
    if (retries > 0) {
      console.log("Error generating assignment, retrying...");
      return sendAssignmentRequest(prompt, retries - 1);
    } else {
      throw error;
    }
  }
};

type Assignment = { title: string; content: string };

async function generateAssignment(
  gradeLevel: string,
  assignmentType: string,
  topic: string,
  learningObjective: string,
  collaboration: string,
  dueDate: number
): Promise<Assignment> {
  const timeLeftStr = `${dueDate} day${dueDate > 1 ? "s" : ""}`;

  const prompt = `Generate an assignment topic for a ${gradeLevel} grade 
  with an assignment type of ${assignmentType} focusing on ${topic}. 
  The learning objective is to ${learningObjective}. Collaboration is ${
    collaboration === "Yes" ? "allowed" : "not allowed"
  }. 
  This assignment would be due in ${timeLeftStr}. 
  Please decide the complexity of the assignment based on the time left until the due date.`;

  return await sendAssignmentRequest(prompt);
}

const AssignmentGenerator: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const scrollToOutput = () => {
    outputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formMethods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeLevel: "",
      assignmentType: "",
      textInput: "",
      learningObjective: "",
      collaboration: "No",
      dueDate: 1,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const results = await generateAssignment(
        data.gradeLevel,
        data.assignmentType,
        data.textInput,
        data.learningObjective,
        data.collaboration,
        data.dueDate
      );
      setAssignment(results);
      toast({
        title: "Assignment Generated",
        description: "Your assignment has been created successfully.",
      });
      setTimeout(scrollToOutput, 100); // Small delay to ensure content is rendered
    } catch (error) {
      console.error("Error generating assignments:", error);
      toast({
        title: "Error",
        description: "Failed to generate assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
        <AssignmentForm isLoading={isLoading} />
        <div ref={outputRef}>
          <AssignmentDisplay assignment={assignment} isLoading={isLoading} />
        </div>
      </form>
    </FormProvider>
  );
};

export default AssignmentGenerator;
