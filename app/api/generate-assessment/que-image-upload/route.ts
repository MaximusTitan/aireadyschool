import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    // Parse the incoming form-data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const indexStr = formData.get("index") as string;
    const numQuestionsStr = formData.get("num_questions") as string;
    const assessment_id = formData.get("assessment_id") as string;

    if (!file || !indexStr || !numQuestionsStr || !assessment_id) {
      return NextResponse.json(
        { error: "Missing required fields (file, index, num_questions, assessment_id)" },
        { status: 400 }
      );
    }

    const index = parseInt(indexStr, 10);
    const num_questions = parseInt(numQuestionsStr, 10);

    if (isNaN(index) || isNaN(num_questions)) {
      return NextResponse.json(
        { error: "Invalid index or num_questions provided" },
        { status: 400 }
      );
    }

    // Generate a unique file name and set a path for storage (customize as needed)
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `assessments/${assessment_id}/${fileName}`;

    // Upload the file to the Supabase storage bucket
    const { error: uploadError } = await supabase
      .storage
      .from("assessments")
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json(
        { error: "Error uploading file", details: uploadError.message },
        { status: 500 }
      );
    }

    // Retrieve the public URL of the uploaded file
    const { data: publicUrlData } = supabase
      .storage
      .from("assessments")
      .getPublicUrl(filePath);
    const fileUrl = publicUrlData.publicUrl;

    // Retrieve the current assessment record to get existing que_img_url (if any)
    const { data: assessmentData, error: selectError } = await supabase
      .from("assessments")
      .select("que_img_url")
      .eq("id", assessment_id)
      .single();

    let que_img_url: (string | null)[];
    if (selectError || !assessmentData) {
      // If no record or the column is empty, initialize with nulls
      que_img_url = Array(num_questions).fill(null);
    } else {
      // Check if que_img_url is a string; if so, parse it.
      if (typeof assessmentData.que_img_url === "string") {
        try {
          que_img_url = JSON.parse(assessmentData.que_img_url);
        } catch (e) {
          console.error("Error parsing que_img_url:", e);
          que_img_url = Array(num_questions).fill(null);
        }
      } else {
        que_img_url = assessmentData.que_img_url || Array(num_questions).fill(null);
      }
      // Adjust the array length if necessary
      if (que_img_url.length < num_questions) {
        que_img_url = [...que_img_url, ...Array(num_questions - que_img_url.length).fill(null)];
      } else if (que_img_url.length > num_questions) {
        que_img_url = que_img_url.slice(0, num_questions);
      }
    }

    // Update the list at the provided index with the URL from Supabase
    que_img_url[index] = fileUrl;

    // If your column stores the array as a string, stringify the array before updating.
    const updatedQueImgUrl = JSON.stringify(que_img_url);

    // Update the assessments table with the new que_img_url list
    const { error: updateError } = await supabase
      .from("assessments")
      .update({ que_img_url: updatedQueImgUrl })
      .eq("id", assessment_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Error updating assessment", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, que_img_url, fileUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
