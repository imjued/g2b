
import { supabase } from '../src/lib/supabase';

async function checkDb() {
    const { data, error } = await supabase
        .from('g2b_openings')
        .select('*')
        .limit(20);

    if (error) console.error(error);
    console.log('Openings Count:', data?.length);
    if (data && data.length > 0) {
        console.log('First Record:', data[0]);
    } else {
        console.log('No records found.');
    }
}

checkDb();
