"use server"

import { createClient } from "@/utils/supabase/server";
import type { Presentation } from "../types/presentation";

export async function updatePresentation({
  id,
  presentation,
}: {
  id: string;
  presentation: Presentation;
}) {
  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await (await supabase)
      .from("shared_presentations")
      .update({
        title: presentation.topic,
        slides: presentation.slides,
        theme: presentation.theme,
        transition: presentation.transition,
        last_edited: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      ...presentation,
      id,
      lastEdited: data.last_edited || now,
    };
  } catch (error) {
    console.error("Error updating presentation:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Failed to update presentation");
  }
}
