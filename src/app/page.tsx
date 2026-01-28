import { supabase } from '@/lib/supabase';
import Dashboard from '@/app/components/Dashboard';

// Force dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  const targetAgencies = [
    '국토교통부 국토지리정보원',
    '해양수산부 국립해양조사원',
    '산림청',
    '산림청 국립산림과학원'
  ];

  const { data: bidsData } = await supabase
    .from('g2b_bids')
    .select('*')
    .in('agency', targetAgencies)
    .order('date', { ascending: false })
    .limit(100);

  const { data: openingsData } = await supabase
    .from('g2b_openings')
    .select('*')
    .in('agency', targetAgencies)
    .order('date', { ascending: false })
    .limit(100);

  const { data: lidarData } = await supabase
    .from('g2b_bids')
    .select('*')
    .ilike('title', '%라이다%')
    .order('date', { ascending: false })
    .limit(100);

  const bids = bidsData || [];
  const openings = openingsData || [];
  const lidar = lidarData || [];

  return <Dashboard bids={bids} openings={openings} lidar={lidar} />;
}
