import { createClient } from "@/utils/supabase/client"
import type { Presentation } from "../types/presentation"
import { supabase } from "../lib/supabase"

export async function savePresentation(presentation: Presentation) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.email) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("shared_presentations")
      .insert([
        {
          title: presentation.topic,
          slides: presentation.slides,
          theme: presentation.theme,
          transition: presentation.transition,
          email: user.email
        }
      ])
      .select()
      .single()

    if (error) throw error

    return { id: data.id }
  } catch (error) {
    console.error("Error saving presentation:", error)
    return { error: "Failed to save presentation" }
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

