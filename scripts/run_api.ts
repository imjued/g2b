
import { fetchBids } from './api_client';
import { supabase } from '../src/lib/supabase';
import { sendDiscordAlert } from './notify_discord';

// Helper to filter by agency
const TARGET_AGENCY_CODE = '1613436';

async function processBids(bids: any[]) {
    // Filter
    const filtered = bids.filter(b => b.dminsttCd === TARGET_AGENCY_CODE);

    if (filtered.length === 0) return 0;

    let newCount = 0;
    for (const bid of filtered) {
        // Check if exists to prevent spamming alerts on re-run
        const { count } = await supabase
            .from('g2b_bids')
            .select('*', { count: 'exact', head: true })
            .eq('bid_no', bid.bidNtceNo);

        if (count !== null && count > 0) {
            continue; // Skip existing
        }

        const mappedBid = {
            bid_no: bid.bidNtceNo,
            title: bid.bidNtceNm,
            agency: bid.dminsttNm,
            date: bid.bidNtceDt,
            end_date: bid.bidClseDt,
            url: bid.bidNtceUrl,
            type: bid.bidNtceNo.includes('BK') ? 'service' : 'goods',
        };

        const { error } = await supabase
            .from('g2b_bids')
            .insert(mappedBid);

        if (!error) {
            newCount++;
            console.log(`[NEW] ${bid.bidNtceNm}`);
            await sendDiscordAlert(bid);
            // Rate limit to prevent Discord 429
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return newCount;
}

// Orchestrator Script for G2B API
async function run() {
    console.log('Starting G2B API Sync (Filtered)...');

    try {
        // 1. Fetch Goods (Fetch All then filter)
        // Use 500 rows for daily sync to catch target agency bids if they are not in top 100.
        const goodsData = await fetchBids('goods', undefined, undefined, 1, 500);
        console.log(`Fetched ${goodsData.items.length} Goods bids (Total available: ${goodsData.totalCount}). Processing...`);
        const goodsSaved = await processBids(goodsData.items);
        console.log(`Saved ${goodsSaved} matching Goods bids.`);

        // 2. Fetch Services
        const serviceData = await fetchBids('service', undefined, undefined, 1, 500);
        console.log(`Fetched ${serviceData.items.length} Service bids (Total available: ${serviceData.totalCount}). Processing...`);
        const servicesSaved = await processBids(serviceData.items);
        console.log(`Saved ${servicesSaved} matching Service bids.`);

        // 3. Fetch Global LiDAR Bids (Goods & Services) - No Agency Filter
        console.log('Fetching Global LiDAR Bids...');
        const lidarGoods = await fetchBids('goods', undefined, undefined, 1, 100, '라이다');
        const lidarServices = await fetchBids('service', undefined, undefined, 1, 100, '라이다');

        console.log(`Fetched ${lidarGoods.items.length} LiDAR Goods / ${lidarServices.items.length} LiDAR Services.`);

        // Process LiDAR items WITHOUT agency filter
        // We reuse processBids but trick it or create a new helper? 
        // processBids currently has hardcoded filter. Let's create a generic saver or update processBids.

        // Inline saving for LiDAR to avoid refactoring huge chunks
        const saveLidar = async (items: any[]) => {
            let count = 0;
            for (const bid of items) {
                const { count: exists } = await supabase
                    .from('g2b_bids')
                    .select('*', { count: 'exact', head: true })
                    .eq('bid_no', bid.bidNtceNo);

                if (exists !== null && exists > 0) continue;

                const mappedBid = {
                    bid_no: bid.bidNtceNo,
                    title: bid.bidNtceNm,
                    agency: bid.dminsttNm,
                    date: bid.bidNtceDt,
                    end_date: bid.bidClseDt,
                    url: bid.bidNtceUrl,
                    type: bid.bidNtceNo.includes('BK') ? 'service' : 'goods',
                };

                const { error } = await supabase.from('g2b_bids').insert(mappedBid);
                if (!error) {
                    count++;
                    console.log(`[NEW LiDAR] ${bid.bidNtceNm} (${bid.dminsttNm})`);
                    // Optional: Send discord alert for LiDAR too?
                }
            }
            return count;
        };

        const lidarGoodsSaved = await saveLidar(lidarGoods.items);
        const lidarServicesSaved = await saveLidar(lidarServices.items);
        console.log(`Saved ${lidarGoodsSaved + lidarServicesSaved} new LiDAR bids.`);

        console.log(`Sync Complete.`);

    } catch (e: any) {
        console.error('Fatal Error during Sync:', e);
        process.exit(1);
    }
}

run();
