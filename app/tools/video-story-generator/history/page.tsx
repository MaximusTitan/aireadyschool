'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HistoryItem {
  id: string;
  created_at: string;
  story_inputs: {
    storyTitle: string;
    storyGenre: string;
    mainCharacters: string;
    storyDuration: string;
  };
  generated_story: string;
  scenes: any[];
  generated_images: any[];
  generated_videos: Record<string, { url: string }>;
  generated_audios: Record<string, { url: string; script: string }>;
  user_email?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();

      // If no session, show empty state
      if (!sessionData.session) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch stories without email filter first
      const { data, error } = await supabase
        .from('story_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const handleLoad = async (item: HistoryItem) => {
    try {
      localStorage.setItem('loadedStoryData', JSON.stringify({
        storyInputs: item.story_inputs,
        generatedStory: item.generated_story,
        scenes: item.scenes || [],
        generatedImages: item.generated_images || [],
        generatedVideos: item.generated_videos || {},
        generatedAudios: item.generated_audios || {}
      }));

      router.push(`/tools/video-story-generator?history=${item.id}`);
    } catch (error) {
      console.error('Error loading story:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-rose-700">Story History</h1>
        <div className="flex gap-4">
          <Link href="/tools/video-story-generator">
            <Button className="bg-black hover:bg-black/90 text-white">
              Create New Story
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6">
          {history.length > 0 ? (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {item.story_inputs?.storyTitle || 'Untitled Story'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-black/10 text-black rounded-md text-sm">
                        {item.story_inputs?.storyGenre || 'No Genre'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                        {item.story_inputs?.storyDuration}s Duration
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {item.generated_story?.substring(0, 150)}...
                    </p>
                    <div className="flex gap-3 mt-4">
                      {item.scenes && (
                        <span className="text-sm text-gray-500">
                          {item.scenes.length} Scenes
                        </span>
                      )}
                      {item.generated_images && (
                        <span className="text-sm text-gray-500">
                          {item.generated_images.length} Images
                        </span>
                      )}
                      {item.generated_videos && (
                        <span className="text-sm text-gray-500">
                          {Object.keys(item.generated_videos).length} Videos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleLoad(item)}
                      className="bg-black/10 text-black hover:bg-black/20"
                    >
                      Load & Edit
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Created: {new Date(item.created_at).toLocaleDateString()} at{' '}
                  {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-600 mb-2">
                {!supabase.auth.getSession() 
                  ? "View your story generation history here after creating stories"
                  : "No stories found"}
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/tools/video-story-generator">
                  <Button className="bg-black hover:bg-black/90 text-white">
                    Create Your First Story
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
