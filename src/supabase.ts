import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhnhmuisqurygybbsnio.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobmhtdWlzcXVyeWd5YmJzbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTc4MjAsImV4cCI6MjA3MjAzMzgyMH0.nNhAh2f7NGew2VAUD2VzId9Tbpfas0n2SI_SAHYyh1s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)