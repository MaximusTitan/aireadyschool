"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import ReactMarkdown from "react-markdown";

// Define formSchema within the same file
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  syllabus: z
    .string()
    .min(2, { message: "Syllabus must be at least 2 characters." }),
  strengths: z
    .string()
    .min(10, { message: "Strengths must be at least 10 characters." }),
  weaknesses: z.string().min(10, {
    message: "Areas for improvement must be at least 10 characters.",
  }),
});

// Define IEPFormProps within the same file
interface IEPFormProps {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
}

export default function IEPForm({ onSubmit }: IEPFormProps) {
  const [loading, setLoading] = useState(false);
  const [generatedIEP, setGeneratedIEP] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      grade: "",
      country: "",
      syllabus: "",
      strengths: "",
      weaknesses: "",
    },
  });

  async function onSubmitHandler(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const response = await fetch("/api/generate-iep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

    onSubmit?.(values);
  }

  const steps = [
    { title: "Student Info", fields: ["name", "grade", "country", "syllabus"] },
    { title: "Strengths & Improvements", fields: ["strengths", "weaknesses"] },
    { title: "Generated IEP", fields: [] },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Stepper steps={steps} currentStep={currentStep} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitHandler)}
          className="space-y-8"
        >
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter grade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="syllabus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Syllabus</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter syllabus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="strengths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strengths</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter student's strengths"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weaknesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Areas for Improvement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter areas for improvement"
                            className="min-h-[100px]"
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
          {currentStep === 2 && generatedIEP && (
            <Card>
              <CardHeader>
                <CardTitle>Generated IEP</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown>{generatedIEP}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
          <div className="flex justify-between">
            {currentStep > 0 && currentStep < 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            {currentStep < 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
              </Button>
            )}
            {currentStep === 1 && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating IEP...
                  </>
                ) : (
                  "Generate IEP"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
