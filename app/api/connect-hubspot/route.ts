import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { hubspotAccessToken, crmName } = await req.json()
    if (!hubspotAccessToken || !crmName) {
      return NextResponse.json({ error: "HubSpot Access Token and CRM Name are required" }, { status: 400 })
    }

    // Test the connection to HubSpot
    const url = "https://api.hubapi.com/crm/v3/objects/contacts?limit=1"
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("HubSpot API error:", response.status, response.statusText, responseData)

      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. Please check your Access Token and ensure it has the necessary permissions.",
          },
          { status: 401 },
        )
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `HubSpot API error: ${response.status} ${response.statusText}`,
            details: responseData,
          },
          { status: response.status },
        )
      }
    }

    // If connection is successful, store the information in Supabase
    const { data, error } = await supabase.from("connected_crm").insert([
      {
        crm_name: crmName,
        crm_type: "hubspot",
        access_token: hubspotAccessToken,
      },
    ])

    if (error) {
      console.error("Error storing CRM data:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to store CRM connection data",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to HubSpot and stored as "${crmName}"`,
      contactCount: responseData.total,
    })
  } catch (error: any) {
    console.error("Unexpected error during HubSpot connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while connecting to HubSpot",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

