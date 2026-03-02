/*
 *==========================================
 * SUPABASE - CLIENT
 *==========================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfxjnywzuizxwcwhlhtz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeGpueXd6dWl6eHdjd2hsaHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjkzMjQsImV4cCI6MjA4ODA0NTMyNH0.fxcXSeW_a1-TYvqyMi2VSzwV2hpLx09cp5JxRCquKvk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
