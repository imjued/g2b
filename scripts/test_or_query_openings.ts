
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Verifying .or() query specifically on g2b_openings...');

    const targetKeywords = [
        '국토지리정보원',
        '국립해양조사원',
        '산림청',
        '국립산림과학원'
    ];
    // Exact construction used in page.tsx
    const orQuery = targetKeywords.map(k => `agency.ilike.%${k}%`).join(',');
    console.log(`Query: ${orQuery}`);

    const { data, count, error } = await supabase
        .from('g2b_openings')
        .select('*', { count: 'exact', head: false })
        .or(orQuery);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Matched ${data.length} items (Total Count: ${count}).`);

    // Group by agency to see distribution
    const counts = {};
    data.forEach(d => {
        const a = d.agency || 'Unknown';
        counts[a] = (counts[a] || 0) + 1;
    });
    console.table(counts);

    // Deep dive into one NGII item if missing
    if (!JSON.stringify(counts).includes('국토지리정보원')) {
        console.log('NGII is missing! Checking raw data for exact string...');
        const { data: raw } = await supabase.from('g2b_openings').select('agency').limit(5);
        console.log('Sample Raw Agencies:', raw);
    }
}

run();
