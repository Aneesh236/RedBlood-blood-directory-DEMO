"use strict";
(function (root) {
  const DAY = 86400000;
  function today(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  }
  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  }
  function nextDate(donor) {
    if (!validDate(donor.lastDonationDate)) return null;
    // Whole blood only. Other/unspecified uses a conservative planning interval,
    // not an inferred medical category. Blood-bank screening is always required.
    const minimum = donor.sex === 'M' ? 90 : 120;
    const days = Math.max(minimum, Number(donor.cooldownDays) || minimum);
    return new Date(Date.parse(donor.lastDonationDate) + days * DAY).toISOString().slice(0,10);
  }
  function state(donor, now = new Date()) {
    if ((donor.donorType === 'first' || donor.donationHistory === 'never') && Number(donor.age)>60) return {ready:false,label:'Blood-bank review needed / രക്തബാങ്കിന്റെ പരിശോധന ആവശ്യമാണ്'};
    if (!['never','dated'].includes(donor.donationHistory)) return {ready:false,label:'Donation history needed / ദാനചരിത്രം ആവശ്യമാണ്'};
    if (donor.donationHistory === 'dated' && (!validDate(donor.lastDonationDate) || donor.lastDonationDate > today(now))) return {ready:false,label:'Check donation date / ദാന തീയതി പരിശോധിക്കുക'};
    const next = donor.donationHistory === 'dated' ? nextDate(donor) : null;
    if (next && today(now) < next) return {ready:false,label:'Waiting until / കാത്തിരിപ്പ്: ' + next,nextDate:next};
    if (!donor.available) return {ready:false,label:'Unavailable / ലഭ്യമല്ല',nextDate:next};
    if (!(donor.homePanchayat || donor.region)) return {ready:false,label:'Current area needed / ഇപ്പോഴുള്ള സ്ഥലം ആവശ്യമാണ്',nextDate:next};
    return {ready:true,label:'Available for screening / പരിശോധനയ്ക്ക് സന്നദ്ധം',nextDate:next};
  }
  function matches(donor, filters = {}, now = new Date()) {
    const term = String(filters.location || '').trim().toLowerCase();
    return donor.status === 'approved' && donor.sharePhone && state(donor,now).ready &&
      (!filters.bloodGroup || donor.bloodGroup === filters.bloodGroup) &&
      (!filters.region || (donor.homePanchayat || donor.region || "").toLowerCase().includes(filters.region.toLowerCase())) &&
      (!filters.ward || String(donor.homeWard || donor.ward || '').toLowerCase() === filters.ward.trim().toLowerCase()) &&
      (!term || [donor.currentArea,donor.region,donor.ward].some(v => String(v || '').toLowerCase().includes(term)));
  }
  function point(lat, lng) {
    if (lat === '' || lng === '' || lat == null || lng == null) return null;
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) throw Error('Enter valid latitude and longitude.');
    // Roughly 2 km grid: exact device coordinates are never persisted.
    return {lat:Number((Math.round(lat*50)/50).toFixed(2)),lng:Number((Math.round(lng*50)/50).toFixed(2))};
  }
  const api = {today,validDate,nextDate,state,matches,point};
  root.RedBloodAvailability = Object.freeze(api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
