
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
    // Debug: Log first item to check fields
    if (items.length > 0) {
        // console.log('Checking Item:', items[0].dminsttNm, items[0].dminsttCd);
    }

    // Filter
    const filtered = items.filter(b => {
        const match = isTargetAgency(b.dminsttCd, b.dminsttNm);
        if (b.dminsttNm === '산림청' && !match) {
            console.log(`[DEBUG] 산림청 MISSED! Code: '${b.dminsttCd}' vs Target: ${TARGET_AGENCIES.includes(b.dminsttCd)}`);
        }
        return match;
    });

    if (filtered.length === 0) return 0;

    let newCount = 0;
    for (const item of filtered) {
        const { count } = await supabase
            .from('g2b_openings')
            .select('*', { count: 'exact', head: true })
            .eq('bid_no', item.bidNtceNo);

        if (count !== null && count > 0) continue;

        // Parse Winner Info
        // Format: Company^BizNo^Rep^Amount^Rate
        let winner = undefined;
        let price = undefined;

        if (item.opengCorpInfo) {
            const parts = item.opengCorpInfo.split('^');
            if (parts.length >= 1) winner = parts[0];
            if (parts.length >= 4) price = parts[3];
        }

        // Construct URL if missing
        // Standard G2B Detail URL
        const url = item.bidNtceUrl || `http://www.g2b.go.kr:8081/ep/invitation/publish/bidInfoDtl.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd || '00'}&releaseYn=Y&taskClCd=${item.bidClsfcNo || '1'}`;

        const mapped = {
            bid_no: item.bidNtceNo,
            title: item.bidNtceNm,
            agency: item.dminsttNm,
            date: item.opengDt,
            winner: winner,
            price: price,
            url: url,
            type: 'opening' // Generic type for openings
        };

        const { error } = await supabase
            .from('g2b_openings')
            .insert(mapped);

        if (!error) {
            newCount++;
            console.log(`[NEW OPENING] ${item.bidNtceNm} (${item.progrsDivCdNm})`);
        } else {
            console.error('[INSERT ERROR]', error.message, mapped.bid_no);
        }
    }
    return newCount;
}

// Helper to fetch all pages for a type
async function processTypeBatch(type: 'goods' | 'service') {
    let pageNo = 1;
    const numOfRows = 999; // Max safe limit
    let totalSaved = 0;

    console.log(`Starting Batch Sync for ${type}...`);

    while (true) {
        // Fetch Bids
        const data = await fetchBids(type, undefined, undefined, pageNo, numOfRows);
        console.log(`[${type}] Page ${pageNo}: Fetched ${data.items.length} items (Total in API: ${data.totalCount})`);

        if (data.items.length === 0) break;

        const savedCount = await processBids(data.items);
        totalSaved += savedCount;

        // Fetch Openings (Corresponding to the same type logic, but we need to do separately since they are different APIs)
        // Note: Openings might have different volume, but we will iterate similarly or just do one big fetch if openings are fewer.
        // Actually, let's keep openings separate as per original logic but also paginated.

        // Break if we fetched fewer than requested (last page)
        if (data.items.length < numOfRows) break;

        // Safety Break (Prevent infinite run if API is huge)
        if (pageNo >= 50) {
            console.log(`[${type}] Reached safety limit of 50 pages.`);
            break;
        }

        pageNo++;
        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 200));
    }
    return totalSaved;
}

// Helper for Openings Pagination
async function processOpeningBatch(type: 'goods' | 'service') {
    let pageNo = 1;
    const numOfRows = 999;
    let totalSaved = 0;

    console.log(`Starting Opening Sync for ${type}...`);

    while (true) {
        const data = await fetchOpeningResults(type, undefined, undefined, pageNo, numOfRows);
        console.log(`[Opening-${type}] Page ${pageNo}: Fetched ${data.items.length} items`);

        if (data.items.length === 0) break;

        const savedCount = await processOpenings(data.items);
        totalSaved += savedCount;

        if (data.items.length < numOfRows) break;
        if (pageNo >= 50) break;

        pageNo++;
        await new Promise(r => setTimeout(r, 200));
    }
    return totalSaved;
}

export async function syncBids() {
    console.log('Starting G2B API Sync (Full Pagination)...');

    try {
        // 1. Fetch & Process Goods
        const goodsSaved = await processTypeBatch('goods');

        // 2. Fetch & Process Services
        const servicesSaved = await processTypeBatch('service');

        // 3. Fetch & Process Openings
        const openingsSaved = (await processOpeningBatch('goods')) + (await processOpeningBatch('service'));

        return {
            success: true,
            totalNew: goodsSaved + servicesSaved + openingsSaved,
            details: `Goods: ${goodsSaved}, Services: ${servicesSaved}, Openings: ${openingsSaved}`
        };

    } catch (e: any) {
        console.error('Fatal Error during Web Sync:', e);
        return {
            success: false,
            error: e.message
        };
    }
}
