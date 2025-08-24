import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://yqltoqrzeorkcetvqeud.supabase.co'; // ← PON TU URL
const supabaseAnonKey = process.env.SUPABASE_KEY; // ← PON TU ANON KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);