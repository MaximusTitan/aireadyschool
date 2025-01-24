"use server"
import { NextResponse } from "next/server"
import { ext_supabase } from "../connect-database/route"
import OpenAI from "openai"

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
  
    return response.choices[0].message.content || "";
  }
  
  async function processSqlQuery(userInput: string, query: string) {
    if (!ext_supabase) {
      throw new Error("Supabase client is not initialized.");
    }

    console.log("ext_supabase:", ext_supabase); // Debugging line

    try {
      const result = await ext_supabase.rpc("execute_sql_query", { query });
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

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

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

    const result = await ext_supabase.rpc("execute_sql_query", { query: schemaQuery });
    const schemaData = result.data; // Get the schema data
    const error = result.error;

    if (error) {
        return NextResponse.json({ success: false, error: error.message });
      }
    
      // Convert schemaData to a string format suitable for the generateSqlQuery function
      const schemaString = JSON.stringify(schemaData, null, 2); // Format the schema data as a string
      console.log(schemaString)
    
      // Pass the user input and the formatted schema string to generateSqlQuery
      const generatedQuery = await generateSqlQuery(query, schemaString); // Pass schemaString as an argument
    
      // Process the SQL query and return the response
      const processedResult = await processSqlQuery(query, generatedQuery);
    
      return NextResponse.json(processedResult); // Return the processed result as JSON
    }catch (error) {
    console.error("Error executing query:", error)
    return NextResponse.json({ error: "Failed to execute query" }, { status: 500 })
  }
}

