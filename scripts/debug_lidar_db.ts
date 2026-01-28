
import './init_env';
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking Supabase Connection...');
    const { data: count, error: countError } = await supabase
        .from('g2b_bids')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error connecting to DB:', countError);
        return;
    }
    console.log(`Total rows in g2b_bids: ${count}`);

    console.log('Querying for "라이다"...');
    const { data: lidar, error } = await supabase
        .from('g2b_bids')
        .select('bid_no, title, agency, date')
        .ilike('title', '%라이다%')
        .limit(10);

    if (error) {
        console.error('Error querying LiDAR:', error);
    } else {
        console.log(`Found ${lidar.length} LiDAR rows.`);
        lidar.forEach(row => {
            console.log(`- [${row.bid_no}] ${row.title} (${row.agency})`);
        });
    }
}

run();
