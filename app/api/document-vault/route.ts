import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"

// Handle file upload (POST) and fetch files (GET)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userEmail = formData.get("userEmail") as string | null
    const fullPath = formData.get("fullPath") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!fullPath) {
      return NextResponse.json({ error: "Full path is required" }, { status: 400 })
    }

    console.log("Saving file to folder:", fullPath)

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = `${fullPath}/${Date.now()}-${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("document-vault")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError.message)
      return NextResponse.json({ error: "File upload failed" }, { status: 500 })
    }

    // Get public URL
    const { data } = supabase.storage.from("document-vault").getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    // Get the parent folder name
    const parentFolder = fullPath.split("/").pop() || "document-vault"

    // Insert file metadata into the database
    const { error: insertError } = await supabase.from("document-vault").insert([
      {
        file_name: file.name,
        parent_folder: parentFolder,
        file_path: filePath,
        public_url: publicUrl,
        created_at: new Date().toISOString(),
        type: "file",
        user_email: userEmail,
      },
    ])

    if (insertError) {
      console.error("Error inserting record:", insertError.message)
      return NextResponse.json({ error: "Failed to insert record" }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error("Error handling file upload:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Fetch all files in the current folder (GET)
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const folderName = searchParams.get("folder_name") || "document-vault"
    const userEmail = searchParams.get("userEmail")

    console.log("Received Folder Name:", folderName)
    console.log("User Email:", userEmail)

    const query = supabase.from("document-vault").select("*").eq("parent_folder", folderName)

    if (userEmail) {
      query.eq("user_email", userEmail)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching files:", error.message)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    return NextResponse.json({ files: data })
  } catch (error) {
    console.error("Error retrieving files:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderName, fullPath, userEmail } = await req.json()

    if (!folderName) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    if (!fullPath) {
      return NextResponse.json({ error: "Full path is required" }, { status: 400 })
    }

    // Construct the full folder path
    const filePath = `${fullPath}/`

    // Create an empty folder by adding a placeholder file
    const { error } = await supabase.storage
      .from("document-vault")
      .upload(`${filePath}.placeholder`, new Blob([]), { upsert: false })

    if (error) {
      console.error("Supabase folder creation error:", error.message)
      return NextResponse.json({ error: "Folder creation failed" }, { status: 500 })
    }

    // Get the parent folder name
    const parentFolder = fullPath.split("/").slice(0, -1).pop() || "document-vault"

    // Insert folder record into database
    const { error: insertError } = await supabase.from("document-vault").insert([
      {
        file_name: folderName,
        parent_folder: parentFolder,
        file_path: filePath,
        type: "folder",
        created_at: new Date().toISOString(),
        user_email: userEmail,
      },
    ])

    if (insertError) {
      console.error("Error inserting folder record:", insertError.message)
      return NextResponse.json({ error: "Failed to insert folder record" }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: filePath })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Handle DELETE request
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Parse the request body to get file/folder details
    const { fileName, type, filePath, userEmail } = await req.json()

    if (!fileName || !filePath) {
      return NextResponse.json({ error: "File name and path are required" }, { status: 400 })
    }

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage.from("document-vault").remove([filePath])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError.message)
      return NextResponse.json({ error: "Failed to delete file from storage" }, { status: 500 })
    }

    // Delete from Supabase Database
    const { error: dbError } = await supabase
      .from("document-vault")
      .delete()
      .eq("file_name", fileName)
      .eq("file_path", filePath)
      .eq("user_email", userEmail)

    if (dbError) {
      console.error("Error deleting record from database:", dbError.message)
      return NextResponse.json({ error: "Failed to delete record from database" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling delete request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

