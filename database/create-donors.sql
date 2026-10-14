-- Only for a NEW database where public.donors does not exist.
-- Your current Redblood project already has this table; skip this file there.
begin;
create table public.donors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  age integer not null check (age between 18 and 65),
  sex text not null check (sex in ('M', 'F', 'O')),
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  phone text not null unique check (phone ~ '^[0-9]{10,15}$'),
  panchayath text not null check (char_length(trim(panchayath)) between 2 and 120),
  ward text not null check (char_length(trim(ward)) between 1 and 60),
  nearby_hospital text not null default 'TD Medical College, Vandanam',
  permanently_settled_alappuzha boolean not null,
  donor_type text not null check (donor_type in ('first', 'regular', 'occasional')),
  last_donation_date date,
  share_phone boolean not null default false,
  truth_confirmed boolean not null check (truth_confirmed = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donation_history_matches check (
    (donor_type = 'first' and last_donation_date is null)
    or (donor_type in ('regular', 'occasional') and last_donation_date is not null)
  )
);
alter table public.donors enable row level security;
revoke all on public.donors from anon, authenticated;
commit;
