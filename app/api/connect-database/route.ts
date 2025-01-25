import { NextResponse } from "next/server"
import { initSupabase } from "@/utils/supabase"

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseAnonKey } = await request.json()

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = initSupabase(supabaseUrl, supabaseAnonKey)

    const { data: dbNameData, error: dbNameError } = await supabase.rpc("get_database_name")

    if (dbNameError) {
      throw new Error("Failed to fetch database name")
    }

    return NextResponse.json({ message: "Successfully connected to Supabase", databaseName: dbNameData.name }, { status: 200 })
  } catch (error) {
    console.error("Error connecting to Supabase:", error)
    return NextResponse.json({ error: "Failed to connect to Supabase" }, { status: 500 })
  }
}

