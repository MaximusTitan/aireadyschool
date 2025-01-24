import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { query, supabaseUrl, supabaseAnonKey } = await request.json()

    if (!query || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.rpc("execute_sql_query", { query })

    if (error) {
      throw new Error("Failed to execute query")
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error("Error executing query:", error)
    return NextResponse.json({ error: "Failed to execute query" }, { status: 500 })
  }
}

