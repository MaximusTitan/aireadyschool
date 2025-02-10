import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Innertube } from 'youtubei.js/web' // Add this import

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const youtube = await Innertube.create({
  lang: 'en',
  location: 'US',
  retrieve_player: false,
}) // Initialize Innertube

// Enhanced getVideoId to handle more YouTube URL formats
async function getVideoId(url: string): Promise<string> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    } else if (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com'
    ) {
      // Handle different pathnames for YouTube URLs
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v') || ''
      } else if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1]
      } else if (urlObj.pathname.startsWith('/v/')) {
        return urlObj.pathname.split('/v/')[1]
      } else {
        throw new Error('Invalid YouTube URL structure')
      }
    } else {
      throw new Error('Invalid YouTube URL')
    }
  } catch (error) {
    console.error(`getVideoId Error: ${(error as Error).message} for URL: ${url}`)
    throw new Error('Invalid YouTube URL')
  }
}

// Modify fetchTranscript to handle ThumbnailView error
const fetchTranscript = async (videoId: string): Promise<string[]> => {
  let info;
  try {
    info = await youtube.getInfo(videoId);
  } catch (err) {
    if (err instanceof Error && err.message.includes("ThumbnailView")) {
      console.warn("Transcript fetch skipped due to ThumbnailView error.");
      return []; // Return empty transcript to prevent error if fetching from DB
    }
    throw err;
  }
  const transcriptData = await info.getTranscript();
  if (!transcriptData.transcript?.content?.body?.initial_segments) {
    throw new Error('Transcript content or body is null');
  }
  return transcriptData.transcript.content.body.initial_segments.map(
    (segment) => segment.snippet.text ?? ''
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, summary, chatMessage, title, description, email } = body // Include 'title', 'description', and 'email' in destructuring

    // Validate presence of either 'url' or 'summary'
    if ((!url || typeof url !== 'string') && (!summary || typeof summary !== 'string')) {
      console.error('Invalid or missing URL and summary in request body:', body)
      return NextResponse.json(
        { error: 'Either a valid URL or summary must be provided in the request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!url || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Define TypeScript interface for video_analysis
    interface VideoAnalysis {
      id: number;
      analysis_results: string;
    }

    // Chat handling
    if (chatMessage) { // Changed condition to only check for chatMessage
      let analysis: VideoAnalysis | undefined = undefined;

      if (summary && typeof summary === 'string') {
        // Use provided summary directly
        analysis = { id: 0, analysis_results: summary }; // dummy id
      } else {
        // Retrieve the video_analysis_id and analysis_results
        const { data, error: analysisError } = await supabase
          .from('video_analyses')
          .select('id, analysis_results')
          .eq('video_link', url)
          .single();

        if (analysisError || !data) { // If analysis not found, perform analysis
          // ...existing transcript fetching and analysis code...
          let transcript: string[];
          try {
            const videoId = await getVideoId(url); // Extract videoId from URL
            transcript = await fetchTranscript(videoId); // Pass videoId to fetchTranscript
          } catch (error) {
            return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
              { status: 400 }
            );
          }

          // Join transcript array into a single string
          const transcriptString = transcript.join(' ');
          const analysisCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that creates concise video summaries. Focus on the main points and key takeaways."
              },
              {
                role: "user",
                content: `Please provide a concise summary of this video transcript: ${transcriptString}`
              }
            ],
            max_tokens: 2000
          });
          const videoSummary = analysisCompletion.choices[0].message.content;

          const { data: insertData, error: insertError } = await supabase
            .from('video_analyses')
            .insert([{
              video_link: url,
              analysis_results: videoSummary,
              title: title || '',
              description: description || '',
              user_email: email
            }])
            .select();

          if (insertError || !insertData) throw insertError || new Error('Failed to save video analysis');
          analysis = insertData[0] as VideoAnalysis;
        } else {
          analysis = data;
        }
      }

      if (!analysis) {
        return NextResponse.json(
          { error: 'Failed to retrieve or perform video analysis' },
          { status: 500 }
        );
      }

      // Removed chat history saving; only generate and return reply
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant discussing a YouTube video. Provide detailed answers about the video content based on the summary."
            },
            {
              role: "user",
              content: `Based on the following video summary, please answer the question below:\n\nSummary: ${analysis.analysis_results}\n\nQuestion: ${chatMessage}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        });

        return NextResponse.json({
          reply: completion.choices[0].message.content
        });
      } catch (chatError) {
        console.error('Chat error:', chatError);
        return NextResponse.json(
          { error: 'Failed to process chat message' },
          { status: 500 }
        );
      }
    }

    // Video analysis handling
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    let transcript: string[]
    try {
      const videoId = await getVideoId(url) // Extract videoId from URL
      transcript = await fetchTranscript(videoId) // Pass videoId to fetchTranscript
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
        { status: 400 }
      )
    }

    // Join transcript array into a single string
    const transcriptString = transcript.join(' ')

    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise video summaries. Focus on the main points and key takeaways."
        },
        {
          role: "user",
          content: `Please provide a concise summary of this video transcript: ${transcriptString}`
        }
      ],
      max_tokens: 2000
    })

    const videoSummary = analysisCompletion.choices[0].message.content

    const { data, error } = await supabase
      .from('video_analyses')
      .insert([{
        video_link: url,
        analysis_results: videoSummary,
        title: title || '',
        description: description || '',
        user_email: email
      }])
      .select()

    if (error) throw error

    return NextResponse.json({
      summary: videoSummary,
      transcript: transcriptString,
      savedAnalysis: data[0]
    })
  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    )
  }
}