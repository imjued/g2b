
import { supabase } from '@/lib/supabase';
import Dashboard from '@/app/components/Dashboard';

// Force dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Keywords for partial matching
  const targetKeywords = [
    '국토지리정보원',
    '국립해양조사원',
    '산림청',
    '국립산림과학원'
  ];

  // 1. Fetch RAW data (High limit to catch everything)
  const { data: allBidsRaw } = await supabase
    .from('g2b_bids')
    .select('*')
    .order('date', { ascending: false })
    .limit(2000);

  const { data: allOpeningsRaw } = await supabase
    .from('g2b_openings')
    .select('*')
    .order('date', { ascending: false })
    .limit(2000);

  const { data: lidarData } = await supabase
    .from('g2b_bids')
    .select('*')
    .ilike('title', '%라이다%')
    .order('date', { ascending: false })
    .limit(100);

  // 2. Client-Side Filtering (Robust)
  const filterByKeywords = (items: any[]) => {
    if (!items) return [];
    return items.filter(item => {
      const agency = (item.agency || '').trim(); // Safety
      return targetKeywords.some(keyword => agency.includes(keyword));
    }).slice(0, 100);
  };

  const bids = filterByKeywords(allBidsRaw);
  const openings = filterByKeywords(allOpeningsRaw);
  const lidar = lidarData || [];

  // Debug (Server Log)
  console.log(`[Dashboard] Fetched ${allBidsRaw?.length} bids, ${allOpeningsRaw?.length} openings.`);
  console.log(`[Dashboard] Filtered to ${bids.length} bids, ${openings.length} openings.`);

  return <Dashboard bids={bids} openings={openings} lidar={lidar} />;
}
