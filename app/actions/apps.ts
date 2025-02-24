'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createApp(data: { 
  name: string, 
  description: string, 
  flow: { inputPrompt: string } 
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: app } = await supabase
    .from('ai_applications')
    .insert({
      name: data.name,
      description: data.description,
      user_id: user.id
    })
    .select()
    .single()

  if (app) {
    await supabase
      .from('app_flows')
      .insert({
        app_id: app.id,
        input_prompt: data.flow.inputPrompt
      })
  }

  revalidatePath('/tools/builder')
  return app
}

export async function getApp(id: string) {
  let supabase = await createClient()

  const { data: app } = await supabase
    .from('ai_applications')
    .select(`
      *,
      app_flows:app_flows (
        input_prompt
      )
    `)
    .eq('id', id)
    .single()

  if (!app || !app.app_flows?.[0]) {
    return null;
  }

  return {
    id: app.id,
    name: app.name,
    description: app.description,
    flow: {
      inputPrompt: app.app_flows[0].input_prompt
    }
  }
}

export async function getUserApps() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: apps } = await supabase
    .from('ai_applications')
    .select(`
      *,
      app_flows:app_flows (
        input_prompt
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return apps || []
}
