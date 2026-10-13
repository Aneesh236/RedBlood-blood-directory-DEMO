"use strict";
(function () {
  const store = window.RedGoldStore, rules = window.RedBloodAvailability;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DEFAULT_NEARBY_HOSPITAL = "TD Medical College, Vandanam";
  const formatTime = value => value ? new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) + ' IST' : 'Not confirmed';
  function markup(prefix) {
    return `<div class="availability-fields"><div class="form-grid">
      <div class="form-field"><label for="${prefix}-home-panchayat">Panchayath / പഞ്ചായത്ത് *</label><input id="${prefix}-home-panchayat" name="homePanchayat" minlength="2" maxlength="120" required></div>
      <div class="form-field"><label for="${prefix}-home-ward">Ward / വാർഡ് *</label><input id="${prefix}-home-ward" name="homeWard" maxlength="60" required></div>
      <div class="form-field full"><label for="${prefix}-nearby-hospital">Nearby hospital with blood bank</label><input id="${prefix}-nearby-hospital" name="nearbyHospital" type="text" maxlength="160" value="${esc(DEFAULT_NEARBY_HOSPITAL)}"></div>
      <div class="form-field full"><label for="${prefix}-resident">Are you permanently settled in Alappuzha district? / ആലപ്പുഴ ജില്ലയിൽ സ്ഥിരതാമസമാണോ? *</label><select id="${prefix}-resident" name="permanentAlappuzha" required><option value="">Choose / തിരഞ്ഞെടുക്കുക</option><option value="yes">Yes / അതെ</option><option value="no">No / അല്ല</option></select></div>
      <div class="form-field"><label for="${prefix}-type">Have you donated before? / മുമ്പ് രക്തം ദാനം ചെയ്തിട്ടുണ്ടോ? *</label><select id="${prefix}-type" name="donorType" required><option value="">Choose / തിരഞ്ഞെടുക്കുക</option><option value="first">First-time donor / ആദ്യമായി ദാനം ചെയ്യുന്നു</option><option value="regular">Regular donor / പതിവായി ദാനം ചെയ്യുന്നു</option><option value="occasional">Donated before, occasionally / മുമ്പ് ഇടയ്ക്കിടെ ദാനം ചെയ്തിട്ടുണ്ട്</option></select><input type="hidden" name="donationHistory" value="unknown"></div>
      <div class="form-field"><label for="${prefix}-last">Last donation date / അവസാന രക്തദാന തീയതി</label><input id="${prefix}-last" name="lastDonationDate" type="date" max="${rules.today()}"></div>
      <label class="consent-row full"><input name="mapConsent" type="checkbox"><span>Show my approximate area on the map (optional). / എന്റെ ഏകദേശ സ്ഥലം മാപ്പിൽ കാണിക്കാം (നിർബന്ധമില്ല).</span></label>
      <div class="full"><button type="button" class="button button-secondary button-small" data-gps>Use my location / എന്റെ സ്ഥലം കണ്ടെത്തുക</button> <button type="button" class="button button-secondary button-small" data-clear-point>Remove map location / മാപ്പിലെ സ്ഥലം നീക്കുക</button><p class="field-hint" data-gps-status role="status">Your exact location is not shown. / നിങ്ങളുടെ കൃത്യമായ സ്ഥലം കാണിക്കില്ല.</p></div>
      <input name="latitude" type="hidden"><input name="longitude" type="hidden">
      <p class="full field-hint">Your panchayath identifies your area. Sharing your map location is optional.</p>
    </div></div>`;
  }
  function bindFields(form) {
    // Keep every consent checkbox together, directly before the submission controls.
    const consents=document.createElement('div');consents.className='registration-consents';
    const submit=form.querySelector('button[type="submit"]');
    form.querySelectorAll('.consent-row').forEach(row=>consents.append(row));
    const anchor=submit.closest('.dialog-actions') || submit;
    anchor.parentNode.insertBefore(consents,anchor);

    form.querySelector('[data-gps]').addEventListener('click', () => {
      const status = form.querySelector('[data-gps-status]');
      if (!form.elements.mapConsent.checked) { status.textContent='Allow map sharing first. / ആദ്യം മാപ്പിൽ സ്ഥലം പങ്കിടാൻ സമ്മതിക്കുക.'; return; }
      if (!navigator.geolocation) { status.textContent='Geolocation unavailable. Enter your area manually.'; return; }
      status.textContent='Waiting for permission… / അനുമതിക്കായി കാത്തിരിക്കുന്നു…';
      navigator.geolocation.getCurrentPosition(position => {
        if (!form.elements.mapConsent.checked) return;
        const p = rules.point(position.coords.latitude, position.coords.longitude);
        form.elements.latitude.value=p.lat; form.elements.longitude.value=p.lng;
        status.textContent='Location added. Save your details. / സ്ഥലം കണ്ടെത്തി. വിവരങ്ങൾ സംരക്ഷിക്കുക.';
      }, () => {status.textContent='Location unavailable. Enter your area name. / സ്ഥലം കണ്ടെത്താനായില്ല. സ്ഥലത്തിന്റെ പേര് നൽകുക.';}, {enableHighAccuracy:false,timeout:12000,maximumAge:0});
    });
    const clear = () => {form.elements.latitude.value='';form.elements.longitude.value='';};
    form.querySelector('[data-clear-point]').addEventListener('click', clear);
    form.elements.mapConsent.addEventListener('change', () => {if (!form.elements.mapConsent.checked) clear();});
    function updateHint() {
      const type=form.elements.donorType.value;
      form.elements.donationHistory.value=type==='first'?'never':type?'dated':'unknown';
      const hasDate = form.elements.donationHistory.value === 'dated';
      form.elements.lastDonationDate.required=hasDate;
      form.elements.lastDonationDate.disabled=!hasDate;
    }
    form.addEventListener('change', updateHint);
    form._updateHint=updateHint;
    updateHint();
  }
  function readFields(form) {
    form._updateHint();
    const e=form.elements;
    if (e.mapConsent.checked && Boolean(e.latitude.value) !== Boolean(e.longitude.value)) throw Error('Provide both latitude and longitude, or leave both blank.');
    let mapPoint = e.mapConsent.checked ? rules.point(e.latitude.value,e.longitude.value) : null;
    const areaKey = JSON.stringify([e.homePanchayat.value.trim(),e.homeWard.value.trim()]);
    if (form.dataset.originalArea && form.dataset.originalArea !== areaKey && form.dataset.originalPoint === JSON.stringify(mapPoint)) mapPoint = null;
    if(e.homePanchayat.value.trim().length<2 || !e.homeWard.value.trim() || !['yes','no'].includes(e.permanentAlappuzha.value) || !e.donorType.value) throw Error('Complete panchayat, ward, residency and donor type. / പഞ്ചായത്ത്, വാർഡ്, താമസം, ദാതാവിന്റെ തരം എന്നിവ പൂരിപ്പിക്കുക.');
    const sex=e.sex?.value || form.dataset.sex || 'O';
    return {homePanchayat:e.homePanchayat.value,homeWard:e.homeWard.value,nearbyHospital:e.nearbyHospital.value,
      permanentAlappuzha:e.permanentAlappuzha.value,donorType:e.donorType.value,
      location:e.homePanchayat.value,region:e.homePanchayat.value,ward:e.homeWard.value,currentArea:e.homePanchayat.value,
      available:form.dataset.listed !== 'false',availabilityUntil:'',
      donationHistory:e.donationHistory.value,lastDonationDate:e.lastDonationDate.value,
      cooldownDays:Math.max(sex==='M'?90:120,Number(form.dataset.cooldown)||0),mapConsent:e.mapConsent.checked,mapPoint};
  }
  function fillFields(form, donor) {
    form.elements.nearbyHospital.value=donor.nearbyHospital ?? DEFAULT_NEARBY_HOSPITAL;
    form.elements.homePanchayat.value=donor.homePanchayat || donor.region || donor.location || '';
    form.elements.homeWard.value=donor.homeWard || donor.ward || '';
    form.elements.lastDonationDate.value=donor.lastDonationDate || '';
    form.elements.donorType.value=donor.donorType || (donor.donationHistory==='never'?'first':donor.donationHistory==='dated'?'occasional':'');
    form.elements.permanentAlappuzha.value=donor.permanentAlappuzha || '';
    form.elements.mapConsent.checked=Boolean(donor.mapConsent);
    form.elements.latitude.value=donor.mapPoint?.lat ?? '';
    form.elements.longitude.value=donor.mapPoint?.lng ?? '';
    form.dataset.sex=donor.sex;
    form.dataset.listed=String(donor.available !== false);
    form.dataset.cooldown=String(donor.cooldownDays || 0);
    form.dataset.originalArea=JSON.stringify([form.elements.homePanchayat.value,form.elements.homeWard.value]);
    form.dataset.originalPoint=JSON.stringify(donor.mapPoint || null);
    form._updateHint();
  }
  const registration=document.querySelector('[data-registration-form]');
  const edit=document.querySelector('[data-edit-form]');
  const self=document.querySelector('#self-form');

  if(registration) registration.querySelector('[data-registration-details]').innerHTML=markup('register');
  if(edit) edit.querySelector('[data-edit-error]').insertAdjacentHTML('beforebegin',markup('edit'));
  if(self) self.querySelector('[data-self-fields]').innerHTML=markup('self');
  [registration,edit,self].filter(Boolean).forEach(bindFields);
  if(self) {
  const selector=document.querySelector('#self-donor');
  function refreshSelector() {
    const selected=selector.value;
    selector.innerHTML='<option value="">Select donor profile / ദാതാവിന്റെ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക</option>'+store.getDonors().map(d=>`<option value="${esc(d.id)}">${esc(d.name)} · ${esc(d.bloodGroup)}</option>`).join('');
    selector.value=selected;
    if(!selector.value) {self.hidden=true;document.querySelector('#self-status').textContent='';}
  }
  function loadSelf() {
    const donor=store.getDonors().find(d=>d.id===selector.value);self.hidden=!donor;
    document.querySelector('#self-error').textContent='';
    if(donor) {
      for(const key of ['name','age','sex','bloodGroup','phone']) self.elements[key].value=donor[key];
      self.elements.sharePhone.checked=Boolean(donor.sharePhone);
      self.elements.truth.checked=false;
      fillFields(self,donor);
      document.querySelector('#self-status').textContent=`${rules.state(donor).label} · Registration / രജിസ്ട്രേഷൻ: ${donor.status}`;
    }
  }
  selector.addEventListener('change',loadSelf);
  self.addEventListener('submit',event=>{
    event.preventDefault();
    try {
      if(!self.elements.truth.checked) throw Error('Confirm that your details are correct. / വിവരങ്ങൾ ശരിയാണെന്ന് സ്ഥിരീകരിക്കുക.');
      const old=store.getDonors().find(d=>d.id===selector.value), changes=readFields(self);
      for(const key of ['name','sex','bloodGroup','phone']) changes[key]=self.elements[key].value;
      changes.age=Number(self.elements.age.value);changes.sharePhone=self.elements.sharePhone.checked;
      if(['name','bloodGroup','phone'].some(key=>old[key]!==changes[key])) changes.status='pending';
      store.updateDonor(selector.value,changes);loadSelf();
      document.querySelector('#self-status').textContent+=' · Saved / സംരക്ഷിച്ചു';
    } catch(error) {document.querySelector('#self-error').textContent=error.message;}
  });
  document.querySelector('#delete-my-profile').addEventListener('click',()=>{
    if(!selector.value || !window.confirm('Delete this donor profile permanently from this browser? / ഈ ദാതാവിന്റെ വിവരങ്ങൾ ഈ ബ്രൗസറിൽ നിന്ന് പൂർണമായി നീക്കം ചെയ്യണോ?')) return;
    try{store.deleteDonor(selector.value);self.reset();self.hidden=true;document.querySelector('#self-status').textContent='Profile deleted / വിവരങ്ങൾ നീക്കം ചെയ്തു';}catch(error){document.querySelector('#self-error').textContent=error.message;}
  });
  window.addEventListener('redgold:donors-changed',refreshSelector);refreshSelector();
  }
  window.addEventListener('storage',event=>{if(event.key===store.STORAGE_KEY)window.dispatchEvent(new CustomEvent('redgold:donors-changed'));});
  let map, layer, matches=[], loading=false;
  function renderMap(donors) {
    if(!document.querySelector('#map-counts')) return;
    matches=donors;
    const bins=new Map();
    donors.filter(d=>d.mapConsent && d.mapPoint).forEach(d=>{
      let p; try {p=rules.point(d.mapPoint.lat,d.mapPoint.lng);} catch {return;}
      if (!p) return;
      const key=p.lat+','+p.lng;
      if(!bins.has(key)) bins.set(key,{...p,count:0,areas:new Set()});
      bins.get(key).count++;
      bins.get(key).areas.add(d.homePanchayat || d.region || "Selected area");
    });
    const list=[...bins.values()];
    document.querySelector('#map-counts').innerHTML=list.map(b=>`<span><b>${b.count} donor${b.count===1?'':'s'}</b> · <i data-user-content>${esc([...b.areas].join(" / "))}</i></span>`).join('');
    document.querySelector('#map-status').textContent=`${donors.length} matching donor(s) / അനുയോജ്യമായ ദാതാക്കൾ; ${list.reduce((n,b)=>n+b.count,0)} on map / മാപ്പിൽ.`;
    if (!map) return;
    layer.clearLayers();
    list.forEach(b=>window.L.circleMarker([b.lat,b.lng],{radius:Math.min(28,12+b.count*2),color:'#b5122b',fillColor:'#b5122b',fillOpacity:.3}).bindTooltip(`${b.count} available donor(s) · approximate area`).addTo(layer));
    if(list.length) map.fitBounds(list.map(b=>[b.lat,b.lng]),{padding:[45,45],maxZoom:12});
  }
  document.querySelector('#load-map')?.addEventListener('click',()=>{
    if(map || loading) return;
    loading=true;
    const status=document.querySelector('#map-status'),button=document.querySelector('#load-map');
    button.disabled=true;status.textContent='Loading online map…';
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    let finished=false;
    const failed=()=>{if(finished)return;finished=true;loading=false;button.disabled=false;status.textContent='Map could not load. Check your connection and retry; donor search and area counts still work.';};
    const timeout=setTimeout(failed,15000);
    script.onerror=()=>{clearTimeout(timeout);failed();};
    script.onload=()=>{
      if(finished)return;finished=true;clearTimeout(timeout);loading=false;
      if(!window.L){finished=false;failed();return;}
      document.querySelector('#donor-map').hidden=false;
      map=window.L.map('donor-map').setView([9.50,76.34],10);
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>{status.textContent='Some map tiles could not load. Donor list and area counts are still available.';}).addTo(map);
      layer=window.L.layerGroup().addTo(map);button.hidden=true;renderMap(matches);
    };
    document.head.append(css,script);
  });
  window.RedBloodFeatures={readFields,fillFields,renderMap,afterRegistration(){registration._updateHint();}};
  // Recheck expiry without requiring a refresh, including after a suspended tab returns.
  const refresh=()=>{if(typeof window.renderSearchResults==='function')window.renderSearchResults();};
  window.setInterval(refresh,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
