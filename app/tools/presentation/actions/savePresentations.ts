import { supabase } from "../lib/supabase";
import type { Presentation } from "../types/presentation"

export async function savePresentation(presentation: Presentation): Promise<{ id: string; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("shared_presentations")
      .insert({
        title: presentation.topic,
        slides: presentation.slides,
        theme: presentation.theme || "modern",
        transition: presentation.transition || "slide",
      })
      .select("id")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`Failed to save presentation: ${error.message}`)
    }

    if (!data || !data.id) {
      throw new Error("Failed to retrieve the saved presentation ID")
    }

    return { id: data.id, error: null }
  } catch (error) {
    console.error("Error saving presentation:", error)
    return {
      id: "",
      error: error instanceof Error ? error.message : "An unexpected error occurred while saving the presentation",
    }
  }
}

export async function getPresentation(
  id: string,
): Promise<{ presentation: Presentation | null; error: string | null }> {
  try {
    console.log("Fetching presentation from Supabase, ID:", id)

    if (!id) {
      console.error("Invalid presentation ID")
      return { presentation: null, error: "Invalid presentation ID" }
    }

    const { data, error } = await supabase.from("shared_presentations").select("*").eq("id", id).single()

    if (error) {
      console.error("Supabase error:", error)
      return {
        presentation: null,
        error: `Database error: ${error.message}`,
      }
    }

    if (!data) {
      console.error("No data found for ID:", id)
      return { presentation: null, error: "Presentation not found" }
    }

    console.log("Successfully fetched presentation data:", {
      id: data.id,
      title: data.title,
      slideCount: Array.isArray(data.slides) ? data.slides.length : 0,
    })

    const presentation: Presentation = {
      id: data.id,
      topic: data.title,
      slides: Array.isArray(data.slides) ? data.slides : [],
      theme: data.theme || "modern",
      transition: data.transition || "slide",
    }

    return { presentation, error: null }
  } catch (error) {
    console.error("Unexpected error in getPresentation:", error)
    return {
      presentation: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
