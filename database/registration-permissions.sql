-- Run in the REDBLOOD project's SQL Editor, after creating public.donors.
-- Safe to repeat for the named policies/trigger in this file.
begin;
alter table public.donors
  add column if not exists map_consent boolean not null default false,
  add column if not exists map_latitude numeric,
  add column if not exists map_longitude numeric;
alter table public.donors drop constraint if exists donors_map_valid;
alter table public.donors add constraint donors_map_valid check (
  (map_latitude is null and map_longitude is null)
  or (map_consent = true and map_latitude is not null and map_longitude is not null
    and map_latitude between -90 and 90 and map_longitude between -180 and 180
    and mod(map_latitude, 0.02) = 0 and mod(map_longitude, 0.02) = 0)
);
alter table public.donors enable row level security;
revoke all on public.donors from anon, authenticated;
grant select, delete on public.donors to authenticated;
grant insert (user_id, name, age, sex, blood_group, phone, panchayath, ward,
  nearby_hospital, permanently_settled_alappuzha, donor_type, last_donation_date,
  share_phone, truth_confirmed, map_consent, map_latitude, map_longitude)
  on public.donors to authenticated;
grant update (name, age, sex, blood_group, phone, panchayath, ward,
  nearby_hospital, permanently_settled_alappuzha, donor_type, last_donation_date,
  share_phone, truth_confirmed, map_consent, map_latitude, map_longitude)
  on public.donors to authenticated;
drop policy if exists donors_read_own on public.donors;
drop policy if exists donors_insert_own on public.donors;
drop policy if exists donors_update_own on public.donors;
drop policy if exists donors_delete_own on public.donors;
create policy donors_read_own on public.donors for select to authenticated
  using ((select auth.uid()) = user_id);
create policy donors_insert_own on public.donors for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');
create policy donors_update_own on public.donors for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy donors_delete_own on public.donors for delete to authenticated
  using ((select auth.uid()) = user_id);
create or replace function public.validate_donor_changes()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.last_donation_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Last donation date cannot be in the future.';
  end if;
  if tg_op = 'UPDATE' then
    if (to_jsonb(new) - array['status', 'updated_at']) is distinct from
       (to_jsonb(old) - array['status', 'updated_at']) then
      new.status := 'pending';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.validate_donor_changes() from public, anon, authenticated;
drop trigger if exists validate_donor_before_save on public.donors;
create trigger validate_donor_before_save before insert or update on public.donors
  for each row execute function public.validate_donor_changes();
commit;
