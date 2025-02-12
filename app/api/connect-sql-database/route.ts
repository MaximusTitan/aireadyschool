import { Pool } from "pg"
import mysql from "mysql2/promise"
import sql from "mssql"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { type, host, port, database, user, password, databaseName } = await req.json()

    if (!type || !host || !port || !database || !user || !password || !databaseName) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Test the connection
    try {
      if (type === "postgres") {
        const client = new Pool({ host, port, database, user, password, ssl: { rejectUnauthorized: false } })
        await client.query("SELECT 1")
        await client.end()
      } else if (type === "mysql") {
        const connection = await mysql.createConnection({ host, port, database, user, password })
        await connection.query("SELECT 1")
        await connection.end()
      } else if (type === "mssql") {
        const pool = await sql.connect({ server: host, port, database, user, password, options: { encrypt: true } })
        await pool.request().query("SELECT 1")
        await pool.close()
      } else {
        return Response.json({ error: "Unsupported database type" }, { status: 400 })
      }
    } catch (dbError: any) {
      return Response.json({
        success: false,
        error: `Database connection failed: ${dbError.message}`,
        databaseName: null,
      }, { status: 500 })
    }

    // Save the connection details to the database
    const { error } = await supabase.from("connect_sql_database").insert([
      {
        database_name: databaseName,
        type,
        host,
        port,
        database,
        user_name: user,
        password: password,
      },
    ])

    if (error) throw error

    return Response.json({
      success: true,
      message: `Connected successfully to ${databaseName} and saved the connection details!`,
      databaseName: databaseName,
    })
  } catch (error: any) {
    console.error("Error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
        databaseName: null,
      },
      { status: 500 },
    )
  }
}

