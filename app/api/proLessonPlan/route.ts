import { NextResponse } from 'next/server';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { createClient } from "@/utils/supabase/server";
import { Document } from "@langchain/core/documents";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { logTokenUsage } from '@/utils/logTokenUsage';
import { z } from "zod";

// Reuse the same schemas from generateLessonPlan
const scheduleItemSchema = z.object({
    type: z.enum(["introduction", "mainContent", "activity", "conclusion", "review", "assessment"]),
    title: z.string(),
    content: z.string(),
    timeAllocation: z.number(),
  });
  
  const daySchema = z.object({
    day: z.number(),
    topicHeading: z.string(),
    learningOutcomes: z.array(z.string()),
    schedule: z.array(scheduleItemSchema),
    teachingAids: z.array(z.string()),
    assignment: z.object({
      description: z.string(),
      tasks: z.array(z.string()),
    }).required(),
    assessment: z.object({
      topic: z.string(),
      learningObjectives: z.array(z.string()),
    }).required(),
  });
  
  const assessmentSchema = z.object({
    topic: z.string(),
    type: z.string(),
    description: z.string(),
    evaluationCriteria: z.array(z.string()),
  });
  
  const lessonPlanSchema = z.object({
    days: z.array(daySchema),
    assessmentPlan: z.object({
      formativeAssessments: z.array(assessmentSchema),
      summativeAssessments: z.array(assessmentSchema),
      progressTrackingSuggestions: z.array(z.string()),
    }),
    remedialStrategies: z.array(
      z.object({
        targetGroup: z.string(),
        strategy: z.string(),
        description: z.string(),
      })
    ),
  });

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Extract all form fields
    const document = formData.get('document') as File;
    const chapterTopic = formData.get('chapterTopic');
    const classDuration = formData.get('classDuration');
    const numberOfDays = formData.get('numberOfDays');
    const learningObjectives = formData.get('learningObjectives');
    const lessonObjectives = formData.get('lessonObjectives');
    const additionalInstructions = formData.get('additionalInstructions');
    const userEmail = formData.get('userEmail');
    const studentId = formData.get('studentId');
    const createdByTeacher = formData.get('createdByTeacher');
    const assessmentId = formData.get('assessmentId');

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    let documentText = '';

    // Process PDF file if it exists
    if (document) {
      if (document.type === 'application/pdf') {
        try {
          // Convert File to ArrayBuffer and then to Blob
          const buffer = await document.arrayBuffer();
          const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
          
          // Use WebPDFLoader to load and parse the PDF
          const loader = new WebPDFLoader(pdfBlob);
          const docs: Document[] = await loader.load();
          
          // Combine all document contents
          documentText = docs.map(doc => doc.pageContent).join('\n');
          
        } catch (pdfError) {
          console.error('Error processing PDF:', pdfError);
          throw new Error('Failed to process PDF document');
        }
      }
    }

    // Log all form data and extracted PDF text
    console.log({
      documentText,
      formData: {
        chapterTopic,
        classDuration,
        numberOfDays,
        learningObjectives,
        lessonObjectives,
        additionalInstructions,
        userEmail,
        studentId,
        createdByTeacher,
        assessmentId
      }
    });

    // Create the request body for further processing
    const requestBody = {
      documentText,
      chapterTopic,
      classDuration,
      numberOfDays,
      learningObjectives,
      lessonObjectives,
      additionalInstructions,
      userEmail,
      studentId: studentId || null,
      createdByTeacher: createdByTeacher === 'true',
      assessmentId: assessmentId || null
    };

     // Create the RAG-enhanced prompt
     const prompt = `Create a complete ${numberOfDays}-day lesson plan for teaching ${chapterTopic}. Each class is ${classDuration} minutes long.
     Lesson Objectives: ${lessonObjectives || "To be determined based on the topic and document"}
     Learning Objectives: ${learningObjectives || "To be determined based on the topic and document"}
     ${additionalInstructions ? `Additional Instructions: ${additionalInstructions}` : ""}
     Include all days in the plan with detailed content for each session, incorporating relevant information from the provided document.
     Lesson plan should be made on this context: """ ${documentText} """`;

     // Generate the lesson plan using structured output with Zod schema
    const result = await generateObject({
        model: openai("gpt-4.1", {
          structuredOutputs: true,
        }),
        schema: lessonPlanSchema,
        prompt: prompt,
        schemaName: 'lessonPlan',
        schemaDescription: 'A complete, detailed lesson plan structure incorporating content from the provided document.'
      });
  
      // Get the generated lesson plan directly from the structured output
      const lessonPlan = result.object;
      
      // Log token usage if available
      if (result.usage) {
        await logTokenUsage(
          'RAG Lesson Planner',
          'GPT-4.1',
          result.usage.promptTokens,
          result.usage.completionTokens,
          user.email
        );
      }

      console.log("Storing RAG-based lesson plan in Supabase");
    
    // Store the lesson plan in the lesson_plans table
    const { data: insertedData, error: insertError } = await supabase
      .from("lesson_plans")
      .insert({
        chapter_topic: chapterTopic || "",
        class_duration: Number.parseInt(classDuration as string) || 0,
        number_of_days: Number.parseInt(numberOfDays?.toString() || "0"),
        learning_objectives: learningObjectives || [],
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: lessonPlan,
        user_email: userEmail,
        // document_id: selectedDocument, // Store reference to the source document
      })
      .select();

    if (insertError) {
      console.error("Error inserting lesson plan:", insertError);
      return NextResponse.json(
        { error: `Failed to save lesson plan: ${insertError.message}` },
        { status: 500 }
      );
    }


     // If an assessmentId was provided, update the assigned_assessments table with the lesson plan
     if (assessmentId) {
        console.log(`Updating assigned_assessments with lesson plan for assessment ID: ${assessmentId}`);
        
        const completeLessonPlanData = {
          id: insertedData[0].id,
          chapter_topic: chapterTopic,
          class_duration: Number.parseInt(classDuration as string) || 0,
          number_of_days: Number.parseInt(numberOfDays?.toString() || "0"),
          learning_objectives: learningObjectives,
          lesson_objectives: lessonObjectives,
          additional_instructions: additionalInstructions,
          plan_data: lessonPlan,
          created_at: new Date().toISOString(),
        };
  
        const { error: updateError } = await supabase
          .from("assigned_assessments")
          .update({ lesson_plan: completeLessonPlanData })
          .eq("assessment_id", assessmentId);
  
        if (updateError) {
          console.error("Error updating assigned_assessments with lesson plan:", updateError);
        } else {
          console.log("Successfully updated assigned_assessments with lesson plan data");
        }
      }
  
      if (!insertedData || insertedData.length === 0) {
        return NextResponse.json(
          { error: "Failed to retrieve inserted lesson plan data" },
          { status: 500 }
        );
      }
  
      console.log("RAG-based lesson plan stored successfully");
      return NextResponse.json(insertedData[0]);
    } catch (error) {
      console.error("Error generating RAG-based lesson plan:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  