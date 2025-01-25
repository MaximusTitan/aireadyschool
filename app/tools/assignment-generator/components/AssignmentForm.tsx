import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContentBlock } from "./ContentBlock";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface InputFieldProps {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  placeholder,
  type = "text",
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel>
            <Label htmlFor={name}>{label}</Label>
          </FormLabel>
          <FormControl>
            <Input
              id={name}
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                const value =
                  type === "number"
                    ? Number.parseInt(e.target.value, 10)
                    : e.target.value;
                field.onChange(value);
              }}
            />
          </FormControl>
          {error && <FormMessage>{error.message}</FormMessage>}
        </FormItem>
      )}
    />
  );
};

const GradeLevelField: React.FC = () => {
  const { control } = useFormContext();
  return (
    <FormItem>
      <Label htmlFor="gradeLevel">Grade Level</Label>
      <Controller
        name="gradeLevel"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select grade level"></SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FormMessage />
    </FormItem>
  );
};

const AssignmentTypeField: React.FC = () => {
  const { control } = useFormContext();
  return (
    <FormItem>
      <Label htmlFor="assignmentType">Assignment Type</Label>
      <Controller
        name="assignmentType"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type"></SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Presentation">Presentation</SelectItem>
              <SelectItem value="Essay">Essay</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="Quiz">Quiz</SelectItem>
              <SelectItem value="Test">Test</SelectItem>
              <SelectItem value="Homework">Homework</SelectItem>
              <SelectItem value="Lab">Lab</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <FormMessage />
    </FormItem>
  );
};

const TopicField: React.FC = () => (
  <InputField
    name="textInput"
    label="Topic Name"
    placeholder="Enter Topic Name"
  />
);

const DueDateField: React.FC = () => (
  <InputField
    name="dueDate"
    label="Due in (days)"
    placeholder="Enter number of days"
    type="number"
  />
);

const LearningObjectiveField: React.FC = () => (
  <InputField
    name="learningObjective"
    label="Learning Objective"
    placeholder="Set a learning objective"
  />
);

const CollaborationField: React.FC = () => {
  const { control } = useFormContext();
  return (
    <FormItem>
      <Label htmlFor="collaboration">Collaboration Allowed</Label>
      <Controller
        name="collaboration"
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Does this assignment require collaboration?"></SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <FormMessage />
    </FormItem>
  );
};

interface AssignmentFormProps {
  isLoading: boolean;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  isLoading,
}) => {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-4 mb-6 ml-4 w-full max-w-6xl">
        <Link href="/tools" className="hover:opacity-75 transition-opacity">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-semibold">Assignment Generator</h1>
      </div>
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GradeLevelField />
                <AssignmentTypeField />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Assignment Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <TopicField />
                <LearningObjectiveField />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CollaborationField />
                <DueDateField />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Generating...
                </div>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
