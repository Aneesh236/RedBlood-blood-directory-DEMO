// Isolated PostgreSQL test using @electric-sql/pglite 0.3.14.
// Supabase Auth is stubbed locally; no remote database connection is used.
const {PGlite}=require('@electric-sql/pglite');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    insert into auth.users values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');`);
  const sql=name=>readFileSync(join(__dirname,'../database',name),'utf8');
  await db.exec(sql('create-donors.sql'));
  await db.exec(sql('registration-permissions.sql'));
  await db.exec(sql('registration-permissions.sql')); // Repeatable setup.
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);`);
  const insert=`insert into public.donors(user_id,name,age,sex,blood_group,phone,panchayath,ward,permanently_settled_alappuzha,donor_type,truth_confirmed)`;
  await db.exec(`${insert} values('11111111-1111-1111-1111-111111111111','Donor One',28,'M','O+','9999999999','Champakkulam','4',true,'first',true)`);
  assert.equal((await db.query('select status from public.donors')).rows[0].status,'pending');
  await assert.rejects(db.exec("update public.donors set status='approved'"),/permission denied/);
  await assert.rejects(db.exec("update public.donors set user_id='22222222-2222-2222-2222-222222222222'"),/permission denied/);
  await assert.rejects(db.exec("update public.donors set map_latitude=9.481,map_longitude=76.34,map_consent=true"),/donors_map_valid/);
  await assert.rejects(db.exec("update public.donors set donor_type='regular',last_donation_date='2099-01-01'"),/future/);
  await db.exec(`select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);`);
  assert.equal((await db.query('select * from public.donors')).rows.length,0);
  await assert.rejects(db.exec(`${insert} values('11111111-1111-1111-1111-111111111111','Wrong owner',28,'M','O+','8888888888','Champakkulam','4',true,'first',true)`),/row-level security/);
  assert.equal((await db.query("update public.donors set name='Wrong owner' returning id")).rows.length,0);
  assert.equal((await db.query('delete from public.donors returning id')).rows.length,0);
  await db.exec("reset role; update public.donors set status='approved'; set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);");
  await db.exec("update public.donors set name='Updated donor',map_consent=true,map_latitude=9.48,map_longitude=76.34");
  assert.equal((await db.query('select status from public.donors')).rows[0].status,'pending');
  await assert.rejects(db.exec('update public.donors set map_consent=false'),/donors_map_valid/);
  await db.exec('update public.donors set map_consent=false,map_latitude=null,map_longitude=null');
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.query('select * from public.donors'),/permission denied/);
  await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);");
  assert.equal((await db.query('delete from public.donors returning id')).rows.length,1);
  console.log('Passed: SQL setup/repeat, owner insert/read/edit/delete, cross-user isolation, approval/ownership protection, reapproval, future-date and map-consent constraints, anonymous denial.');
 } finally {await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
