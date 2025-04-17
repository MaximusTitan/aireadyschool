'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { useSupabase } from '@/lib/hooks/useSupabase'
import type { Activity } from '@/app/tools/language-tutor/types'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

interface ActivityContent {
  formal?: string[];
  informal?: string[];
  examples?: string[];
  words?: string[];
  pairs?: Record<string, string>[];
  audio_urls?: string[];
  scenarios?: string[];
  key_phrases?: string[];
  questions?: { q: string; a: string }[];
}

function VocabularyActivity({ content }: { content: ActivityContent }) {
  if (!content.words || !content.examples) {
    return <p className="text-red-600">Missing required content for vocabulary activity</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.words.map((word: string, index: number) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow border border-pink-100">
            <p className="font-semibold text-pink-600">{word}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold text-pink-600 mb-2">Example Usage:</h4>
        <ul className="list-disc list-inside space-y-2">
          {content.examples.map((example: string, index: number) => (
            <li key={index} className="text-gray-600">{example}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MatchingActivity({ content }: { content: ActivityContent }) {
  if (!content.pairs) {
    return <p className="text-red-600">Missing required content for matching activity</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {content.pairs.map((pair: Record<string, string>, index: number) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow border border-pink-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-pink-600">{Object.keys(pair)[0]}</span>
              <span className="text-gray-600">{Object.values(pair)[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListeningActivity({ content }: { content: ActivityContent }) {
  if (!content.words || !content.audio_urls) {
    return <p className="text-red-600">Missing required content for listening activity</p>;
  }

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      alert('Unable to play audio. The audio file may not exist or is not accessible.');
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {content.words.map((word: string, index: number) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow border border-pink-100 flex items-center justify-between">
            <span className="font-semibold text-pink-600">{word}</span>
            <button 
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              onClick={() => playAudio(content.audio_urls![index])}
            >
              Play 🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpeakingActivity({ content }: { content: ActivityContent }) {
  if (!content.scenarios || !content.key_phrases) {
    return <p className="text-red-600">Missing required content for speaking activity</p>;
  }

  return (
    <div className="space-y-4">
      {content.scenarios.map((scenario: string, index: number) => {
        const keyPhrase = content.key_phrases![index];
        return (
          <div key={index} className="p-4 bg-white rounded-lg shadow border border-pink-100">
            <h4 className="font-semibold text-pink-600 mb-2">Scenario {index + 1}:</h4>
            <p className="text-gray-600">{scenario}</p>
            <div className="mt-2">
              <p className="text-sm text-pink-600">Key phrases to practice:</p>
              <p className="text-gray-600">{keyPhrase}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuizActivity({ content }: { content: ActivityContent }) {
  if (!content.questions) {
    return <p className="text-red-600">Missing required content for quiz activity</p>;
  }

  return (
    <div className="space-y-4">
      {content.questions.map((question: { q: string; a: string }, index: number) => (
        <div key={index} className="p-4 bg-white rounded-lg shadow border border-pink-100">
          <p className="font-semibold text-pink-600 mb-2">{question.q}</p>
          <p className="text-gray-600">Answer: {question.a}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityContent({ activity }: { activity: Activity }) {
  const contentComponents = {
    vocabulary: VocabularyActivity,
    matching: MatchingActivity,
    listening: ListeningActivity,
    speaking: SpeakingActivity,
    quiz: QuizActivity,
  };

  const ContentComponent = contentComponents[activity.type as keyof typeof contentComponents];

  if (!ContentComponent) {
    return <p className="text-red-600">Unsupported activity type: {activity.type}</p>;
  }

  return <ContentComponent content={activity.content} />;
}

export default function ActivityPage() {
  const params = useParams()
  const language = params.language as string
  const moduleId = params.moduleId as string
  const activityId = params.activityId as string
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single<Activity>()

        if (error) throw error
        if (data) setActivity(data)
      } catch (err) {
        console.error('Error fetching activity:', err)
        setError('Failed to load activity. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [activityId, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Activity not found
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-4xl p-8 space-y-8">
        <h1 className="text-4xl font-bold text-center text-pink-600 mb-8">{activity.title}</h1>
        <div className="p-6 bg-white rounded-lg shadow-lg border border-pink-100">
          <p className="text-gray-600 mb-4">{activity.description}</p>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </span>
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
              Difficulty: {activity.difficulty}
            </span>
          </div>
          <ActivityContent activity={activity} />
        </div>
      </div>
    </div>
  )
} 