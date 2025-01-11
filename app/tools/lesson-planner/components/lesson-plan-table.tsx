import React, { useState } from "react";

// Import table components from the UI library
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the props for the LessonPlanTable component
interface LessonPlanTableProps {
  initialLessonPlan: {
    [key: string]: string; // Object with keys as section names and values as content
  };
}

// LessonPlanTable component definition
export function LessonPlanTable({ initialLessonPlan }: LessonPlanTableProps) {
  const [lessonPlan, setLessonPlan] = useState(initialLessonPlan);

  // Function to fetch updates from the backend
  const updateLessonPlan = async (newData: { [key: string]: string }) => {
    try {
      const response = await fetch("/api/update-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (response.ok) {
        const updatedPlan = await response.json();
        setLessonPlan(updatedPlan.lessonPlan); // Update state with the new lesson plan
      } else {
        console.error("Failed to update lesson plan:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating lesson plan:", error);
    }
  };

  return (
    <Table>
      {/* Table header with column titles */}
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Section</TableHead>
          <TableHead>Content</TableHead>
        </TableRow>
      </TableHeader>

      {/* Table body rendering rows dynamically */}
      <TableBody>
        {Object.entries(lessonPlan).map(([key, value]) => (
          <TableRow key={key}>
            {/* Display the section name */}
            <TableCell className="font-medium">{key}</TableCell>
            {/* Display the content with text wrapping */}
            <TableCell className="whitespace-pre-wrap">{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
