
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking g2b_openings content...');

    const { count, error } = await supabase
        .from('g2b_openings')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(error);
        return;
    }
    console.log(`Total rows in g2b_openings: ${count}`);

    const { data } = await supabase
        .from('g2b_openings')
        .select('agency, date')
        .order('date', { ascending: false })
        .limit(20);

    console.log('Recent Openings:');
    data?.forEach(d => console.log(`- [${d.agency}] ${d.date}`));
}

run();
