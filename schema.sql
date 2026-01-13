-- Create table for storing G2B Bid Announcements
create table if not exists public.g2b_bids (
    bid_no text primary key, -- Bid Notice Number (e.g. R25BK01242593)
    title text not null,     -- Bid Name
    agency text,             -- Agency Name
    date timestamp with time zone,      -- Posting Date
    end_date timestamp with time zone,  -- Closing Date
    url text,                -- Direct Link to G2B
    type text,               -- 'goods' or 'service'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Enable RLS (Row Level Security) if needed, but for backend script usually Service Role is used.
alter table public.g2b_bids enable row level security;

-- Policy to allow read access (adjust as needed for frontend)
create policy "Allow public read access" on public.g2b_bids for select using (true);

-- Create table for storing G2B Bid Opening Results
create table if not exists public.g2b_openings (
    bid_no text primary key, -- Bid Notice Number
    title text not null,     -- Bid Name
    agency text,             -- Agency Name
    date timestamp with time zone,      -- Opening Date
    winner text,             -- Successful Bidder (if available)
    price text,              -- Winning Price (if available)
    url text,                -- Link
    type text,               -- 'goods' or 'service'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for openings
alter table public.g2b_openings enable row level security;

-- Policy to allow public read access for openings
create policy "Allow public read access" on public.g2b_openings for select using (true);
