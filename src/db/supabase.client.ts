import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../db/database.types.ts';

// Fallback values for local development when env vars are not set
// In production, SUPABASE_URL and SUPABASE_KEY must be set as environment variables
const supabaseUrl =
  import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
