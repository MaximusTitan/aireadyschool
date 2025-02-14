"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function saveText(content: string) {
  const supabase = await createClient()

  if (!content) {
    throw new Error("Content is required")
  }

  // Retrieve the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("saved_texts")
    .insert({ content, user_email: user.email })
    .select()

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

  // Retrieve the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("saved_texts")
    .select("*")
    .eq("user_email", user.email)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching saved texts:", error)
    throw new Error(`Failed to fetch saved texts: ${error.message}`)
  }

  return data
}

export async function deleteText(id: string) {
  const supabase = await createClient()

  // Retrieve the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("saved_texts")
    .delete()
    .eq("id", id)
    .eq("user_email", user.email)

  if (error) {
    console.error("Error deleting text:", error)
    throw new Error(`Failed to delete text: ${error.message}`)
  }
}

