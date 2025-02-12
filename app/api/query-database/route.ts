"use server";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// --- Helper functions from your existing code ---
async function generateSqlQuery(userInput: string, schemaQuery: string): Promise<string> {
  const model = "gpt-4o";
  const messages = [
    {
      role: "system",
      content: `You are an AI assistant that generates SQL queries for the database ${schemaQuery} based on natural language inputs. Always use proper SQL syntax and best practices. Return only a JSON object with a 'query' key. Do not end with ;`,
    },
    {
      role: "user",
      content: `Generate a SQL query based on the following request. Return the SQL query as a JSON object with a single key 'query' and the SQL as the value. Do not include any other text or explanation.
  Request: ${userInput}`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  let generatedQuery: string;
  try {
    const parsedContent = JSON.parse(content);
    generatedQuery = parsedContent.query;
  } catch (error) {
    const match = content.match(/{\\s*"query"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"/);
    if (match && match[1]) {
      generatedQuery = JSON.parse(`"${match[1]}"`);
    } else {
      throw new Error("Failed to extract SQL query from the response");
    }
  }
  console.log("Generated SQL Query:", generatedQuery);
  return generatedQuery;
}

async function generateNaturalLanguageResponse(userInput: string, queryResult: any): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an AI assistant that provides natural language responses to questions about data. Your responses should be concise and informative.",
      },
      {
        role: "user",
        content: `Given the following question and data result, provide a natural language response that answers the question:
          Question: ${userInput}
          Data Result: ${JSON.stringify(queryResult, null, 2)}`,
      },
    ],
    max_tokens: 150,
  });
  return response.choices[0].message.content || "";
}

async function processSqlQuery(userInput: string, query: string, supabase: any) {
  try {
    const result = await supabase.rpc("execute_sql_query", { query });
    const data = result.data;
    const error = result.error;
    if (error) throw error;
    const naturalLanguageResponse = await generateNaturalLanguageResponse(userInput, data);
    console.log(naturalLanguageResponse);
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error executing SQL query:", error);
    return { success: false, error: "Error executing SQL query" };
  }
}

// --- New helper for CRM queries ---
async function processCrmQuery(userInput: string, crmAccessToken: string): Promise<any> {
  // Example: Make a request to a HubSpot API endpoint using the crmAccessToken
  // (Replace the URL and processing logic with your actual CRM query processing.)
  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${crmAccessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.statusText}`);
    }
    const data = await response.json();
    const naturalLanguageResponse = `CRM data retrieved successfully: ${JSON.stringify(data)}`;
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error processing CRM query:", error);
    return { success: false, error: "Error processing CRM query" };
  }
}

// --- New helper for direct SQL queries ---
async function processDirectSqlQuery(userInput: string, connectionDetails: { host: string; port: string; database: string; user: string; password: string; }): Promise<any> {
  // For example, use node-postgres (pg) to connect directly
  const { Pool } = await import("pg");
  const pool = new Pool({
    host: connectionDetails.host,
    port: parseInt(connectionDetails.port),
    database: connectionDetails.database,
    user: connectionDetails.user,
    password: connectionDetails.password,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const result = await pool.query("SELECT 1"); // Replace with your actual query execution logic
    await pool.end();
    const naturalLanguageResponse = await generateNaturalLanguageResponse(userInput, result.rows);
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error executing direct SQL query:", error);
    return { success: false, error: "Error executing direct SQL query" };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;
    // Determine which category based on the presence of certain parameters.
    if (body.supabaseUrl && body.supabaseKey) {
      // Cloud (Supabase) processing.
      const supabase = createClient(body.supabaseUrl, body.supabaseKey);
      const schemaQuery = `
        SELECT
            table_name,
            json_agg(column_name) AS columns
        FROM
            information_schema.columns
        WHERE
            table_schema = 'public'
        GROUP BY
            table_name
        ORDER BY
            table_name
      `;
      const result = await supabase.rpc("execute_sql_query", { query: schemaQuery });
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error.message });
      }
      const schemaString = JSON.stringify(result.data, null, 2);
      console.log("Schema:", schemaString);
      const generatedQuery = await generateSqlQuery(query, schemaString);
      const processedResult = await processSqlQuery(query, generatedQuery, supabase);
      return NextResponse.json(processedResult);
    } else if (body.crmAccessToken) {
      // CRM (HubSpot) processing.
      const processedResult = await processCrmQuery(query, body.crmAccessToken);
      return NextResponse.json(processedResult);
    } else if (body.host && body.port && body.database && body.userName && body.password) {
      // Direct SQL processing.
      const processedResult = await processDirectSqlQuery(query, {
        host: body.host,
        port: body.port,
        database: body.database,
        user: body.userName,
        password: body.password,
      });
      return NextResponse.json(processedResult);
    } else {
      return NextResponse.json({ success: false, error: "Invalid parameters provided." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Failed to execute query" }, { status: 500 });
  }
}
