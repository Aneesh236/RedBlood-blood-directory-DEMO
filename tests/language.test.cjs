const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');const assert=require('node:assert/strict');
(async()=>{
const tick=()=>new Promise(r=>setTimeout(r,0));let persisted='en';let data=null;
async function open(file){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=await JSDOM.fromURL('http://127.0.0.1:8080/'+file,{resources:new class extends ResourceLoader { fetch(url,options){ if(url.endsWith('/cloud-registration.js')) return Promise.resolve(Buffer.from('// Cloud flow is covered by cloud.browser.cjs')); return super.fetch(url,options); } }(),runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.localStorage.setItem('redblood_language',persisted);if(data)w.localStorage.setItem('redgold_donors_v1',data);w.HTMLElement.prototype.scrollIntoView=function(){};}});await new Promise(r=>dom.window.addEventListener('load',r));await tick();assert.deepEqual(errors,[]);return dom;}
for(const file of ['index.html','donor.html','admin.html','contacts.html']){
 const dom=await open(file),w=dom.window,d=w.document;
 const nodes=()=>{let walker=d.createTreeWalker(d.body,w.NodeFilter.SHOW_TEXT),arr=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style,[data-language],[data-user-content]'))arr.push(n.textContent);}return arr;};
 assert.equal(d.documentElement.lang,'en');assert.deepEqual(nodes().filter(s=>/[\u0d00-\u0d7f]/.test(s)),[],file+' English must not contain Malayalam UI');
 const sel=d.querySelector('[data-language]');sel.value='ml';sel.dispatchEvent(new w.Event('change'));await tick();
 assert.equal(d.documentElement.lang,'ml');assert.equal(w.localStorage.getItem('redblood_language'),'ml');assert.ok(d.querySelector('.site-nav').textContent.includes('മുഖപ്പേജ്'));
 assert.ok(!/demo|college|prototype|pilot/i.test(nodes().join(' ')));
 sel.value='en';sel.dispatchEvent(new w.Event('change'));await tick();assert.deepEqual(nodes().filter(s=>/[\u0d00-\u0d7f]/.test(s)),[]);
 await tick();dom.window.RedBloodLanguage.destroy();dom.window.close();
}
const dom=await open('index.html'),w=dom.window,d=w.document;
const donor=w.RedGoldStore.addDonor({name:'Home',age:28,sex:'M',bloodGroup:'O+',phone:'9999999999',location:'Home',sharePhone:true,status:'approved',available:true,homePanchayat:'Home',homeWard:'1',region:'Home',ward:'1',currentArea:'Home',permanentAlappuzha:'yes',donorType:'first',donationHistory:'never',availabilityUntil:new Date(Date.now()+86400000).toISOString()});
d.querySelector('#donor-name').value='My unsaved entry';w.RedBloodLanguage.set('ml');assert.equal(d.querySelector('#donor-name').value,'My unsaved entry');
d.querySelector('#search-blood-group').value='O+';d.querySelector('#donor-search-form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await tick();assert.equal(d.querySelector('.donor-card h3').textContent,'Home');assert.ok(d.querySelector('.result-summary h3').textContent.includes('ദാതാക്കൾ'));assert.ok(!d.querySelector('.donor-card').textContent.includes('Available until'));
persisted=w.localStorage.getItem('redblood_language');data=w.localStorage.getItem('redgold_donors_v1');await tick();dom.window.RedBloodLanguage.destroy();dom.window.close();
const profile=await open('donor.html'),pw=profile.window,pd=pw.document;assert.equal(pd.documentElement.lang,'ml');const select=pd.querySelector('#self-donor');select.value=donor.id;select.dispatchEvent(new pw.Event('change'));await tick();assert.equal(pd.querySelector('#self-name').value,'Home');assert.ok(!/[A-Za-z]{4}/.test(pd.querySelector('#self-status').textContent));assert.equal(pd.querySelector('[data-next-date]'),null);
pw.RedBloodLanguage.set('en');assert.equal(pd.querySelector('#self-name').value,'Home');assert.ok(pd.querySelector('#self-status').textContent.includes('Approved'));await tick();profile.window.RedBloodLanguage.destroy();profile.window.close();
console.log('Passed language switching on all pages, persistence, dynamic search/status, professional wording, unsaved inputs and donor content preservation.');
})();
