
// Hardcoded credentials found in env.sample
process.env.SUPABASE_URL = 'https://xvoojccqmcmynbvhlitj.supabase.co';
process.env.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2b29qY2NxbWNteW5idmhsaXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDM3NTUsImV4cCI6MjA4MjMxOTc1NX0.BB40q53jAVfBrSfZo62ZVviEGG95DUfm4FvvqVz_5jQ';

import { syncBids } from '../src/lib/sync_service';

async function run() {
    console.log('Running Manual Sync with Creds...');
    const result = await syncBids();
    console.log('Sync Result:', result);
    process.exit(0);
}

run();
