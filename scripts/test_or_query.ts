
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Verifying Supabase .or() query logic...');

    // Construct OR query
    const targetKeywords = [
        '국토지리정보원',
        '국립해양조사원',
        '산림청',
        '국립산림과학원'
    ];
    const orQuery = targetKeywords.map(k => `agency.ilike.%${k}%`).join(',');
    console.log(`Query String: ${orQuery}`);

    const { data, error } = await supabase
        .from('g2b_bids')
        .select('agency, title')
        .or(orQuery)
        .order('date', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Fetched ${data.length} items.`);
    data.forEach(d => console.log(`- [${d.agency}] ${d.title}`));
}

run();
