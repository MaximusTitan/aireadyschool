import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { language, code } = await req.json()

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
  }

  const apiUrl = "https://onecompiler-apis.p.rapidapi.com/api/v1/run"
  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "onecompiler-apis.p.rapidapi.com",
    },
    body: JSON.stringify({
      language: language,
      files: [
        {
          name: `Main.${
            language === "nodejs" ? "js" : 
            language === "python3" ? "py" : 
            language === "rust" ? "rs" : 
            "java"}`,
          content: code,
        },
      ],
      stdin: "",
    }),
  }

  try {
    const response = await fetch(apiUrl, options)
    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.message || "API request failed" 
      }, { status: response.status })
    }

    const output = result.stdout || result.stderr || ""
    return NextResponse.json({ output })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "An error occurred while running the code." }, 
      { status: 500 }
    )
  }
}

