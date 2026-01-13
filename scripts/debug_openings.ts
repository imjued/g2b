
import { fetchOpeningResults, BidOpening } from '../src/lib/api_client';

const TARGET_AGENCIES = [
    '1613436', // 국토지리정보원
    '1192136', // 국립해양조사원
    '1400000', // 산림청
];

function isTargetAgency(code: string, name: string): boolean {
    // Just return true for '산림' to see all related agencies
    if (name && name.includes('산림')) return true;
    return false;
}

// Helper: Get Date String YYYYMMDDHHMM
function getDateString(daysOffset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}0000`; // Start of day
}

async function run() {
    const startDate = getDateString(-10);
    console.log(`Fetching Openings since ${startDate} (Max 1000)...`);

    console.log('Fetching Goods Openings...');
    // fetchOpeningResults(type, startDate, endDate, pageNo, numOfRows)
    const resultGoods = await fetchOpeningResults('goods', startDate, undefined, 1, 1000);
    const matchedGoods = resultGoods.items.filter(i => isTargetAgency(i.dminsttCd, i.dminsttNm));
    console.log(`Found ${resultGoods.totalCount} goods openings. Fetched: ${resultGoods.items.length}. Matches (산림): ${matchedGoods.length}`);
    if (matchedGoods.length > 0) {
        const names = Array.from(new Set(matchedGoods.map(m => m.dminsttNm)));
        console.log('Agencies found:', names);
        // console.log(matchedGoods.map(m => `${m.dminsttNm}: ${m.bidNtceNm}`));
    }

    console.log('Fetching Service Openings...');
    const resultService = await fetchOpeningResults('service', startDate, undefined, 1, 1000);
    const matchedServices = resultService.items.filter(i => isTargetAgency(i.dminsttCd, i.dminsttNm));
    console.log(`Found ${resultService.totalCount} service openings. Fetched: ${resultService.items.length}. Matches (산림): ${matchedServices.length}`);
    if (matchedServices.length > 0) {
        const names = Array.from(new Set(matchedServices.map(m => m.dminsttNm)));
        console.log('Agencies found:', names);
    }
}

run();
