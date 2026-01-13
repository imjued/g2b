import { supabase } from '@/lib/supabase';
import Dashboard from '@/app/components/Dashboard';

// Force dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: bidsData } = await supabase
    .from('g2b_bids')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);

  const { data: openingsData } = await supabase
    .from('g2b_openings')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);

  const bids = bidsData || [];
  const openings = openingsData || [];

  return <Dashboard bids={bids} openings={openings} />;
}
