'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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
  } | null;
  generated_story: string | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('story_history')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const handleLoad = (historyId: string) => {
    router.push(`/tools/video-story-generator?history=${historyId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-rose-500">Story History</h1>
        <Link href="/tools/video-story-generator">
          <Button variant="outline">Create New Story</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {item.story_inputs?.storyTitle || 'Untitled Story'}
                  </h3>
                  <p className="text-gray-600">
                    Genre: {item.story_inputs?.storyGenre || 'Unknown'}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleLoad(item.id)}
                  >
                    Load
                  </Button>
                  <Link 
                    href={`/tools/video-story-generator?view=${item.id}`}
                    className="inline-block"
                  >
                    <Button>View</Button>
                  </Link>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
