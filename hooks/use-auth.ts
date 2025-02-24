import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useAuth() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setEmail(user?.email ?? null)
      } catch (error) {
        console.error('Error fetching user:', error)
        setEmail(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { email, loading }
}
