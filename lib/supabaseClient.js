import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqltoqrzeorkcetvqeud.supabase.co'; // ← PON TU URL
const supabaseAnonKey = process.env.SUPABASE_KEY; // ← PON TU ANON KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);