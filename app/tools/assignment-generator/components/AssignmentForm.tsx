import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import {
  countries,
  boardsByCountry,
  subjects,
} from "@/app/constants/education-data";

export const AssignmentForm: React.FC<{ isLoading: boolean }> = ({
  isLoading,
}) => {
  const { control, watch } = useFormContext();
  const selectedCountry = watch("country");

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">
          Assignment Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Create engaging, interactive assignments with customizable questions
          for students in minutes.
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-6">
            {/* Country and Board Selection */}
            <div className="grid md:grid-cols-2 gap-8">
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Educational Board</FormLabel>
                <Controller
                  name="board"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select board..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCountry &&
                          boardsByCountry[selectedCountry]?.map((board) => (
                            <SelectItem key={board.value} value={board.value}>
                              {board.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>
            </div>

            {/* Subject, Grade and Assignment Type */}
            <div className="grid md:grid-cols-3 gap-8">
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Grade Level</FormLabel>
                <Controller
                  name="gradeLevel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select grade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Grade {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Assignment Type</FormLabel>
                <Controller
                  name="assignmentType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="presentation">
                          Presentation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>
            </div>

            {/* Topic and Learning Objective */}
            <div className="space-y-2">
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <Controller
                  name="textInput"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter the assignment topic..."
                      className="h-11 bg-white"
                    />
                  )}
                />
              </FormItem>
            </div>

            <div className="space-y-2">
              <FormItem>
                <FormLabel>Learning Objective</FormLabel>
                <Controller
                  name="learningObjective"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter the learning objective..."
                      className="h-11 bg-white"
                    />
                  )}
                />
              </FormItem>
            </div>

            {/* Collaboration and Due Date */}
            <div className="grid md:grid-cols-2 gap-8">
              <FormItem>
                <FormLabel>Collaboration</FormLabel>
                <Controller
                  name="collaboration"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Allow collaboration?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Due in (days)</FormLabel>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="365"
                      placeholder="Enter number of days"
                      className="h-11 bg-white"
                    />
                  )}
                />
              </FormItem>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Create Assignment"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
