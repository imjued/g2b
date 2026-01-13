
import axios from 'axios';

const API_KEY = '735e7266667ff39b2d183fbaa1db6050b69f723157d8ec3fa0bbcf8c3aab20e6';
const BASE_URL = 'https://apis.data.go.kr/1230000/as/ScsbidInfoService';

async function fetchScsbid(type: 'goods' | 'service') {
    const operation = type === 'goods' ? 'getScsbidListInfoThng' : 'getScsbidListInfoServc';
    const url = `${BASE_URL}/${operation}`;
    const params = {
        serviceKey: API_KEY,
        numOfRows: 999,
        pageNo: 1,
        inqryDiv: 1,
        inqryBgnDt: '202601120000',
        inqryEndDt: '202601122359',
        type: 'json'
    };

    console.log(`Fetching ${operation} for Jan 12...`);
    try {
        const res = await axios.get(url, { params });
        const items = res.data?.response?.body?.items || [];
        console.log(`Fetched ${items.length} items`);

        const keywords = ['산림', '지리', '해양'];
        const targets = items.filter((i: any) => keywords.some(k => i.dminsttNm?.includes(k)));

        targets.forEach((i: any) => {
            console.log(`[MATCH] ${i.dminsttNm}: ${i.bidNtceNm} (Date: ${i.opengDt || i.scsbidDt})`);
        });

        if (targets.length === 0) console.log('No matches found.');

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

async function run() {
    await fetchScsbid('goods');
    await fetchScsbid('service');
}

run();
