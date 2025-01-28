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
          name: `Main.${language === "javascript" ? "js" : language === "python" ? "py" : "java"}`,
          content: code,
        },
      ],
    }),
  }

  try {
    const response = await fetch(apiUrl, options)
    const result = await response.json()
    return NextResponse.json({ output: result.stdout || result.stderr })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "An error occurred while running the code." }, { status: 500 })
  }
}

