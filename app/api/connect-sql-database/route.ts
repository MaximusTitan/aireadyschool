import { Pool } from "pg" // PostgreSQL
import mysql from "mysql2/promise" // MySQL
import sql from "mssql" // SQL Server
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { type, host, port, database, user, password, databaseName } = await req.json()

    if (!type || !host || !port || !database || !user || !password || !databaseName) {
      return Response.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Test the connection
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

    // Save the connection details to the database
    const { data, error } = await supabase.from("connect_sql_database").insert([
      {
        database_name: databaseName,
        type,
        host,
        port,
        database,
        user_name: user,
        password: password, // Storing password directly
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

