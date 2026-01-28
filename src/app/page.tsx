import { supabase } from '@/lib/supabase';
import Dashboard from '@/app/components/Dashboard';

// Force dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Construct OR query for Supabase: "agency.ilike.%Key1%,agency.ilike.%Key2%..."
  const targetKeywords = [
    '국토지리정보원',
    '국립해양조사원',
    '산림청',
    '국립산림과학원'
  ];
  const orQuery = targetKeywords.map(k => `agency.ilike.%${k}%`).join(',');

  const { data: bidsData } = await supabase
    .from('g2b_bids')
    .select('*')
    .or(orQuery)
    .order('date', { ascending: false })
    .limit(100);

  const bids = bidsData || [];

  const { data: openingsData } = await supabase
    .from('g2b_openings')
    .select('*')
    .or(orQuery)
    .order('date', { ascending: false })
    .limit(100);

  const openings = openingsData || [];

  const { data: lidarData } = await supabase
    .from('g2b_bids')
    .select('*')
    .ilike('title', '%라이다%')
    .order('date', { ascending: false })
    .limit(100);

  const lidar = lidarData || [];

  return <Dashboard bids={bids} openings={openings} lidar={lidar} />;
}
