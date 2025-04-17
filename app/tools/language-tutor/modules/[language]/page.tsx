'use client'

import { useEffect, useState } from 'react'
import { useRouter, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Module } from '@/app/tools/language-tutor/types'
import Link from 'next/link'
import { use } from 'react'

const languages = ['english', 'hindi', 'spanish', 'french', 'german']

export default function LanguageModule({ params }: { params: Promise<{ language: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { language } = use(params)

  useEffect(() => {
    async function fetchModules() {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('language', language)
          .returns<Module[]>()

        if (error) throw error
        setModules(data || [])
      } catch (err) {
        console.error('Error fetching modules:', err)
        setError('Failed to load modules. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (languages.includes(language)) {
      fetchModules()
    }
  }, [language, supabase])

  if (!languages.includes(language)) {
    notFound()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Choose a Module</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/tools/language-tutor/modules/${language}/${module.id}`}
              className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              <h2 className="text-2xl font-semibold mb-2">{module.name}</h2>
              <p className="text-gray-600">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}