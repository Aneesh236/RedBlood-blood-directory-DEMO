// Serve on port 8080. Uses a mock, never creates real accounts or donor records.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const mock = `
window.cloudTest = { user: null, inserts: [], insertError: null };
export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: window.cloudTest.user }, error: window.cloudTest.user ? null : {name:'AuthSessionMissingError'} }),
      signUp: async args => { window.cloudTest.signup = args; return {data:{session:null},error:null}; },
      signInWithPassword: async args => { window.cloudTest.user = {id:'11111111-1111-1111-1111-111111111111',email:args.email}; return {error:null}; },
      signOut: async () => {window.cloudTest.user=null;return {error:null};},
      onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}})
    },
    from: name => ({insert: async row => {window.cloudTest.inserts.push({name,row});return {error:window.cloudTest.insertError};}})
  };
}`;
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.REDBLOOD_CHROMIUM_PATH || undefined});
  try {
    const context = await browser.newContext({ viewport: {width:390,height:844} });
    await context.route('https://esm.sh/**', route => route.fulfill({contentType:'text/javascript',body:mock}));
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.REDBLOOD_TEST_URL || 'http://127.0.0.1:8080');
    await page.waitForFunction(()=>window.cloudTest);
    await page.fill('#account-email','donor@example.com');
    await page.fill('#account-password','test-password');
    await page.click('#create-account');
    await page.waitForFunction(()=>document.querySelector('#account-status').textContent.includes('not been saved'));
    assert.equal(await page.evaluate(()=>window.cloudTest.inserts.length),0);
    assert.equal(await page.evaluate(()=>window.cloudTest.signup.options.emailRedirectTo),'http://127.0.0.1:8080/index.html');
    await page.fill('#account-password','test-password');await page.click('#account-login');
    await page.waitForFunction(()=>!document.querySelector('#account-logout').hidden);
    async function fillDonor(type='first') {
      await page.fill('#donor-name','Test Donor');await page.fill('#donor-age','28');
      await page.check('[name=sex][value=M]');await page.selectOption('#donor-blood-group','O+');
      await page.fill('#donor-phone','9999999999');await page.fill('#register-home-panchayat','Champakkulam');
      await page.fill('#register-home-ward','4');await page.selectOption('#register-resident','yes');
      await page.selectOption('#register-type',type);await page.check('[name=truth]');
    }
    await fillDonor();
    await page.evaluate(()=>window.cloudTest.insertError={code:'42501',message:'Permission denied'});
    await page.click('#registration-form button[type=submit]');
    await page.waitForFunction(()=>document.querySelector('[data-form-error]').textContent==='Permission denied');
    assert.equal(await page.inputValue('#donor-name'),'Test Donor');
    assert.equal(await page.evaluate(()=>localStorage.getItem('redgold_donors_v1')),null);
    await page.evaluate(()=>window.cloudTest.insertError=null);
    await page.click('#registration-form button[type=submit]');
    await page.waitForFunction(()=>document.querySelector('#account-status').textContent.includes('saved in Supabase'));
    const row=await page.evaluate(()=>window.cloudTest.inserts.at(-1).row);
    assert.equal(row.panchayath,'Champakkulam');assert.equal(row.ward,'4');assert.equal(row.last_donation_date,null);
    assert.equal(row.nearby_hospital,'TD Medical College, Vandanam');assert.equal(row.user_id,'11111111-1111-1111-1111-111111111111');
    assert.equal(row.map_latitude,null);assert.equal(row.map_consent,false);assert.equal(row.share_phone,false);
    assert.equal('status' in row,false);assert.equal('password' in row,false);assert.equal('email' in row,false);
    assert.equal(await page.inputValue('#donor-name'),'');
    await fillDonor('regular');await page.fill('#register-last','2026-01-01');
    await page.check('[name=share_phone]');await page.check('[name=mapConsent]');
    await page.evaluate(()=>{document.querySelector('[name=latitude]').value='9.48';document.querySelector('[name=longitude]').value='76.34';window.cloudTest.insertError={code:'23505',message:'duplicate'};});
    await page.click('#registration-form button[type=submit]');
    await page.waitForFunction(()=>document.querySelector('[data-form-error]').textContent.includes('already registered'));
    const second=await page.evaluate(()=>window.cloudTest.inserts.at(-1).row);
    assert.equal(second.last_donation_date,'2026-01-01');assert.equal(second.share_phone,true);assert.equal(second.map_latitude,9.48);
    await page.click('#account-logout');await page.waitForFunction(()=>document.querySelector('#account-logout').hidden);
    const count=await page.evaluate(()=>window.cloudTest.inserts.length);
    await page.click('#registration-form button[type=submit]');
    await page.waitForFunction(()=>document.querySelector('[data-form-error]').textContent.includes('Sign in'));
    assert.equal(await page.evaluate(()=>window.cloudTest.inserts.length),count);
    for(const lang of ['en','ml']) {
      await page.selectOption('[data-language]',lang);
      await page.waitForFunction(l=>document.documentElement.lang===l,lang);
      for(const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:844});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang} overflow at ${width}`);
      }
    }
    assert.equal(await page.locator('#create-account').textContent(),'അക്കൗണ്ട് സൃഷ്ടിക്കുക');
    assert.deepEqual(errors,[]);await context.close();
    const broken=await browser.newContext();await broken.route('https://esm.sh/**',r=>r.abort());
    const offline=await broken.newPage();await offline.goto('http://127.0.0.1:8080');
    await offline.waitForFunction(()=>document.querySelector('#account-status').textContent.includes('Could not connect'));
    assert.equal(await offline.evaluate(()=>localStorage.getItem('redgold_donors_v1')),null);await broken.close();
    console.log('Passed: signup confirmation, login/logout, cloud insert mapping, no local fallback, error retention, duplicate handling, date/map consent, bilingual mobile layout, CDN failure.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
