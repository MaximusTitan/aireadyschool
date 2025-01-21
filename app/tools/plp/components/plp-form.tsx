"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Stepper } from "./stepper";
import { IndividualizedEducationPlan } from "./IndividualizedEducationPlan";
import type { PLPData } from "../types/plp";
import { DropdownMenuCheckboxes } from "./DropdownMenuCheckboxes"; // Add this import

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  strengths: z
    .string()
    .min(10, { message: "Strengths must be at least 10 characters." }),
  weaknesses: z.string().min(10, {
    message: "Areas for improvement must be at least 10 characters.",
  }),
  disabilities: z
    .string()
    .min(2, { message: "Please specify any disabilities." }),
  additionalNotes: z.string().optional(),
  // New general fields
  age: z.string().min(1, { message: "Age is required" }), // Changed from z.coerce.number()
  gender: z.string().min(1, { message: "Gender is required." }),
  nationality: z.string().min(2, { message: "Nationality is required." }),
  grade: z.string().min(1, { message: "Grade is required." }), // Added grade
  board: z.string().min(1, { message: "Board is required." }), // Added board
  // Subject Specific Fields
  topic: z.string().min(1, { message: "Topic is required." }),
  otherInformation: z.string().optional(),
  goal: z.string().min(1, { message: "Goal is required." }),
  // ...cognitive and knowledge parameters...
});

type FormData = z.infer<typeof formSchema>;

interface PLPFormProps {
  onSubmit?: (data: FormData) => void;
}

export default function PLPForm({ onSubmit }: PLPFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedPLP, setGeneratedPLP] = useState<PLPData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      country: "",
      strengths: "",
      weaknesses: "",
      disabilities: "",
      additionalNotes: "",
      age: "", // This is now correct as a string
      gender: "",
      nationality: "",
      grade: "", // Added grade default
      board: "", // Added board default
      topic: "",
      otherInformation: "",
      goal: "",
    },
  });

  const steps = [
    { title: "Student Info", fields: ["name", "country", "grade", "board"] }, // Updated fields
    {
      title: "Subject Specific Information",
      fields: [
        "age",
        "gender",
        "nationality",
        "comprehension",
        "understandsInstructions",
        "graspsNewConcepts",
        "retainsInformation",
        "attention",
        "focusDuration",
        "taskCompletion",
        "followsRoutines",
        "participation",
        "classEngagement",
        "asksQuestions",
        "groupWork",
        "mathematicsScore",
        "numberSense",
        "problemSolving",
        "mathematicalReasoning",
        "calculationAccuracy",
        "geometrySkills",
        "scienceScore",
        "scientificInquiry",
        "experimentalSkills",
        "dataInterpretation",
        "scientificConcepts",
        "labWork",
        "languagesScore",
        "readingComprehension",
        "writingSkills",
        "grammarUsage",
        "vocabulary",
        "verbalExpression",
        "socialStudiesScore",
        "historicalUnderstanding",
        "geographicAwareness",
        "culturalComprehension",
        "currentEventsKnowledge",
        "analysisOfSocialIssues",
        "artCreativeSkillsScore",
        "creativeExpression",
        "technicalSkills",
        "visualUnderstanding",
        "designThinking",
        "topic",
        "otherInformation",
        "goal",
      ],
    },
    { title: "Strengths & Improvements", fields: ["strengths", "weaknesses"] },
    { title: "Personal Context", fields: ["disabilities", "additionalNotes"] },
    { title: "Generated PLP", fields: [] },
  ];

  async function generatePLP(values: FormData) {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // Ensure all form data is sent
      });

      if (!response.ok) {
        throw new Error("Failed to generate PLP");
      }

      const result = await response.json();
      setGeneratedPLP(result.plp);
      setCurrentStep(4); // Move to the "Generated PLP" step
    } catch (error) {
      console.error("Error generating PLP:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleNext = async () => {
    const currentStepFields = steps[currentStep].fields as Array<
      keyof FormData
    >;
    const isValid = await form.trigger(currentStepFields);
    if (isValid) {
      if (currentStep === 3) {
        // Changed from 4 to 3
        const values = form.getValues();
        await generatePLP(values);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Stepper steps={steps} currentStep={currentStep} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
          {" "}
          {/* Updated onSubmit */}
          {/* Existing Steps */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {["name", "country", "grade", "board"].map(
                    (
                      fieldName // Updated fields
                    ) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {fieldName.charAt(0).toUpperCase() +
                                fieldName.slice(1)}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Enter ${fieldName}`}
                                {...field}
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Specific Information</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">General Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* General Information Fields */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            pattern="[0-9]*"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Repeat for gender, nationality */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Gender"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Nationality"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="font-semibold mt-4 mb-2">
                  Cognitive Parameters
                </h3>
                <DropdownMenuCheckboxes
                  onSelect={(selected) => {
                    // Handle selected cognitive parameters
                  }}
                />
                {/* Render score inputs based on selected cognitive parameters */}
                {/* ...existing code... */}

                <h3 className="font-semibold mt-4 mb-2">
                  Knowledge Parameters
                </h3>
                {/* Repeat similar structure for each subject */}
                {/* ...existing code... */}

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherInformation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Information</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal</FormLabel>
                      <FormControl>
                        <Textarea {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Strengths & Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["strengths", "weaknesses"].map((fieldName) => (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {fieldName === "strengths"
                              ? "Strengths"
                              : "Areas for Improvement"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                fieldName === "strengths"
                                  ? "He is smart and has a good grasping power. He is good in Numerical calculations."
                                  : "Does not submit his assignments despite repeated reminders. He struggles in algebra and word problems."
                              }
                              className="min-h-[100px]"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="disabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disabilities</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any disabilities"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional personal context"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          {currentStep === 4 && generatedPLP && (
            <IndividualizedEducationPlan
              studentInfo={form.getValues()}
              generatedPLP={generatedPLP}
            />
          )}
          <div className="flex justify-between">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < 4 && (
              <Button
                type={currentStep === 3 ? "submit" : "button"} // Changed type to "submit" on step 3
                onClick={currentStep !== 3 ? handleNext : undefined}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PLP...
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
