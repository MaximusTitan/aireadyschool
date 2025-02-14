"use server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { Client } from "pg"

async function generateSqlQuery(userInput: string, schemaQuery: string): Promise<string> {
  const model = "gpt-4o"

  const messages = [
    {
      role: "system",
      content: `You are an AI assistant that generates SQL queries for the database ${schemaQuery} based on natural language inputs. Always use proper SQL syntax and best practices. 
        Return only a JSON object with a 'query' key. Do not end with ;`,
    },
    {
      role: "user",
      content: `Generate a SQL query based on the following request. Return the SQL query as a JSON object with a single key 'query' and the SQL as the value. Do not include any other text or explanation.
  Request: ${userInput}`,
    },
  ]

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
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content.trim()
  let generatedQuery: string
  try {
    // Try to parse the entire content as JSON
    const parsedContent = JSON.parse(content)
    generatedQuery = parsedContent.query
  } catch (error) {
    // If parsing fails, try to extract the query using regex
    const match = content.match(/{\s*"query"\s*:\s*"((?:\\.|[^"\\])*)"/)
    if (match && match[1]) {
      generatedQuery = JSON.parse(`"${match[1]}"`) // Parse the extracted string to handle escape characters
    } else {
      throw new Error("Failed to extract SQL query from the response")
    }
  }
  console.log("Generated SQL Query:", generatedQuery)
  return generatedQuery
}

async function generateNaturalLanguageResponse(userInput: string, queryResult: any): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that provides natural language responses to questions about data. Your responses should be concise and informative.",
      },
      {
        role: "user",
        content: `Given the following question and data result, provide a natural language response that answers the question:
          Question: ${userInput}
          Data Result: ${JSON.stringify(queryResult, null, 2)}`,
      },
    ],
    max_tokens: 150,
  })
  return response.choices[0].message.content || ""
}

async function processSqlQuery(userInput: string, query: string, supabase?: any, crmAccessToken?: string, sqlClient?: any) {
  try {
    let data;
    
    if (supabase) {
      // Process query using Supabase
      const result = await supabase.rpc("execute_sql_query", { query });
      data = result.data;
      const error = result.error;
      if (error) throw error;
      
    } 
    else if (crmAccessToken) {
      // Process query using HubSpot API
      const hubspotResponse = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${crmAccessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!hubspotResponse.ok) {
        throw new Error("Failed to fetch HubSpot contacts");
      }

      const hubspotData = await hubspotResponse.json();
      data = hubspotData.results; // Extract the contacts list
    }
    else if (sqlClient) {
      // Process query using SQL database connection
      data = await executeSQLQuery(sqlClient, query);
      if (!data) throw new Error("Failed to execute SQL query");
    }

    // Generate a natural language response based on retrieved data
    const naturalLanguageResponse = await generateNaturalLanguageResponse(userInput, data);
    console.log(naturalLanguageResponse);

    return { success: true, naturalLanguageResponse };
  } catch (error) {
    console.error("Error executing SQL/CRM query:", error);
    return { success: false, error: "Error executing query" };
  }
}

async function connectToSQLDatabase({ host, port, userName, password, database }: any) {
  const client = new Client({
    host,
    port,
    user: userName,
    password,
    database,
    ssl: { rejectUnauthorized: false }, // Optional for cloud-hosted databases
  });

  await client.connect();
  return client;
}

async function executeSQLQuery(client: any, query: string) {
  try {
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error("SQL query execution error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { query, supabaseUrl, supabaseKey, crmAccessToken, host, port, userName, password, database } = requestBody;

    // // // CLOUD // // //
    if (query && supabaseUrl && supabaseKey) {
      // Initialize Supabase client with the provided credentials
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Preprocess the schema query
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
      const schemaData = result.data;
      const error = result.error;

      if (error) {
        return NextResponse.json({ success: false, error: error.message });
      }

      const schemaString = JSON.stringify(schemaData, null, 2);
      console.log(schemaString);

      const generatedQuery = await generateSqlQuery(query, schemaString);

      // Pass the supabase client to processSqlQuery
      const processedResult = await processSqlQuery(query, generatedQuery, supabase);
      return NextResponse.json(processedResult);
    } 
    
    // // // CRM // // //
    if (query && crmAccessToken) {
      // Fetch HubSpot schema using CRM access token
      const hubspotResponse = await fetch("https://api.hubapi.com/crm/v3/properties/contacts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${crmAccessToken}`,
          "Content-Type": "application/json"
        }
      });
      
      const hubspotData = await hubspotResponse.json();
      
      if (!hubspotResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch HubSpot schema" }, { status: 400 });
      }
      
      // Transform the API response into a schema-like format
      const schemaData = [
        {
          table_name: "contacts",
          columns: hubspotData.results.map((property: any) => property.name) // Extract property names as columns
        }
      ];
      
      const schemaString = JSON.stringify(schemaData, null, 2);
      console.log(schemaString);
      
      const generatedQuery = await generateSqlQuery(query, schemaString);
      
      const processedResult = await processSqlQuery(query, generatedQuery, undefined, crmAccessToken);
      
      return NextResponse.json(processedResult);
    }
    
    // // // SQL // // //
    if (query && host && port && userName && password && database) {
      const sqlClient = await connectToSQLDatabase({ host, port, userName, password, database });

      const schemaQuery = `
        SELECT 
          table_name, 
          json_agg(column_name) AS columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        GROUP BY table_name 
        ORDER BY table_name
      `;

      const schemaData = await executeSQLQuery(sqlClient, schemaQuery);
      if (!schemaData) {
        return NextResponse.json({ error: "Failed to fetch SQL schema" }, { status: 400 });
      }

      const schemaString = JSON.stringify(schemaData, null, 2);
      console.log(schemaString);

      const generatedQuery = await generateSqlQuery(query, schemaString);
      const processedResult = await processSqlQuery(query, generatedQuery, undefined, undefined, sqlClient);

      return NextResponse.json(processedResult);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Failed to execute query" }, { status: 500 });
  }
}
