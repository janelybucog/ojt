import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuwkohlhedykvqcjudyq.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY // ✅ Correct Vite syntax
export const supabase = createClient(supabaseUrl, supabaseKey)
