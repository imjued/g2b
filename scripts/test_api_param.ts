
import axios from 'axios';
import './init_env'; // Load env headers if needed, mainly for consistency

const API_KEY = '735e7266667ff39b2d183fbaa1db6050b69f723157d8ec3fa0bbcf8c3aab20e6'; // Hardcoded as per file
const BASE_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoThng';
// Helper: Get Date String YYYYMMDDHHMM
function getDateString(daysOffset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}0000`; // Start of day
}

async function testParam(paramName: string, value: string) {
    console.log(`Testing param: ${paramName} = ${value}`);
    const params: any = {
        serviceKey: API_KEY,
        numOfRows: 5,
        pageNo: 1,
        inqryDiv: 1,
        inqryBgnDt: getDateString(-30), // 30 days back
        inqryEndDt: getDateString(1),
        type: 'json',
    };
    params[paramName] = value;

    try {
        const response = await axios.get(BASE_URL, { params });
        const body = response.data.response.body;
        const items = body.items || [];
        console.log(`Found ${items.length} items.`);
        items.forEach((item: any) => {
            console.log(`- ${item.bidNtceNm} (${item.dminsttNm})`);
        });

        const match = items.find((i: any) => i.bidNtceNm.includes(value));
        if (match) console.log('✅ MATCH FOUND');
        else console.log('❌ NO MATCH (Filter ignored?)');

    } catch (e: any) {
        console.error('Error:', e.message);
    }
    console.log('---');
}

async function run() {
    await testParam('bidNtceNm', '라이다');
    await testParam('bidNtceNM', '라이다'); // Case variation?
}

run();
