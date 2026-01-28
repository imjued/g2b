
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking recent dates per agency...');

    const targets = [
        '국토교통부 국토지리정보원',
        '해양수산부 국립해양조사원'
    ];

    for (const agency of targets) {
        const { data, error } = await supabase
            .from('g2b_bids')
            .select('date, title')
            .eq('agency', agency)
            .order('date', { ascending: false })
            .limit(3);

        if (error) {
            console.error(error);
        } else {
            console.log(`[${agency}] Most recent:`);
            data.forEach(d => console.log(`  - ${d.date} | ${d.title}`));
        }
    }
}

run();
