/*
  =============================================
  config.js — SUPABASE CONNECTION
  =============================================
  This is the ONLY file you need to edit.
  Replace the two values below with your own
  from: Supabase Dashboard → Settings → API
  =============================================
*/
const SUPABASE_URL = 'https://ruhdhbjtdywcpjruhzas.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2XH_N6Ki_PWocqsXkvyhpA_Krru0tea';

// Creates the connection to your database.
// Every other JS file uses this 'supabase' object
// to read/write data.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
