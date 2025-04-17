'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Module } from '@/app/tools/language-tutor/types'
import Link from 'next/link'

const languages = ['english', 'hindi', 'spanish', 'french', 'german']

export default function ModulePage() {
  const params = useParams()
  const language = params.language as string
  const moduleId = params.moduleId as string
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!languages.includes(language)) {
      setError('Invalid language')
      setLoading(false)
      return
    }

    async function fetchModule() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single<Module>()

        if (error) throw error
        setModule(data)
      } catch (err) {
        console.error('Error fetching module:', err)
        setError('Failed to load module')
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [language, moduleId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Module not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">{module.name}</h1>
        <p className="text-center text-gray-600 mb-8">{module.description}</p>
        
        <div className="grid grid-cols-1 gap-6">
          <Link
            href={`/tools/language-tutor/modules/${language}/${moduleId}/speaking`}
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
          >
            <h2 className="text-2xl font-semibold mb-2">Speaking Practice</h2>
            <p className="text-gray-600">Practice your speaking skills with interactive exercises</p>
          </Link>
        </div>
      </div>
    </div>
  )
} 