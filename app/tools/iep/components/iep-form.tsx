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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  board: z.string().min(2, { message: "Board must be at least 2 characters." }),
  strengths: z
    .string()
    .min(10, { message: "Strengths must be at least 10 characters." }),
  weaknesses: z.string().min(10, {
    message: "Areas for improvement must be at least 10 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface IEPFormProps {
  onSubmit?: (data: FormData) => void;
}

export default function IEPForm({ onSubmit }: IEPFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedIEP, setGeneratedIEP] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      grade: "",
      country: "",
      board: "",
      strengths: "",
      weaknesses: "",
    },
  });

  const steps = [
    { title: "Student Info", fields: ["name", "grade", "country", "board"] },
    { title: "Strengths & Improvements", fields: ["strengths", "weaknesses"] },
    { title: "Generated IEP", fields: [] },
  ];

  async function generateIEP(values: FormData) {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-iep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to generate IEP");
      }

      const result = await response.json();
      setGeneratedIEP(result.content);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error generating IEP:", error);
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
      if (currentStep === 1) {
        const values = form.getValues();
        await generateIEP(values);
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
        <form onSubmit={form.handleSubmit(() => {})} className="space-y-8">
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {["name", "grade", "country", "board"].map((fieldName) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {currentStep === 1 && (
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
          {currentStep === 2 && (
            <IndividualizedEducationPlan
              studentInfo={form.getValues()}
              generatedIEP={generatedIEP}
            />
          )}
          <div className="flex justify-between">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < 2 && (
              <Button type="button" onClick={handleNext} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating IEP...
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
