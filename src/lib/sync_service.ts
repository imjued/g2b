
import { fetchBids, BidItem } from './api_client';
import { supabase } from '@/lib/supabase';
import { sendDiscordAlert } from './notify_discord';

// Helper to filter by agency
const TARGET_AGENCIES = [
    '1613436', // 국토지리정보원
    '1192136', // 국립해양조사원
    '1400000', // 산림청
    // Agency Code for National Institute of Forest Science is not available initially,
    // so we will match by name string '국립산림과학원'
];

function isTargetAgency(code: string, name: string): boolean {
    if (TARGET_AGENCIES.includes(code)) return true;
    if (name && name.includes('국립산림과학원')) return true;
    return false;
}

async function processBids(bids: BidItem[]) {
    // Filter
    const filtered = bids.filter(b => isTargetAgency(b.dminsttCd, b.dminsttNm));

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

import { fetchOpeningResults, BidOpening } from './api_client';

async function processOpenings(items: BidOpening[]) {
    // Filter
    const filtered = items.filter(b => isTargetAgency(b.dminsttCd, b.dminsttNm));

    if (filtered.length === 0) return 0;

    let newCount = 0;
    for (const item of filtered) {
        const { count } = await supabase
            .from('g2b_openings')
            .select('*', { count: 'exact', head: true })
            .eq('bid_no', item.bidNtceNo);

        if (count !== null && count > 0) continue;

        const mapped = {
            bid_no: item.bidNtceNo,
            title: item.bidNtceNm,
            agency: item.dminsttNm,
            date: item.opengDt,
            winner: item.sucbidderNm,
            price: item.sucbidAmt,
            url: item.bidNtceUrl,
            type: 'opening' // Generic type for openings
        };

        const { error } = await supabase
            .from('g2b_openings')
            .insert(mapped);

        if (!error) {
            newCount++;
            console.log(`[NEW OPENING] ${item.bidNtceNm}`);
        }
    }
    return newCount;
}

export async function syncBids() {
    console.log('Starting G2B API Sync (Web Trigger)...');

    try {
        // 1. Fetch Goods (Fetch All then filter)
        const goodsData = await fetchBids('goods', undefined, undefined, 1, 500);
        const goodsSaved = await processBids(goodsData.items);

        // 2. Fetch Services
        const serviceData = await fetchBids('service', undefined, undefined, 1, 500);
        const servicesSaved = await processBids(serviceData.items);

        // 3. Fetch Openings
        const openingGoods = await fetchOpeningResults('goods', undefined, undefined, 1, 500);
        const openingServices = await fetchOpeningResults('service', undefined, undefined, 1, 500);

        const openingsSaved = (await processOpenings(openingGoods.items)) + (await processOpenings(openingServices.items));

        return {
            success: true,
            goodsFound: goodsData.items.length,
            goodsSaved,
            servicesFound: serviceData.items.length,
            servicesSaved,
            openingsFound: openingGoods.items.length + openingServices.items.length,
            openingsSaved,
            totalNew: goodsSaved + servicesSaved + openingsSaved
        };

    } catch (e: any) {
        console.error('Fatal Error during Web Sync:', e);
        return {
            success: false,
            error: e.message
        };
    }
}
