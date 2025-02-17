import { createClient } from "@/utils/supabase/server";
import { LessonPlanFormData, LessonPlanResponse } from "../types";

export async function generateLessonPlan(
  formData: FormData | LessonPlanFormData
): Promise<LessonPlanResponse> {
  try {
    // Convert FormData or object to a regular FormData object
    const finalFormData = new FormData();
    
    if (formData instanceof FormData) {
      // If it's already FormData, use it directly
      for (const [key, value] of formData.entries()) {
        finalFormData.append(key, value);
      }
    } else {
      // If it's an object, convert it to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          finalFormData.append(key, value.toString());
        }
      });
    }

    const response = await fetch("/api/generateLessonPlan", {
      method: "POST",
      body: finalFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate lesson plan");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in generateLessonPlan:", error);
    throw error;
  }
}

