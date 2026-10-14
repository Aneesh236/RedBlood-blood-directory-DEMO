"use strict";

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const toast = document.querySelector("[data-toast]");

function showToast(message, type = "success") {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.className = `toast is-visible ${type === "error" ? "toast-error" : ""}`;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });

  function closeNavigation(restoreFocus = false) {
    const wasOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
    if (restoreFocus && wasOpen) navToggle.focus();
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeNavigation(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeNavigation();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1340) closeNavigation();
  });
  document.querySelector('[data-language]')?.addEventListener('change', () => closeNavigation());

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const registrationForm = document.querySelector("[data-registration-form]");
const formError = document.querySelector("[data-form-error]");

const donorSearchForm = document.querySelector("#donor-search-form");
const searchResults = document.querySelector("#search-results");
const bloodGroupSelect = document.querySelector("#search-blood-group");
const locationInput = document.querySelector("#search-location");

let cloudSearchClient;
let latestSearch = 0;

function getCloudSearchClient() {
  if (!cloudSearchClient) {
    cloudSearchClient = import('https://esm.sh/@supabase/supabase-js@2.102.0')
      .then(({ createClient }) => {
        const config = window.RedBloodCloudConfig;
        if (!config?.url || !config?.publishableKey) throw Error('Supabase configuration is missing.');
        return createClient(config.url, config.publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });
      });
  }
  return cloudSearchClient;
}

async function renderSearchResults() {
  if (!searchResults || !bloodGroupSelect) return;
  const request = ++latestSearch;
  const bloodGroup = bloodGroupSelect.value;
  const hospital = document.querySelector('#search-hospital')?.value.trim() || '';
  const hospitalContext = hospital ? `<p class="hospital-context"><span>Hospital</span>: <span data-user-content>${escapeHtml(hospital)}</span></p>` : '';
  window.RedBloodFeatures?.renderMap([]);
  if (!bloodGroup) {
    searchResults.innerHTML = '<div class="empty-state compact-empty"><h3>Choose a blood group / രക്തഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക</h3></div>';
    return;
  }
  searchResults.innerHTML = '<p role="status">Searching donors…</p>';
  try {
    const client = await getCloudSearchClient();
    const { data, error } = await client.from('donors')
      .select('name,blood_group,phone,panchayath')
      .eq('blood_group', bloodGroup).order('name');
    if (request !== latestSearch) return;
    if (error) throw error;
    const donors = data || [];
    if (!donors.length) {
      searchResults.innerHTML = `<div class="empty-state compact-empty"><h3>No matching donors / അനുയോജ്യമായ ദാതാക്കളെ കണ്ടെത്തിയില്ല</h3>${hospitalContext}<p>No approved donors currently meet the listing requirements.</p></div>`;
      return;
    }
    const cards = donors.map(donor => `<article class="donor-card">
      <h3 data-user-content>${escapeHtml(donor.name)}</h3>
      <a class="phone-link" href="tel:${escapeHtml(donor.phone)}"><span data-user-content>${escapeHtml(donor.phone)}</span></a>
      <p class="donor-location" data-user-content>${escapeHtml(donor.panchayath)}</p>
    </article>`).join('');
    searchResults.innerHTML = `${hospitalContext}<div class="result-summary"><div><h3>Matching donors</h3><p>${escapeHtml(bloodGroup)} · ${donors.length}</p></div></div><div class="donor-grid">${cards}</div>`;
  } catch (error) {
    if (request !== latestSearch) return;
    console.error('Supabase donor search failed:', error);
    searchResults.innerHTML = '<div class="empty-state compact-empty" role="alert"><h3>Search failed</h3><p>Check your connection and try again.</p></div>';
  }
}

if (donorSearchForm) {
  donorSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearchResults();
    searchResults.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

document.querySelectorAll("[data-quick-blood]").forEach((button) => {
  button.addEventListener("click", () => {
    bloodGroupSelect.value = button.dataset.quickBlood;
    renderSearchResults();
    searchResults.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const voiceButton = document.querySelector("[data-voice-search]");
const voiceStatus = document.querySelector("[data-voice-status]");

if (voiceButton && voiceStatus && bloodGroupSelect) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceButton.hidden = true;
    voiceStatus.textContent = "Voice search is not supported by this browser.";
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const spokenGroups = {
      "a positive": "A+",
      "a plus": "A+",
      "a negative": "A-",
      "a minus": "A-",
      "b positive": "B+",
      "b plus": "B+",
      "b negative": "B-",
      "b minus": "B-",
      "ab positive": "AB+",
      "a b positive": "AB+",
      "ab plus": "AB+",
      "a b plus": "AB+",
      "ab negative": "AB-",
      "a b negative": "AB-",
      "ab minus": "AB-",
      "a b minus": "AB-",
      "o positive": "O+",
      "o plus": "O+",
      "o negative": "O-",
      "o minus": "O-"
    };

    voiceButton.addEventListener("click", () => {
      voiceStatus.textContent = "Listening… say a blood group, such as “O positive”.";

      try {
        recognition.start();
      } catch (error) {
        voiceStatus.textContent = "Voice search is already listening. Please speak now.";
      }
    });

    recognition.addEventListener("result", (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      const matchedKey = Object.keys(spokenGroups).sort((a,b) => b.length-a.length).find((key) => transcript.includes(key));

      if (matchedKey) {
        bloodGroupSelect.value = spokenGroups[matchedKey];
        voiceStatus.textContent = `${spokenGroups[matchedKey]} selected.`;
        renderSearchResults();
      } else {
        voiceStatus.textContent = `“${transcript}” was not recognised as a blood group.`;
      }
    });

    recognition.addEventListener("error", (event) => {
      voiceStatus.textContent = event.error === "not-allowed"
        ? "Microphone permission was not granted."
        : "Voice search could not start. Please choose a blood group manually.";
    });
  }
}
