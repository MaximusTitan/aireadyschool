'use server'

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Presentation } from "../types/presentation"

export async function savePresentation(presentation: Presentation) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
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

export async function getPresentation(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("shared_presentations")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return { presentation: data }
  } catch (error) {
    console.error("Error fetching presentation:", error)
    return { error: "Failed to fetch presentation" }
  }
}
