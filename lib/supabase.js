// lib/supabase.js
// This file sets up the connection to your Supabase database
// Think of it as the "bridge" between your app and the database

import { createClient } from '@supabase/supabase-js';

// Get the database URL and key from environment variables
// These are like login credentials for your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create the Supabase client
// This is what we'll use to talk to the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the service role key (for backend operations)
// This is used in API routes where we need extra permissions
export const getServiceRoleClient = () => {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};
