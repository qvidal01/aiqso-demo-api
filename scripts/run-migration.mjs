#!/usr/bin/env node
// Run this script to create the analytics tables in Supabase
// Usage: node scripts/run-migration.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xowxijjibjxuuivfmxwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd3hpamppYmp4dXVpdmZteHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1OTQyMCwiZXhwIjoyMDc5NDM1NDIwfQ.8kw_Yo3XF9EugSnH05-rJmT-WDAW4dLjvGccDfvsRSY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('Creating analytics tables in Supabase...\n');

  // Test inserting a record to website_events - this will fail if table doesn't exist
  const { error: testError } = await supabase
    .from('website_events')
    .select('*')
    .limit(1);

  if (testError && testError.code === 'PGRST205') {
    console.log('Tables do not exist. Please run the SQL migration in Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/xowxijjibjxuuivfmxwm');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy and paste the contents of: supabase/migrations/001_analytics_tables.sql');
    console.log('   (located in the aiqso-website project)');
    console.log('5. Click "Run"');
    console.log('\nAlternatively, copy the SQL from:');
    console.log('/Users/cyberque/projects/aiqso-website/supabase/migrations/001_analytics_tables.sql');
    return;
  }

  if (testError) {
    console.error('Unexpected error:', testError);
    return;
  }

  console.log('✅ Tables already exist! Migration not needed.');

  // Test all three tables
  const tables = ['website_events', 'newsletter_subscribers', 'website_feedback'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }
}

runMigration().catch(console.error);
