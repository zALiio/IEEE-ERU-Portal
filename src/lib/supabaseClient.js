import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn('Supabase env appears placeholder or missing — check your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
