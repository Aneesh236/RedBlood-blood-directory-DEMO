-- Add no-login registration without removing existing access policies.
-- Intended for the private donors table created in the previous step.
begin;
alter table public.donors alter column user_id drop not null;
alter table public.donors
  add column if not exists map_consent boolean not null default false,
  add column if not exists map_latitude numeric,
  add column if not exists map_longitude numeric;
alter table public.donors enable row level security;
do $$ begin
 if not exists (select 1 from pg_constraint where conrelid='public.donors'::regclass and conname='donors_map_valid') then
  alter table public.donors add constraint donors_map_valid check (
    (map_latitude is null and map_longitude is null)
    or (map_consent=true and map_latitude is not null and map_longitude is not null
      and map_latitude between -90 and 90 and map_longitude between -180 and 180
      and mod(map_latitude,0.02)=0 and mod(map_longitude,0.02)=0)
  );
 end if;
end $$;
grant insert (name, age, sex, blood_group, phone, panchayath, ward,
  nearby_hospital, permanently_settled_alappuzha, donor_type, last_donation_date,
  share_phone, truth_confirmed, map_consent, map_latitude, map_longitude)
  on public.donors to anon;
do $$ begin
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='donors' and policyname='donors_submit_public') then
  create policy donors_submit_public on public.donors for insert to anon
    with check (user_id is null and status='pending' and truth_confirmed=true);
 end if;
end $$;
create or replace function public.validate_public_donor_submission()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.last_donation_date > (now() at time zone 'Asia/Kolkata')::date then
  raise exception 'Last donation date cannot be in the future.';
 end if;
 return new;
end;
$$;
revoke all on function public.validate_public_donor_submission() from public, anon, authenticated;
do $$ begin
 if not exists (select 1 from pg_trigger where tgrelid='public.donors'::regclass and tgname='validate_public_donor_insert' and not tgisinternal) then
  create trigger validate_public_donor_insert before insert on public.donors
    for each row execute function public.validate_public_donor_submission();
 end if;
end $$;
commit;
