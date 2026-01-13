
import { fetchOpeningResults } from '../src/lib/api_client';

async function run() {
    console.log('Scanning Jan 12, 2026 for Missing Openings...');
    const targetDate = '202601120000';
    const endDate = '202601122359';

    // Fetch Goods
    console.log('[Goods]');
    let res = await fetchOpeningResults('goods', targetDate, endDate, 1, 999);
    let items = res.items || [];
    filterAndLog(items);

    // Fetch Services
    console.log('[Services]');
    res = await fetchOpeningResults('service', targetDate, endDate, 1, 999);
    items = res.items || [];
    filterAndLog(items);
}

function filterAndLog(items: any[]) {
    const keywords = ['산림', '지리', '해양'];
    // Strict codes from sync_service
    const strictCodes = ['1613436', '1192136', '1400000'];

    // Find generic matches
    const potentialMatches = items.filter(i => {
        return keywords.some(k => i.dminsttNm?.includes(k)) ||
            strictCodes.includes(i.dminsttCd);
    });

    console.log(`Total Items Fetched: ${items.length}`);
    console.log(`Potential Matches (Keyword/Code): ${potentialMatches.length}`);

    potentialMatches.forEach(item => {
        const isStrictMatch = strictCodes.includes(item.dminsttCd) || item.dminsttNm?.includes('국립산림과학원');
        console.log(`- ${item.dminsttNm} (${item.dminsttCd}): ${item.bidNtceNm} [Status: ${item.progrsDivCdNm}] [StrictMatch? ${isStrictMatch}]`);
    });
}

run();
