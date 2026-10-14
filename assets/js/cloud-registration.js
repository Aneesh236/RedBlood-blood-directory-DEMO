"use strict";
(() => {
  const form = document.querySelector('[data-registration-form]');
  if (!form) return;
  const message = document.querySelector('#registration-status');
  const errorBox = document.querySelector('[data-form-error]');
  const submit = form.querySelector('button[type="submit"]');
  const t = value => window.RedBloodLanguage?.t(value) || value;
  const say = value => { message.textContent = t(value); };
  let busy = false;
  const clientPromise = import('https://esm.sh/@supabase/supabase-js@2.102.0').then(({ createClient }) => {
    const config = window.RedBloodCloudConfig;
    if (!config?.url || !config?.publishableKey?.startsWith('sb_publishable_')) {
      throw Error(t('Supabase configuration is missing.'));
    }
    return createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  });
  // There is deliberately no local-storage fallback when Supabase fails.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    submit.disabled = true;
    message.textContent = '';
    errorBox.textContent = '';
    try {
      if (!form.reportValidity()) return;
      const client = await clientPromise;
      if (!form.elements.truth.checked) throw Error(t('Confirm that your details are correct.'));
      const fields = window.RedBloodFeatures.readFields(form);
      const values = new FormData(form);
      const donor = {
        name: String(values.get('name') || '').trim(),
        age: Number(values.get('age')),
        sex: values.get('sex'),
        blood_group: values.get('blood_group'),
        phone: String(values.get('phone') || '').replace(/\D/g, ''),
        panchayath: fields.homePanchayat.trim(),
        ward: fields.homeWard.trim(),
        nearby_hospital: fields.nearbyHospital.trim() || 'TD Medical College, Vandanam',
        permanently_settled_alappuzha: fields.permanentAlappuzha === 'yes',
        donor_type: fields.donorType,
        last_donation_date: fields.donorType === 'first' ? null : fields.lastDonationDate || null,
        share_phone: values.get('share_phone') === '1',
        truth_confirmed: true,
        map_consent: fields.mapConsent,
        map_latitude: fields.mapPoint ? Number(fields.mapPoint.lat.toFixed(2)) : null,
        map_longitude: fields.mapPoint ? Number(fields.mapPoint.lng.toFixed(2)) : null
      };
      const { error } = await client.from('donors').insert(donor);
      if (error) {
        if (error.code === '23505') throw Error(t('This phone number is already registered.'));
        throw error;
      }
      form.reset();
      window.RedBloodFeatures.afterRegistration();
      say('Your donor registration was saved in Supabase and is waiting for approval.');
    } catch (error) {
      errorBox.textContent = t(error.message || 'The request failed. Please try again.');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally { busy = false; submit.disabled = false; }
  });
  clientPromise.catch(() => say('Could not connect to Supabase. Check your internet connection and reload the page.'));
})();
