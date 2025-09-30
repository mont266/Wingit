import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'));


// In this environment, process.env variables are not being populated from a .env file,
// which causes the application to crash on startup. To prevent this, we will
// use placeholder values if the environment variables are missing and log a warning.
// The application will load but will not be functional until SUPABASE_URL and
// SUPABASE_KEY are correctly provided in the execution environment.
if (!isSupabaseConfigured) {
    console.warn(
        "Warning: Missing Supabase credentials. Please provide SUPABASE_URL and " +
        "SUPABASE_KEY in your environment variables. The application will not function correctly."
    );
}

// Use placeholders to prevent the createClient call from failing and crashing the app.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder.key'
);