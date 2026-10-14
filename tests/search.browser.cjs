const {chromium}=require('playwright');const assert=require('node:assert/strict');
const mock=`window.searchTest={queries:[],error:null,delays:{},rows:[{name:'A+ <img src=x onerror=alert(1)>',blood_group:'A+',phone:'9999999999',panchayath:'Champakkulam',ward:'4'},{name:'B+ Donor',blood_group:'B+',phone:'8888888888',panchayath:'Nedumudy',ward:'2'}]};
export function createClient(){return {from(table){let columns,group;return {select(c){columns=c;return this;},eq(key,value){group=value;return this;},order(){const state=window.searchTest;const error=state.error;const rows=state.rows.filter(d=>d.blood_group===group);state.queries.push({table,columns,group});return new Promise(resolve=>setTimeout(()=>resolve({data:rows,error}),state.delays[group]||0));}};}};}`;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.REDBLOOD_CHROMIUM_PATH||undefined});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('https://esm.sh/**',r=>r.fulfill({contentType:'text/javascript',body:mock}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.REDBLOOD_TEST_URL||'http://127.0.0.1:8080');
  await page.waitForFunction(()=>window.searchTest);
  await page.selectOption('#search-blood-group','A+');await page.fill('#search-hospital','Hospital <img src=x>');
  await page.click('#donor-search-form button[type=submit]');await page.waitForSelector('.donor-card');
  assert.equal(await page.locator('.donor-card').count(),1);
  assert.equal(await page.locator('.donor-card h3').textContent(),'A+ <img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#search-results img').count(),0);
  assert.equal(await page.locator('.phone-link').getAttribute('href'),'tel:9999999999');
  assert.equal(await page.locator('.donor-location').textContent(),'Champakkulam');
  assert.ok(!(await page.locator('.donor-card').textContent()).includes('Screening'));
  assert.equal(await page.locator('.donor-card .blood-badge,.donor-card .available-badge').count(),0);
  assert.equal(await page.locator('.hospital-context [data-user-content]').textContent(),'Hospital <img src=x>');
  const query=await page.evaluate(()=>window.searchTest.queries.at(-1));assert.equal(query.group,'A+');assert.equal(query.columns,'name,blood_group,phone,panchayath');
  await page.selectOption('[data-language]','ml');await page.waitForFunction(()=>document.querySelector('.result-summary h3').textContent==='അനുയോജ്യമായ ദാതാക്കൾ');
  assert.equal(await page.locator('.donor-card h3').textContent(),'A+ <img src=x onerror=alert(1)>');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.selectOption('[data-language]','en');
  await page.evaluate(()=>window.searchTest.delays['B+']=300);
  await page.selectOption('#search-blood-group','B+');await page.evaluate(()=>document.querySelector('#donor-search-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.selectOption('#search-blood-group','A+');await page.evaluate(()=>document.querySelector('#donor-search-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.waitForTimeout(400);assert.equal(await page.locator('.donor-card h3').textContent(),'A+ <img src=x onerror=alert(1)>');
  await page.selectOption('#search-blood-group','AB-');await page.click('#donor-search-form button[type=submit]');
  await page.waitForFunction(()=>document.querySelector('#search-results').textContent.includes('No matching donors'));assert.equal(await page.locator('.donor-card').count(),0);
  await page.evaluate(()=>window.searchTest.error={message:'permission denied'});
  await page.selectOption('#search-blood-group','A+');await page.click('#donor-search-form button[type=submit]');
  await page.waitForFunction(()=>document.querySelector('#search-results').textContent.includes('Search failed'));assert.equal(await page.locator('.donor-card').count(),0);
  assert.deepEqual(errors,[]);await context.close();
  console.log('Passed: cloud blood-group query, limited fields, escaped names/hospital, name, phone and panchayath cards, bilingual/mobile results, stale-response protection, empty/error states.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
