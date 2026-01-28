import { supabase } from '@/lib/supabase';
import Dashboard from '@/app/components/Dashboard';

// Force dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Keywords for partial matching to handle full names like "국토교통부 국토지리정보원"
  const targetKeywords = [
    '국토지리정보원',
    '국립해양조사원',
    '산림청',
    '국립산림과학원'
  ];

  const { data: allBids } = await supabase
    .from('g2b_bids')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);

  const bids = (allBids || [])
    .filter(b => targetKeywords.some(keyword => b.agency.includes(keyword)))
    .slice(0, 100);

  const { data: allOpenings } = await supabase
    .from('g2b_openings')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);

  const openings = (allOpenings || [])
    .filter(o => targetKeywords.some(keyword => o.agency.includes(keyword)))
    .slice(0, 100);

  const { data: lidarData } = await supabase
    .from('g2b_bids')
    .select('*')
    .ilike('title', '%라이다%')
    .order('date', { ascending: false })
    .limit(100);

  const lidar = lidarData || [];

  return <Dashboard bids={bids} openings={openings} lidar={lidar} />;
}
