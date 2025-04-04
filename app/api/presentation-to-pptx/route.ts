import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const presentationId = url.searchParams.get("id");

    if (!presentationId) {
      return NextResponse.json({ error: "Presentation ID is required" }, { status: 400 });
    }

    // Get presentation data from database
    const cookieStore = cookies();
    const supabase = await createClient();
    
    const { data: presentation, error } = await supabase
      .from("shared_presentations")
      .select("*")
      .eq("id", presentationId)
      .single();

    if (error || !presentation) {
      return NextResponse.json({ 
        error: "Presentation not found" 
      }, { status: 404 });
    }

    // Create a new presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.layout = "LAYOUT_16x9";
    pptx.theme = presentation.theme || "OFFICE_THEME";

    // Add slides
    if (presentation.slides && Array.isArray(presentation.slides)) {
      for (const slide of presentation.slides) {
        const pptxSlide = pptx.addSlide();
        
        // Add title
        if (slide.title) {
          pptxSlide.addText(slide.title, { 
            x: 0.5, 
            y: 0.5, 
            w: '90%',
            fontSize: 24,
            bold: true,
            color: "363636" 
          });
        }
        
        // Add content
        if (slide.content) {
          pptxSlide.addText(slide.content, { 
            x: 0.5, 
            y: 1.5, 
            w: '45%',
            fontSize: 14,
            color: "666666" 
          });
        }
        
        // Add bullet points
        if (slide.bulletPoints && Array.isArray(slide.bulletPoints) && slide.bulletPoints.length > 0) {
          pptxSlide.addText(
            slide.bulletPoints.map((point: string) => ({ text: point, bullet: true })),
            { 
              x: 0.5, 
              y: slide.content ? 3 : 1.5, 
              w: '45%',
              fontSize: 14,
              color: "666666" 
            }
          );
        }
        
        // Add image if available
        if (slide.image) {
          try {
            pptxSlide.addImage({ 
              path: slide.image, 
              x: '55%', 
              y: 1.5, 
              w: '40%',
              h: 3 
            });
          } catch (err) {
            console.error("Failed to add image:", err);
            // Continue without the image
          }
        }
      }
    }

    // Generate the PPTX file
    const fileName = `${presentation.title || "presentation"}.pptx`;
    
    // Create buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    
    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      }
    });
  } catch (error) {
    console.error("Error generating PPTX:", error);
    return NextResponse.json({ 
      error: "Failed to generate PPTX file" 
    }, { status: 500 });
  }
}