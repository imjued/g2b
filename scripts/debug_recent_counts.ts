
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking recent bid counts...');

    const targets = [
        '국토교통부 국토지리정보원',
        '해양수산부 국립해양조사원',
        '산림청',
        '산림청 국립산림과학원'
    ];

    for (const agency of targets) {
        const { count, error } = await supabase
            .from('g2b_bids')
            .select('*', { count: 'exact', head: true })
            .eq('agency', agency);

        if (error) console.error(error);
        console.log(`[${agency}]: ${count} records`);
    }

    // Also check wildcard matches to catch variations
    console.log('--- Wildcard Checks ---');
    const wildcards = ['국토지리정보원', '국립해양조사원', '산림청', '국립산림과학원'];
    for (const w of wildcards) {
        const { data } = await supabase
            .from('g2b_bids')
            .select('agency')
            .ilike('agency', `%${w}%`)
            .limit(5);

        if (data && data.length > 0) {
            console.log(`Matched wildcard "${w}": "${data[0].agency}"`);
        } else {
            console.log(`No match for wildcard "${w}"`);
        }
    }
}

run();
