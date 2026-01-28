
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking Unique Agencies in DB...');

    // Fetch all agencies (inefficient but works for small DB)
    const { data, error } = await supabase
        .from('g2b_bids')
        .select('agency');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const unique = Array.from(new Set(data.map(d => d.agency)));
    console.log(`Found ${unique.length} unique agencies:`);
    unique.forEach(a => console.log(`- "${a}"`));
}

run();
