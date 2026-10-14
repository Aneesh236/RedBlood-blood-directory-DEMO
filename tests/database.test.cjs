// Isolated PostgreSQL test. No real donor or account is created.
const {PGlite}=require('@electric-sql/pglite');
const {readFileSync}=require('node:fs');const {join}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try {
  await db.exec('create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);');
  const sql=name=>readFileSync(join(__dirname,'../database',name),'utf8');
  await db.exec(sql('create-donors.sql'));
  await db.exec(sql('registration-permissions.sql'));
  await db.exec(sql('registration-permissions.sql'));
  await db.exec('set role anon');
  const insert=`insert into public.donors(name,age,sex,blood_group,phone,panchayath,ward,permanently_settled_alappuzha,donor_type,truth_confirmed)`;
  await db.exec(`${insert} values('Public Donor',28,'M','O+','9999999999','Champakkulam','4',true,'first',true)`);
  await assert.rejects(db.query('select * from public.donors'),/permission denied/);
  await assert.rejects(db.exec("update public.donors set name='Other person'"),/permission denied/);
  await assert.rejects(db.exec('delete from public.donors'),/permission denied/);
  await assert.rejects(db.exec("insert into public.donors(status) values('approved')"),/permission denied/);
  await assert.rejects(db.exec("insert into public.donors(user_id) values(null)"),/permission denied/);
  await assert.rejects(db.exec(`${insert} values('Duplicate donor',28,'M','O+','9999999999','Champakkulam','4',true,'first',true)`),/unique/);
  await assert.rejects(db.exec(`${insert} values('False donor',28,'M','O+','8888888888','Champakkulam','4',true,'first',false)`),/row-level security|check constraint/);
  await assert.rejects(db.exec(`insert into public.donors(name,age,sex,blood_group,phone,panchayath,ward,permanently_settled_alappuzha,donor_type,last_donation_date,truth_confirmed) values('Future donor',28,'M','O+','8888888888','Champakkulam','4',true,'regular','2099-01-01',true)`),/future/);
  await db.exec('reset role');
  const row=(await db.query('select * from public.donors')).rows[0];
  assert.equal(row.user_id,null);assert.equal(row.status,'pending');assert.equal(row.nearby_hospital,'TD Medical College, Vandanam');
  await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from public.donors'),/permission denied/);
  await assert.rejects(db.exec("update public.donors set name='Unauthorized edit'"),/permission denied/);
  await assert.rejects(db.exec(`${insert} values('Another donor',28,'F','A+','7777777777','Champakkulam','4',true,'first',true)`),/permission denied/);
  await db.exec('reset role');
  await assert.rejects(db.exec('update public.donors set map_consent=false,map_latitude=9.48,map_longitude=76.34'),/donors_map_valid/);
  console.log('Passed: repeatable SQL; public submission; no public/authenticated reads, edits, deletes or self-approval; no account required; duplicate/date/consent constraints.');
 } finally {await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
