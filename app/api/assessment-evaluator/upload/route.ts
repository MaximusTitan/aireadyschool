import { IncomingMessage } from "http";
import { Readable } from "stream";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import os from "os";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Create a temporary uploads directory (e.g., /tmp/uploads on Unix)
const tempUploadsDir = path.join(os.tmpdir(), "uploads");
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir);
}

export const config = {
  runtime: "nodejs", // Ensure full Node.js environment
  api: {
    bodyParser: false, // Disable default body parsing
  },
};

export async function POST(request: Request) {
  // Convert the Next.js Request to a Node.js–compatible stream:
  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  // Create a Readable stream from the buffer
  const stream = Readable.from(bodyBuffer);
  // Attach necessary properties to simulate an IncomingMessage
  const nodeReq = Object.assign(stream, {
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
  }) as unknown as IncomingMessage;

  return new Promise<Response>((resolve) => {
    const form = formidable({
      uploadDir: tempUploadsDir,      // Use the temporary uploads directory
      keepExtensions: true,           // Keep file extensions
      maxFileSize: 10 * 1024 * 1024,    // 10MB limit
      multiples: false,               // Only allow one file
    });

    form.parse(nodeReq, async (err, fields, files) => {
      if (err) {
        resolve(
          new Response(JSON.stringify({ error: "File upload error" }), { status: 500 })
        );
        return;
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        resolve(
          new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 })
        );
        return;
      }

      const filePath = file.filepath;

      try {
        // Load PDF using LangChain's PDFLoader
        const loader = new PDFLoader(filePath);
        const documents = await loader.load();
        const extractedText = documents.map((doc) => doc.pageContent).join("\n");

        resolve(
          new Response(JSON.stringify({ extractedText }), { status: 200 })
        );
      } catch (error) {
        resolve(
          new Response(JSON.stringify({ error: "PDF processing failed", details: error }), { status: 500 })
        );
      } finally {
        // Cleanup: Delete the temporary file after processing if it exists
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
  });
}
