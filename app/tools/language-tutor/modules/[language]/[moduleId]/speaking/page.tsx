'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/lib/hooks/useSupabase';
import SpeechPractice from '@/components/SpeechPractice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Define interfaces to properly type our data
interface SpeakingActivityContent {
  scenarios: string[];
  key_phrases: string[];
}

interface SpeakingActivity {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: SpeakingActivityContent;
  type: string;
  difficulty: number;
}

export default function SpeakingPracticePage() {
  const params = useParams();
  const language = params.language as string;
  const moduleId = params.moduleId as string;
  const supabase = useSupabase();
  
  const [activity, setActivity] = useState<SpeakingActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([]);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('module_id', moduleId)
          .eq('type', 'speaking')
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          // Parse the content if it comes as a string
          const parsedContent = typeof data.content === 'string' 
            ? JSON.parse(data.content) 
            : data.content;
            
          // Create properly typed activity object with explicit type casting
          const typedActivity: SpeakingActivity = {
            id: String(data.id),
            module_id: String(data.module_id),
            title: String(data.title),
            description: String(data.description),
            content: parsedContent as SpeakingActivityContent,
            type: String(data.type),
            difficulty: Number(data.difficulty)
          };
          
          setActivity(typedActivity);
          setCompleted(new Array(typedActivity.content.scenarios.length).fill(false));
        }
      } catch (err) {
        console.error('Error fetching speaking activity:', err);
        setError('Failed to load speaking activity. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (moduleId) {
      fetchActivity();
    }
  }, [moduleId, supabase]);

  const handleComplete = (isCorrect: boolean) => {
    if (isCorrect && activity) {
      setCompleted(prev => {
        const updated = [...prev];
        updated[currentScenarioIndex] = true;
        return updated;
      });
    }
  };

  const goToNextScenario = () => {
    if (activity && currentScenarioIndex < activity.content.scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    }
  };

  const goToPreviousScenario = () => {
    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(currentScenarioIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'No speaking activity found for this module.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentScenario = activity.content.scenarios[currentScenarioIndex];
  const currentPhrase = activity.content.key_phrases[currentScenarioIndex];
  const allCompleted = completed.every(status => status);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">{activity.title}</h1>
      <p className="text-center mb-8">{activity.description}</p>
      
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Scenario {currentScenarioIndex + 1}: {currentScenario}</h2>
            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <p className="font-medium">Key phrase to practice:</p>
              <p className="text-purple-700 text-lg mt-2">{currentPhrase}</p>
            </div>
            
            <SpeechPractice 
              prompt={currentPhrase}
              onTranscript={(transcript) => {
                // Compare transcript with currentPhrase
                const isCorrect = transcript.toLowerCase().includes(currentPhrase.toLowerCase());
                handleComplete(isCorrect);
              }}
              onError={(error) => console.error('Speech recognition error:', error)}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={goToPreviousScenario}
          disabled={currentScenarioIndex === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Previous
        </Button>
        
        <div className="text-center">
          <span className="text-sm">
            {currentScenarioIndex + 1} of {activity.content.scenarios.length}
          </span>
          {allCompleted && (
            <p className="text-green-600 mt-2">All scenarios completed!</p>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={goToNextScenario}
          disabled={currentScenarioIndex === activity.content.scenarios.length - 1}
          className="flex items-center gap-2"
        >
          Next <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
} 