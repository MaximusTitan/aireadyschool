"use client";

import { useState, useRef, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AssignmentForm } from "./components/AssignmentForm";
import { AssignmentDisplay } from "./components/AssignmentDisplay";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client"; // Import supersbase client for user session
import { AssignmentHistory } from "./components/AssignmentHistory";

const formSchema = z.object({
  country: z.string().min(1, "Country is required"),
  board: z.string().min(1, "Educational board is required"),
  subject: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  assignmentType: z.string().min(1, "Assignment type is required"),
  textInput: z.string().min(1, "Topic is required"),
  learningObjective: z.string().min(1, "Learning objective is required"),
  collaboration: z.enum(["Yes", "No"]),
  dueDate: z
    .number()
    .min(1, "Number of days is required")
    .max(365, "Maximum 365 days"),
});

type FormData = z.infer<typeof formSchema>;

// Update to accept a payload of form inputs
const sendAssignmentRequest = async function (
  payload: any,
  retries = 3
): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch("/api/generate-assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate assignment");
    }
    const data = await response.json();

    if (!data.title || !data.content) {
      if (retries > 0) {
        console.log("Invalid response format, retrying...");
        return sendAssignmentRequest(payload, retries - 1);
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
      return sendAssignmentRequest(payload, retries - 1);
    } else {
      throw error;
    }
  }
};

type Assignment = { title: string; content: string };

async function generateAssignment(
  data: FormData,
  userEmail: string
): Promise<Assignment> {
  // Create the prompt with all available data
  const timeLeftStr = `${data.dueDate} day${data.dueDate > 1 ? "s" : ""}`;
  const prompt = `Generate an assignment for ${data.country}'s ${data.board} board, 
  subject ${data.subject}, ${data.gradeLevel} grade level, 
  with an assignment type of ${data.assignmentType} focusing on ${data.textInput}. 
  The learning objective is to ${data.learningObjective}. Collaboration is ${
    data.collaboration === "Yes" ? "allowed" : "not allowed"
  }. 
  This assignment would be due in ${timeLeftStr}.`;

  // Send all data to API but only relevant fields will be saved to database
  return await sendAssignmentRequest({
    prompt,
    email: userEmail,
    country: data.country,
    board: data.board,
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    assignmentType: data.assignmentType,
    textInput: data.textInput,
    learningObjective: data.learningObjective,
    collaboration: data.collaboration,
    dueDate: data.dueDate,
  });
}

const AssignmentGenerator: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);

  // Fetch current user email from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "guest@example.com");
      }
    };
    fetchUser();
  }, []);

  const scrollToOutput = () => {
    outputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formMethods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: "",
      board: "",
      subject: "",
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
        data,
        userEmail // pass the email to the generator function
      );
      setAssignment(results);
      toast({
        title: "Assignment Generated",
        description: "Your assignment has been created successfully.",
      });
      // Scroll view to the generated content area after creation
      setTimeout(() => scrollToOutput(), 100);
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
          {/* Render AssignmentHistory only when a valid userEmail is set */}
          {userEmail && (
            <AssignmentHistory
              userEmail={userEmail}
              onSelectAssignment={(selected) => {
                setAssignment(selected);
                scrollToOutput(); // Scroll to the content textarea after selection
              }}
            />
          )}
        </div>
      </form>
    </FormProvider>
  );
};

export default AssignmentGenerator;
