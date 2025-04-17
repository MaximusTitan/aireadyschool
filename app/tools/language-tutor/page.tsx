"use client";

import Link from 'next/link'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const languages = [
  {
    id: 'english',
    name: 'English',
    flag: '🇬🇧',
    description: 'Learn English, the global language of business and communication'
  },
  {
    id: 'hindi',
    name: 'Hindi',
    flag: '🇮🇳',
    description: 'Discover Hindi, one of India\'s most widely spoken languages'
  },
  {
    id: 'spanish',
    name: 'Spanish',
    flag: '🇪🇸',
    description: 'Master Spanish, spoken by over 500 million people worldwide'
  },
  {
    id: 'french',
    name: 'French',
    flag: '🇫🇷',
    description: 'Explore French, the language of love and culture'
  },
  {
    id: 'german',
    name: 'German',
    flag: '🇩🇪',
    description: 'Learn German, a key language in Europe\'s economic powerhouse'
  }
];

export default function LanguageTutor() {
  const [activeTab, setActiveTab] = useState("modules")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Language Tutor</h1>
        
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="practice">Practice with AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {languages.map((language) => (
                <Link
                  key={language.id}
                  href={`/tools/language-tutor/modules/${language.id}`}
                  className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{language.flag}</span>
                    <h2 className="text-2xl font-semibold">{language.name}</h2>
                  </div>
                  <p className="text-gray-600">{language.description}</p>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="practice">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {languages.map((language) => (
                <Link
                  key={language.id}
                  href={`/tools/language-tutor/practice/${language.id}`}
                  className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{language.flag}</span>
                    <h2 className="text-2xl font-semibold">{language.name}</h2>
                  </div>
                  <p className="text-gray-600">Practice {language.name} with AI-powered conversations and exercises</p>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}