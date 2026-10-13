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

if (registrationForm && formError && window.RedGoldStore) {
  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";

    const formData = new FormData(registrationForm);

    try {
      if(!registrationForm.elements.truth.checked) throw Error('Confirm that your details are correct. / വിവരങ്ങൾ ശരിയാണെന്ന് സ്ഥിരീകരിക്കുക.');
      window.RedGoldStore.addDonor({
        name: formData.get("name"),
        age: Number(formData.get("age")),
        sex: formData.get("sex"),
        bloodGroup: formData.get("blood_group"),
        phone: formData.get("phone"),

        sharePhone: formData.get("share_phone") === "1",
        ...window.RedBloodFeatures.readFields(registrationForm),
        status: "pending"
      });

      registrationForm.reset();
      window.RedBloodFeatures.afterRegistration();
      showToast("Registration saved for approval. / അംഗീകാരത്തിനായി രജിസ്ട്രേഷൻ സംരക്ഷിച്ചു.");
    } catch (error) {
      formError.textContent = error.message;
      formError.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(error.message, "error");
    }
  });
}

const donorSearchForm = document.querySelector("#donor-search-form");
const searchResults = document.querySelector("#search-results");
const bloodGroupSelect = document.querySelector("#search-blood-group");
const locationInput = document.querySelector("#search-location");

function renderSearchResults() {
  if (!searchResults || !bloodGroupSelect || !window.RedGoldStore) {
    return;
  }

  const bloodGroup = bloodGroupSelect.value;
  const hospital = document.querySelector('#search-hospital')?.value.trim() || '';
  const hospitalContext = hospital ? `<p class="hospital-context"><span>Hospital</span>: <span data-user-content>${escapeHtml(hospital)}</span></p>` : '';
  const location = locationInput ? locationInput.value.trim().toLowerCase() : "";

  if (!bloodGroup) {
    window.RedBloodFeatures?.renderMap([]);
    searchResults.innerHTML = `
      <div class="empty-state compact-empty">
        <span aria-hidden="true">⌕</span>
        <h3>Choose a blood group / രക്തഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക</h3>
        <p>Select a group before searching the local donor directory.</p>
      </div>
    `;
    return;
  }

  const donors = window.RedGoldStore.getDonors()
    .filter((donor) => window.RedBloodAvailability.matches(donor, {
      bloodGroup
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  window.RedBloodFeatures?.renderMap(donors);
  if (donors.length === 0) {
    searchResults.innerHTML = `
      <div class="empty-state compact-empty">
        <span aria-hidden="true">♥</span>
        <h3>No matching donors / അനുയോജ്യമായ ദാതാക്കളെ കണ്ടെത്തിയില്ല</h3>${hospitalContext}
        <p>Check the approved donor registrations, contact-sharing consent and last donation dates in Administration.</p>
        <a class="button button-secondary" href="admin.html">Open admin dashboard</a>
      </div>
    `;
    return;
  }

  const donorCards = donors.map((donor) => `
    <article class="donor-card">
      <div class="donor-card-head">
        <span class="blood-badge">${escapeHtml(donor.bloodGroup)}</span>
        <span class="available-badge">Listed donor / രജിസ്റ്റർ ചെയ്ത ദാതാവ്</span>
      </div>
      <h3 data-user-content>${escapeHtml(donor.name)}</h3>
      <p class="donor-location">📍 <span data-user-content>${escapeHtml(donor.homePanchayat || donor.region)}</span>${(donor.homeWard || donor.ward) ? ` · <span>Ward</span> <span data-user-content>${escapeHtml(donor.homeWard || donor.ward)}</span>` : ""}</p><p class="local-storage-note"><span>Contact the donor to confirm availability.</span> <span>Screening required.</span></p>
      <div class="donor-meta">
        <div><span>Age</span><strong>${escapeHtml(donor.age)}</strong></div>
        <div><span>Gender</span><strong>${escapeHtml({ M: "Male", F: "Female", O: "Other" }[donor.sex] || "Other")}</strong></div>
      </div>
      <a class="phone-link" href="tel:${escapeHtml(donor.phone)}">
        <span aria-hidden="true">☎</span> ${escapeHtml(donor.phone)}
      </a>
    </article>
  `).join("");

  searchResults.innerHTML = `
    ${hospitalContext}
    <div class="result-summary">
      <div>
        <h3>${donors.length} matching donor${donors.length === 1 ? "" : "s"}</h3>
        <p>${escapeHtml(bloodGroup)}${location ? ` <span>Near</span> <span data-user-content>${escapeHtml(locationInput.value.trim())}</span>` : ""}</p>
      </div>
    </div>
    <div class="donor-grid">${donorCards}</div>
  `;
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

window.addEventListener("redgold:donors-changed", () => {
  if (bloodGroupSelect && bloodGroupSelect.value) {
    renderSearchResults();
  }
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
