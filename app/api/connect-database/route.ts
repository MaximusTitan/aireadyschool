import { NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let ext_supabase: SupabaseClient; // Declare the Supabase client with an explicit type

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseAnonKey } = await request.json()

    // Validate the input
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a Supabase client with the provided credentials
    ext_supabase = createClient(supabaseUrl, supabaseAnonKey) // Assign to the outer variable

    // Fetch the database name (assuming you have a way to get it)
    const { data: dbNameData, error: dbNameError } = await ext_supabase.rpc("get_database_name"); // Replace with your actual RPC or query to get the database name

    if (dbNameError) {
      throw new Error("Failed to fetch database name")
    }

    // If we reach this point, the connection was successful
    return NextResponse.json({ message: "Successfully connected to Supabase", databaseName: dbNameData.name }, { status: 200 })
  } catch (error) {
    console.error("Error connecting to Supabase:", error)
    return NextResponse.json({ error: "Failed to connect to Supabase" }, { status: 500 })
  }
}

export { ext_supabase }; // Export the Supabase client

