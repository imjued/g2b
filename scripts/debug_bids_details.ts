
import axios from 'axios';

const API_KEY = '735e7266667ff39b2d183fbaa1db6050b69f723157d8ec3fa0bbcf8c3aab20e6';
const BASE_URL = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService';
const TARGET_NAME = '국토지리정보원';

async function run() {
    console.log('Fetching Service Bids for 2026/01/12...');
    const url = `${BASE_URL}/getBidPblancListInfoServc`;
    const params = {
        serviceKey: API_KEY,
        numOfRows: 999,
        pageNo: 1,
        inqryDiv: 1,
        inqryBgnDt: '202601120000',
        inqryEndDt: '202601122359',
        type: 'json',
    };

    try {
        const response = await axios.get(url, { params });
        const items = response.data?.response?.body?.items || [];

        const matches = items.filter((i: any) => i.dminsttNm.includes(TARGET_NAME));

        console.log(`Matches Found: ${matches.length}`);
        matches.forEach((m: any) => {
            // Log Status and Opening Date
            console.log(`- [${m.bidNtceNm}]`);
            console.log(`  Bid Status: ${m.bidPrcsSttusNm}`); // e.g., 개찰완료, 입찰중
            console.log(`  Opening Date: ${m.opengDt}`);
        });

    } catch (e: any) {
        console.error(e.message);
    }
}

run();
