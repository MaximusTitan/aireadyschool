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

const GradeLevelField: React.FC = () => (
  <InputField
    name="gradeLevel"
    label="Grade Level"
    placeholder="Enter grade level"
  />
);

const AssignmentTypeField: React.FC = () => (
  <InputField
    name="assignmentType"
    label="Assignment Type"
    placeholder="Enter assignment type Eg: Presentation"
  />
);

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
    label="Due Date"
    placeholder="Enter due date"
    type="date"
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
        <Link href="/tools" className="hover:opacity-75">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-semibold">Assignment Generator</h1>
      </div>
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="space-y-4 p-4">
          <div title="Generate Assignments">
            <GradeLevelField />
            <AssignmentTypeField />
            <TopicField />
            <LearningObjectiveField />
            <CollaborationField />
            <DueDateField />
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Generating..." : "Create Assignments"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
