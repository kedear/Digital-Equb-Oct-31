
import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// The Supabase URL and Key have been hardcoded below for this environment
// to ensure the application runs correctly.
// In a real-world/production application, you should always use environment variables
// or a secrets management service to protect your credentials.
// -----------------

const supabaseUrl = "https://waehbnvkpjiiylpixmkk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZWhibnZrcGppaXlscGl4bWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjkwMzIsImV4cCI6MjA3NzM0NTAzMn0.-XQQNtTLz04yL3nd4pwtzNdc7wOXAWl0BMbj_CNsuWI";

if (!supabaseUrl || !supabaseKey) {
  // This check is kept as a safeguard but should not be triggered with the hardcoded values.
  throw new Error("Supabase URL and Anon Key are still missing.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);