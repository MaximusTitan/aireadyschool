import { NextResponse } from "next/server";
import { IncomingMessage } from "http";
import { Readable } from "stream";
import formidable from "formidable";
import { createMistral } from "@ai-sdk/mistral";
import { generateText } from "ai";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // Import Supabase client

const SYSTEM_PROMPT = `You are an OCR (Optical Character Recognition) specialist that extracts text from images and documents.
Your task is to analyze the provided file and extract all the text content from it.
Return only the extracted text content without any additional commentary, explanations, or formatting.
Preserve the original formatting structure as much as possible, including paragraphs, bullet points, and section breaks.`;

// Initialize Mistral client
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

// Create a Supabase client using the Service Role Key to bypass RLS
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!;
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

// Create a temporary uploads directory (e.g., /tmp/uploads)
const tempUploadsDir = path.join(os.tmpdir(), "uploads");
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir);
}

export async function POST(request: Request) {
  // Read raw body and create a Readable stream
  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  const stream = Readable.from(bodyBuffer);
  const nodeReq = Object.assign(stream, {
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
  }) as unknown as IncomingMessage;

  return new Promise<Response>((resolve) => {
    const form = formidable({
      uploadDir: tempUploadsDir, // Use the temporary uploads directory
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      multiples: false,
    });

    form.parse(nodeReq, async (err, fields, files) => {
      if (err) {
        resolve(
          new Response(JSON.stringify({ error: "File upload error" }), { status: 500 })
        );
        return;
      }

      const fileUploaded = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!fileUploaded) {
        resolve(
          new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 })
        );
        return;
      }

      const filePath = fileUploaded.filepath;
      const originalFilename = fileUploaded.originalFilename || "uploaded_file.pdf";

      try {
        // Initialize Supabase client with the Service Role Key
        const supabase = createClient();
        const fileBuffer = fs.readFileSync(filePath);

        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from("ocr-files") // Ensure this bucket exists in Supabase
          .upload(`uploads/${originalFilename}`, fileBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (error) {
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        // Generate a public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from("ocr-files")
          .getPublicUrl(`uploads/${originalFilename}`);

        const fileUrl = publicUrlData.publicUrl;
        console.log("File URL", fileUrl);

        // Return the extracted file URL
        resolve(NextResponse.json({ fileUrl: fileUrl }));
      } catch (error: any) {
        resolve(
          new Response(
            JSON.stringify({ error: "Error processing OCR", details: error.message }),
            { status: 500 }
          )
        );
      }
    });
  });
}
