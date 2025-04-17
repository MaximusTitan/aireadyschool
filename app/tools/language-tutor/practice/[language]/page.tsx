'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { use } from 'react'

const languages = ['english', 'hindi', 'spanish', 'french', 'german']

export default function PracticeWithAI({ params }: { params: Promise<{ language: string }> }) {
  const { language } = use(params)
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  if (!languages.includes(language)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Language not supported
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsLoading(true)
    const userMessage = message
    setMessage('')
    setConversation(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke('language-tutor', {
        body: {
          message: userMessage,
          language,
          conversation: conversation
        }
      })

      if (error) throw error

      setConversation(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      console.error('Error:', err)
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Practice {language.charAt(0).toUpperCase() + language.slice(1)} with AI
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
                  }`}
                >
                  <p className="text-gray-800">{msg.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Type your message in ${language}...`}
                className="min-h-[100px]"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 