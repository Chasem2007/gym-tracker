/*
  =============================================
  config.js — SUPABASE CONNECTION
  =============================================
  Your Supabase credentials are plugged in below.
  
  HOW THIS WORKS:
  The CDN script in index.html creates a global
  'supabase' object. We pull 'createClient' out
  of it, then create our database connection
  stored in 'db'. All other JS files use 'db'
  to talk to Supabase.
  =============================================
*/
const SUPABASE_URL = 'https://ruhdhbjtdywcpjruhzas.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2XH_N6Ki_PWocqsXkvyhpA_Krru0tea';

// 'createClient' is a function inside the global 'supabase' object
// that the CDN script loaded. We pull it out, then use it to
// create our actual database connection.
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
