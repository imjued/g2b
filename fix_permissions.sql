
-- Fix Permission Issues
-- Run this in Supabase SQL Editor

-- 1. Disable RLS for both tables (Simplest fix for allowing sync to write)
ALTER TABLE public.g2b_bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.g2b_openings DISABLE ROW LEVEL SECURITY;

-- OR if you prefer policies:
-- create policy "Allow insert access" on public.g2b_bids for insert with check (true);
-- create policy "Allow insert access" on public.g2b_openings for insert with check (true);
