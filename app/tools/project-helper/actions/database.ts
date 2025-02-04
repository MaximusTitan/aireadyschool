"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function saveText(content: string) {
  const supabase = await createClient()

  if (!content) {
    throw new Error("Content is required")
  }

  const { data, error } = await supabase.from("saved_texts").insert({ content }).select()

  if (error) {
    console.error("Error saving text:", error)
    throw new Error(`Failed to save text: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned after saving text")
  }

  return data[0]
}

export async function fetchSavedTexts() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("saved_texts").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching saved texts:", error)
    throw new Error(`Failed to fetch saved texts: ${error.message}`)
  }

  return data
}

export async function deleteText(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("saved_texts").delete().eq("id", id)

  if (error) {
    console.error("Error deleting text:", error)
    throw new Error(`Failed to delete text: ${error.message}`)
  }
}

