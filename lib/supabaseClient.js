import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://yqltoqrzeorkcetvqeud.supabase.co'; // ← PON TU URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbHRvcXJ6ZW9ya2NldHZxZXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODM3ODQsImV4cCI6MjA3MTU1OTc4NH0.4jlDs7B9lo1WDQ5spDeyP--lYmqiAH6w6CfT9P4Z6Fk'; // ← PON TU ANON KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);