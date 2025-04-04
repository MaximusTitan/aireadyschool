import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slides, theme, transition } = body;

    // Get the authenticated user from cookies
    const cookieStore = cookies();
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.email) {
      return NextResponse.json({
        success: false,
        error: "Authentication required to save presentation"
      });
    }

    // Save to the shared_presentations table
    const { data, error } = await supabase
      .from("shared_presentations")
      .insert([
        {
          title: title,
          slides: slides,
          theme: theme || "modern",
          transition: transition || "slide",
          email: user.email
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    return NextResponse.json({
      success: true,
      url: `/tools/presentation/view/${data.id}`,
      presentationId: data.id
    });
  } catch (error) {
    console.error("Error saving presentation:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to save presentation"
    }, { status: 500 });
  }
}