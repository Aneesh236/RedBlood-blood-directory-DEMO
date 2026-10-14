const {PGlite}=require('@electric-sql/pglite');
const {readFileSync}=require('node:fs');const {join}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try {
  await db.exec('create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);');
  for(const file of ['create-donors.sql','registration-permissions.sql','donor-search.sql','donor-search.sql']) await db.exec(readFileSync(join(__dirname,'../database',file),'utf8'));
  const rows=[
   ['Allowed A+',28,'M','A+','approved',true,'first',null],
   ['Pending',28,'M','A+','pending',true,'first',null],
   ['No consent',28,'M','A+','approved',false,'first',null],
   ['Too soon M',28,'M','A+','approved',true,'regular','current_date - 89'],
   ['Boundary M',28,'M','A+','approved',true,'regular',"(now() at time zone 'Asia/Kolkata')::date - 90"],
   ['Too soon F',28,'F','A+','approved',true,'regular','current_date - 119'],
   ['Boundary F',28,'F','A+','approved',true,'regular',"(now() at time zone 'Asia/Kolkata')::date - 120"],
   ['First over 60',61,'M','A+','approved',true,'first',null],
   ['Allowed B+',28,'M','B+','approved',true,'first',null]
  ];
  for(let i=0;i<rows.length;i++) {
   const [name,age,sex,group,status,consent,type,date]=rows[i];
   await db.query(`insert into public.donors(name,age,sex,blood_group,phone,panchayath,ward,permanently_settled_alappuzha,donor_type,last_donation_date,truth_confirmed,status,share_phone) values($1,$2,$3,$4,$5,'Test area','4',true,$6,${date || 'null'},true,$7,$8)`,[name,age,sex,group,String(9000000000+i),type,status,consent]);
  }
  await db.exec('set role anon');
  const found=(await db.query("select name,blood_group,phone,panchayath from public.donors where blood_group='A+' order by name")).rows;
  assert.deepEqual(found.map(d=>d.name),['Allowed A+','Boundary F','Boundary M']);
  await assert.rejects(db.query('select * from public.donors'),/permission denied/);
  await assert.rejects(db.query('select ward,age,user_id,last_donation_date from public.donors'),/permission denied/);
  await assert.rejects(db.exec("update public.donors set status='approved'"),/permission denied/);
  console.log('Passed: A+/B+ filtering, approved/consented-only visibility, waiting-period boundaries, repeatable setup, private columns and approval protection.');
 } finally {await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
