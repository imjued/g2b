
import './init_env';

import { fetchBids } from './api_client';
import { supabase } from '../src/lib/supabase';
import { sendDiscordAlert } from './notify_discord';

// Helper to filter by agency
const TARGET_AGENCY_CODE = '1613436';

async function processAgencyBids(bids: any[]) {
    // Filter by Agency
    const filtered = bids.filter(b => b.dminsttCd === TARGET_AGENCY_CODE);
    return await saveBids(filtered, 'Agency');
}

async function processLidarBids(bids: any[]) {
    // Filter by Keyword (Global)
    console.log(`[LiDAR check] Scanning ${bids.length} items...`);
    const keywords = ['라이다', 'lidar', 'LIDAR', 'LiDAR'];
    const filtered = bids.filter(b => {
        const title = (b.bidNtceNm || '').toLowerCase();
        return keywords.some(k => title.includes(k.toLowerCase()));
    });
    console.log(`[LiDAR check] Found ${filtered.length} matches.`);
    return await saveBids(filtered, 'LiDAR');
}

async function saveBids(items: any[], source: string) {
    if (items.length === 0) return 0;

    let newCount = 0;
    for (const bid of items) {
        // Check if exists
        const { count } = await supabase
            .from('g2b_bids')
            .select('*', { count: 'exact', head: true })
            .eq('bid_no', bid.bidNtceNo);

        if (count !== null && count > 0) continue;

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
            console.log(`[NEW ${source}] ${bid.bidNtceNm} (${bid.dminsttNm})`);
            await sendDiscordAlert(bid);
            // Rate limit
            await new Promise(r => setTimeout(r, 200));
        } else {
            console.error(`Error saving ${bid.bidNtceNo}:`, error);
        }
    }
    return newCount;
}

// Helper to getting formatted YYYYMMDDHHMM
function toApiDate(d: Date, time: string): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${time}`;
}

async function fetchAllForPeriod(type: 'goods' | 'service', daysBack: number) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysBack);

    const sStr = toApiDate(startDate, '0000');
    const eStr = toApiDate(today, '2359');

    console.log(`Fetching ${type} from ${sStr} to ${eStr}...`);

    let page = 1;
    const rows = 900; // API max usually 999
    let hasMore = true;
    let totalProcessed = 0;
    let totalAgencySaved = 0;
    let totalLidarSaved = 0;

    while (hasMore) {
        console.log(`  Page ${page}...`);
        const data = await fetchBids(type, sStr, eStr, page, rows);
        const items = data.items;

        if (!items || items.length === 0) {
            hasMore = false;
            break;
        }

        totalProcessed += items.length;

        // Process
        totalAgencySaved += await processAgencyBids(items);
        totalLidarSaved += await processLidarBids(items);

        // Pagination Check
        if (items.length < rows) {
            hasMore = false;
        } else {
            page++;
            // Safety limit (e.g. 100 pages)
            if (page > 100) {
                console.log('  Reached Page 100 limit. Stopping.');
                hasMore = false;
            }
            // Rate limit between pages
            await new Promise(r => setTimeout(r, 500));
        }
    }
    console.log(`Finished ${type}. Processed ${totalProcessed} items. Saved: ${totalAgencySaved} Agency / ${totalLidarSaved} LiDAR.`);
}

// Orchestrator Script for G2B API
async function run() {
    console.log('Starting G2B API Sync (Full Daily Scan)...');

    try {
        await fetchAllForPeriod('goods', 1);   // Today + Yesterday
        await fetchAllForPeriod('service', 1); // Today + Yesterday
        console.log(`Sync Complete.`);

    } catch (e: any) {
        console.error('Fatal Error during Sync:', e);
        process.exit(1);
    }
}

run();
