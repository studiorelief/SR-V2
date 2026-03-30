/*
 *==========================================
 * SUPABASE - CLIENT
 *==========================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nsbivjygtwdtnijkvewq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYml2anlndHdkdG5pamt2ZXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjMxNDQsImV4cCI6MjA3MzkzOTE0NH0.8EX_2i6sWK2y9asKuKOnabp6Kjcfn1lhYiPyGGgX2sc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
