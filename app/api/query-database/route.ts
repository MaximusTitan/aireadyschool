"use server";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// -------------------------------------------------------------------
// Helper functions (unchanged for Cloud processing)

async function generateSqlQuery(userInput: string, schemaQuery: string): Promise<string> {
  const model = "gpt-4o";
  const messages = [
    {
      role: "system",
      content: `You are an AI assistant that generates SQL queries for the database based on the following schema:\n${schemaQuery}\nAlways return only a valid JSON object with a single key 'query'. No explanations, no extra formatting.`,
    },
    {
      role: "user",
      content: `Generate a SQL query for the following request. Return only JSON with a single key 'query'. No extra text.\nRequest: ${userInput}`,
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
      temperature: 0.3, // Reduce temperature to make responses more structured
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  console.log("Raw OpenAI Response:", content); // Debugging

  try {
    const parsedContent = JSON.parse(content);
    if (parsedContent.query) {
      console.log("Extracted SQL Query:", parsedContent.query);
      return parsedContent.query;
    } else {
      throw new Error("Missing 'query' key in OpenAI response");
    }
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);

    // Fallback: Extract query from raw text using regex
    const match = content.match(/"query"\s*:\s*"([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }

    throw new Error("Failed to extract SQL query from the response");
  }
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
        content:
          "You are an AI assistant that provides concise and informative natural language responses about data.",
      },
      {
        role: "user",
        content: `Given the following question and data result, provide a natural language answer:\nQuestion: ${userInput}\nData Result: ${JSON.stringify(
          queryResult,
          null,
          2
        )}`,
      },
    ],
    max_tokens: 150,
  });

  return response.choices[0].message.content || "";
}

async function processSqlQuery(userInput: string, query: string, supabase: any) {
  try {
    const result = await supabase.rpc("execute_sql_query", { query });
    if (result.error) throw result.error;
    const naturalLanguageResponse = await generateNaturalLanguageResponse(userInput, result.data);
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error executing SQL query:", error);
    return { success: false, error: "Error executing SQL query" };
  }
}

// -------------------------------------------------------------------
// Modified helper for CRM processing.
// Here we simulate a schema query for CRM. Adjust as needed.
async function processCrmQuery(userInput: string, crmAccessToken: string, generatedQuery: string) {
  try {
    // In a real-world scenario, you might call a HubSpot endpoint to get CRM metadata.
    // For demonstration, we use a dummy schema string.
    console.log("Generated CRM Query:", generatedQuery);
    // Optionally execute the generated query against CRM data if applicable.
    // For now, we simulate the response.
    const naturalLanguageResponse = `CRM Query executed. Generated Query: ${generatedQuery}`;
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error processing CRM query:", error);
    return { success: false, error: "Error processing CRM query" };
  }
}

// -------------------------------------------------------------------
// Modified helper for direct SQL processing.
async function processDirectSqlQuery(
  userInput: string,
  connectionDetails: { host: string; port: string; database: string; user: string; password: string },
  generatedQuery: string
) {
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
    // Optionally, execute the generated query.
    // For example, here we execute a test query (you may replace this with your own logic).
    const result = await pool.query(generatedQuery);
    await pool.end();
    const naturalLanguageResponse = await generateNaturalLanguageResponse(userInput, result.rows);
    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error executing direct SQL query:", error);
    await pool.end();
    return { success: false, error: "Error executing direct SQL query" };
  }
}

// -------------------------------------------------------------------
// Main POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    // Cloud (Supabase) processing.
    if (body.supabaseUrl && body.supabaseKey) {
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
      console.log("Supabase Schema:", schemaString);
      const generatedQuery = await generateSqlQuery(query, schemaString);
      const processedResult = await processSqlQuery(query, generatedQuery, supabase);
      return NextResponse.json(processedResult);
    }
    // CRM (HubSpot) processing.
    else if (body.crmAccessToken) {
      // For CRM, simulate a schema query (or fetch CRM metadata if available)
      const crmSchema = "Dummy CRM Schema: contacts, deals, companies";
      console.log("CRM Schema:", crmSchema);
      const generatedQuery = await generateSqlQuery(query, crmSchema);
      const processedResult = await processCrmQuery(query, body.crmAccessToken, generatedQuery);
      return NextResponse.json(processedResult);
    }
    // Direct SQL processing.
    else if (body.host && body.port && body.database && body.userName && body.password) {
      const { Pool } = await import("pg");
      const pool = new Pool({
        host: body.host,
        port: parseInt(body.port),
        database: body.database,
        user: body.userName,
        password: body.password,
        ssl: { rejectUnauthorized: false },
      });
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
      const result = await pool.query(schemaQuery);
      const schemaString = JSON.stringify(result.rows, null, 2);
      console.log("SQL Schema:", schemaString);
      const generatedQuery = await generateSqlQuery(query, schemaString);
      const processedResult = await processDirectSqlQuery(query, {
        host: body.host,
        port: body.port,
        database: body.database,
        user: body.userName,
        password: body.password,
      }, generatedQuery);
      await pool.end();
      return NextResponse.json(processedResult);
    } else {
      return NextResponse.json({ success: false, error: "Invalid parameters provided." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Failed to execute query" }, { status: 500 });
  }
}
