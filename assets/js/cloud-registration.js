"use strict";
(() => {
  const form = document.querySelector('[data-registration-form]');
  if (!form) return;
  const message = document.querySelector('#account-status');
  const errorBox = document.querySelector('[data-form-error]');
  const email = document.querySelector('#account-email');
  const password = document.querySelector('#account-password');
  const signup = document.querySelector('#create-account');
  const login = document.querySelector('#account-login');
  const logout = document.querySelector('#account-logout');
  const submit = form.querySelector('button[type="submit"]');
  const t = value => window.RedBloodLanguage?.t(value) || value;
  const say = value => { message.textContent = t(value); };
  let busy = false;
  let accountVersion = 0;
  const clientPromise = import('https://esm.sh/@supabase/supabase-js@2.102.0').then(({ createClient }) => {
    const config = window.RedBloodCloudConfig;
    if (!config?.url || !config?.publishableKey?.startsWith('sb_publishable_')) {
      throw Error(t('Supabase configuration is missing.'));
    }
    return createClient(config.url, config.publishableKey);
  });
  function credentials() {
    if (!email.value.trim() || !email.checkValidity()) throw Error(t('Enter a valid email address.'));
    if (password.value.length < 8) throw Error(t('Use a password with at least 8 characters.'));
    return { email: email.value.trim(), password: password.value };
  }
  async function refreshAccount(client) {
    const version = ++accountVersion;
    const { data, error } = await client.auth.getUser();
    if (version !== accountVersion) return;
    if (error && error.name !== 'AuthSessionMissingError') throw error;
    logout.hidden = !data?.user;
    if (data?.user) {
      email.value = data.user.email || '';
      say('Signed in. Complete your donor details and submit the registration.');
    } else {
      say('Create an account or sign in before registering.');
    }
  }
  function lock(value) {
    busy = value;
    [signup, login, logout, submit].forEach(button => button.disabled = value);
  }
  async function accountAction(action) {
    if (busy) return;
    lock(true);
    try {
      errorBox.textContent = '';
      const client = await clientPromise;
      await action(client);
    } catch (error) {
      say(error.message || 'The request failed. Please try again.');
    } finally { lock(false); }
  }
  signup.addEventListener('click', () => accountAction(async client => {
    const { data, error } = await client.auth.signUp({
      ...credentials(),
      options: { emailRedirectTo: new URL('index.html', window.location.href).href }
    });
    if (error) throw error;
    password.value = '';
    if (data.session) await refreshAccount(client);
    else say('Check your email to confirm your account, then sign in. Your donor details have not been saved yet.');
  }));
  login.addEventListener('click', () => accountAction(async client => {
    const { error } = await client.auth.signInWithPassword(credentials());
    if (error) throw error;
    password.value = '';
    await refreshAccount(client);
  }));
  logout.addEventListener('click', () => accountAction(async client => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    password.value = '';
    await refreshAccount(client);
  }));
  // There is deliberately no local-storage fallback when Supabase fails.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    lock(true);
    errorBox.textContent = '';
    try {
      if (!form.reportValidity()) return;
      const client = await clientPromise;
      const { data, error: authError } = await client.auth.getUser();
      if (authError || !data?.user) throw Error(t('Sign in before submitting donor details.'));
      if (!form.elements.truth.checked) throw Error(t('Confirm that your details are correct.'));
      const fields = window.RedBloodFeatures.readFields(form);
      const values = new FormData(form);
      const donor = {
        user_id: data.user.id,
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
        if (error.code === '23505') throw Error(t('This account or phone number is already registered.'));
        throw error;
      }
      form.reset();
      email.value = data.user.email || '';
      window.RedBloodFeatures.afterRegistration();
      say('Your donor registration was saved in Supabase and is waiting for approval.');
    } catch (error) {
      errorBox.textContent = t(error.message || 'The request failed. Please try again.');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally { lock(false); }
  });
  clientPromise.then(async client => {
    // Schedule refresh outside the auth callback to avoid holding its lock.
    client.auth.onAuthStateChange(() => {
      setTimeout(() => refreshAccount(client).catch(error => say(error.message)), 0);
    });
    await refreshAccount(client);
  }).catch(() => say('Could not connect to Supabase. Check your internet connection and reload the page.'));
})();
