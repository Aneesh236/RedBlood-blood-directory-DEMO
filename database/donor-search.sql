-- Public listing fields for approved, consenting donors only.
begin;
grant select (name, blood_group, phone, panchayath)
  on public.donors to anon;
do $$ begin
 if not exists (select 1 from pg_policies where schemaname='public'
   and tablename='donors' and policyname='donors_search_public') then
  create policy donors_search_public on public.donors for select to anon
  using (
    status='approved' and share_phone=true
    and (
      (donor_type='first' and age<=60)
      or (donor_type in ('regular','occasional')
        and last_donation_date + (case when sex='M' then 90 else 120 end)
          <= (now() at time zone 'Asia/Kolkata')::date)
    )
  );
 end if;
end $$;
commit;
