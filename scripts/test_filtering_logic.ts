
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Verifying client-side partial filtering logic...');

    // Fetch 1000 items like the page does
    const { data: allBids } = await supabase
        .from('g2b_bids')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000);

    const items = allBids || [];
    console.log(`Fetched ${items.length} total items.`);

    const targetKeywords = [
        '국토지리정보원',
        '국립해양조사원',
        '산림청',
        '국립산림과학원'
    ];

    // Emulate strict vs partial
    const filteredPartial = items.filter(b => targetKeywords.some(k => b.agency.includes(k)));

    console.log(`Partial Match Results: ${filteredPartial.length} items found.`);

    // Breakdown by keyword
    const breakdown = {};
    filteredPartial.forEach(b => {
        const k = targetKeywords.find(kw => b.agency.includes(kw)) || 'Unknown';
        breakdown[k] = (breakdown[k] || 0) + 1;
    });

    console.table(breakdown);
}

run();
