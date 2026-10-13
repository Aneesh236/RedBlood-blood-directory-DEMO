"use strict";

(function initialiseRedGoldStore(windowObject) {
  const STORAGE_KEY = "redgold_donors_v1";
  const allowedBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const allowedStatuses = ["pending", "approved", "rejected"];
  const allowedSexValues = ["M", "F", "O"];

  function createId() {
    if (windowObject.crypto && typeof windowObject.crypto.randomUUID === "function") {
      return windowObject.crypto.randomUUID();
    }

    return `donor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function cleanText(value, maximumLength) {
    return String(value ?? "").trim().slice(0, maximumLength);
  }

  function normalisePhone(value) {
    return String(value ?? "").replace(/\D/g, "").slice(0, 15);
  }

  function normaliseDonor(input, preserveId = false) {
    const now = new Date().toISOString();
    const donor = {
      id: preserveId && input.id ? cleanText(input.id, 100) : createId(),
      name: cleanText(input.name, 100),
      age: Number(input.age),
      sex: cleanText(input.sex, 1),
      bloodGroup: cleanText(input.bloodGroup, 3),
      phone: normalisePhone(input.phone),
      location: cleanText(input.location, 120),
      sharePhone: Boolean(input.sharePhone),
      available: input.available !== false,
      homePanchayat: cleanText(input.homePanchayat,120),
      homeWard: cleanText(input.homeWard,60),
      nearbyHospital: cleanText(input.nearbyHospital,160),
      permanentAlappuzha: ['yes','no'].includes(input.permanentAlappuzha) ? input.permanentAlappuzha : '',
      donorType: ['first','regular','occasional'].includes(input.donorType) ? input.donorType : '',
      region: cleanText(input.region, 120),
      ward: cleanText(input.ward, 60),
      currentArea: cleanText(input.currentArea, 120),
      availabilityUntil: input.availabilityUntil || '',
      donationHistory: input.donationHistory || 'unknown',
      lastDonationDate: input.lastDonationDate || '',
      cooldownDays: Number(input.cooldownDays) || (input.sex === 'M' ? 90 : 120),
      mapConsent: input.mapConsent === true,
      mapPoint: input.mapConsent === true && input.mapPoint ? windowObject.RedBloodAvailability.point(input.mapPoint.lat, input.mapPoint.lng) : null,
      status: allowedStatuses.includes(input.status) ? input.status : "pending",
      createdAt: preserveId && input.createdAt ? input.createdAt : now,
      updatedAt: now
    };

    if (preserveId && input.updatedAt) {
      donor.updatedAt = input.updatedAt;
    }

    const rules = windowObject.RedBloodAvailability;
    if(donor.donorType && donor.donationHistory !== (donor.donorType==='first'?'never':'dated')) throw Error('Donor type and donation history must agree. / ദാതാവിന്റെ തരവും ദാനചരിത്രവും പൊരുത്തപ്പെടണം.');
    if (!['unknown', 'never', 'dated'].includes(donor.donationHistory)) throw Error('Choose a valid donation history.');
    if (donor.donationHistory === 'dated' && (!rules.validDate(donor.lastDonationDate) || donor.lastDonationDate > rules.today())) throw Error('Enter a valid past donation date. / ഭാവിയിലല്ലാത്ത ശരിയായ രക്തദാന തീയതി നൽകുക.');
    if (donor.donationHistory !== 'dated') donor.lastDonationDate = '';
    if (!Number.isInteger(donor.cooldownDays) || donor.cooldownDays < (donor.sex === 'M' ? 90 : 120) || donor.cooldownDays > 730) throw Error('Waiting period must be at least 90 days for men or 120 days otherwise, and no more than 730 days.');
    if (donor.availabilityUntil && !Number.isFinite(Date.parse(donor.availabilityUntil))) throw Error('Invalid availability expiry.');
    validateDonor(donor);
    return donor;
  }

  function validateDonor(donor) {
    if (donor.name.length < 2) {
      throw new Error("Enter a valid name. / ശരിയായ പേര് നൽകുക.");
    }

    if (!Number.isInteger(donor.age) || donor.age < 18 || donor.age > 65) {
      throw new Error("Age must be 18–65. / പ്രായം 18–65 ആയിരിക്കണം.");
    }

    if (!allowedSexValues.includes(donor.sex)) {
      throw new Error("Choose a valid gender option.");
    }

    if (!allowedBloodGroups.includes(donor.bloodGroup)) {
      throw new Error("Choose a valid blood group.");
    }

    if (donor.phone.length < 10 || donor.phone.length > 15) {
      throw new Error("Phone must contain 10–15 digits. / ഫോണിൽ 10–15 അക്കങ്ങൾ വേണം.");
    }

    if (donor.location.length < 2) {
      throw new Error("The location must contain at least two characters.");
    }


  }

  function readDonors() {
    try {
      const storedValue = windowObject.localStorage.getItem(STORAGE_KEY);
      const donors = storedValue ? JSON.parse(storedValue) : [];
      return Array.isArray(donors) ? donors : [];
    } catch (error) {
      console.error("RedGold could not read local donor data.", error);
      return [];
    }
  }

  function writeDonors(donors) {
    windowObject.localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
    windowObject.dispatchEvent(new CustomEvent("redgold:donors-changed"));
  }

  function addDonor(input) {
    const donors = readDonors();
    const donor = normaliseDonor(input);

    if (donors.some((item) => item.phone === donor.phone)) {
      throw new Error("This mobile number is already registered. / ഈ മൊബൈൽ നമ്പർ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്.");
    }

    donors.push(donor);
    writeDonors(donors);
    return donor;
  }

  function updateDonor(id, changes) {
    const donors = readDonors();
    const donorIndex = donors.findIndex((donor) => donor.id === id);

    if (donorIndex === -1) {
      throw new Error("The selected donor could not be found.");
    }

    const updatedDonor = normaliseDonor(
      {
        ...donors[donorIndex],
        ...changes,
        id,
        createdAt: donors[donorIndex].createdAt,
        updatedAt: new Date().toISOString()
      },
      true
    );

    const duplicatePhone = donors.some(
      (donor, index) => index !== donorIndex && donor.phone === updatedDonor.phone
    );

    if (duplicatePhone) {
      throw new Error("Another donor already uses this mobile number.");
    }

    donors[donorIndex] = updatedDonor;
    writeDonors(donors);
    return updatedDonor;
  }

  function deleteDonor(id) {
    const donors = readDonors();
    const remainingDonors = donors.filter((donor) => donor.id !== id);

    if (remainingDonors.length === donors.length) {
      throw new Error("The selected donor could not be found.");
    }

    writeDonors(remainingDonors);
  }

  function clearDonors() {
    writeDonors([]);
  }

  function importDonors(value) {
    if (!Array.isArray(value)) {
      throw new Error("The selected backup does not contain a donor list.");
    }

    const donors = value.map((donor) => normaliseDonor(donor, true));
    if (new Set(donors.map(d => d.id)).size !== donors.length) throw Error('The backup contains duplicate record IDs.');
    const uniquePhones = new Set(donors.map((donor) => donor.phone));

    if (uniquePhones.size !== donors.length) {
      throw new Error("The backup contains duplicate mobile numbers.");
    }

    writeDonors(donors);
    return donors.length;
  }

  function loadDemoDonors() {
    const existingDonors = readDonors();
    const existingPhones = new Set(existingDonors.map((donor) => donor.phone));
    const demoDonors = [
      {
        name: "Sample Donor One",
        age: 27,
        sex: "F",
        bloodGroup: "O+",
        phone: "9000000001",
        location: "Alappuzha",
        sharePhone: true,
        available: true,
        status: "approved"
      },
      {
        name: "Sample Donor Two",
        age: 31,
        sex: "M",
        bloodGroup: "A+",
        phone: "9000000002",
        location: "Kochi",
        sharePhone: true,
        available: true,
        status: "approved"
      },
      {
        name: "Sample Donor Three",
        age: 24,
        sex: "O",
        bloodGroup: "B-",
        phone: "9000000003",
        location: "Bangalore",
        sharePhone: true,
        available: false,
        status: "approved"
      },
      {
        name: "Pending Sample",
        age: 29,
        sex: "M",
        bloodGroup: "AB+",
        phone: "9000000004",
        location: "Thiruvananthapuram",
        sharePhone: true,
        available: true,
        status: "pending"
      }
    ];

    const newDonors = demoDonors
      .filter((donor) => !existingPhones.has(donor.phone))
      .map((donor) => normaliseDonor({...donor, homePanchayat:'Demo panchayat',homeWard:'1',permanentAlappuzha:'yes',donorType:'first',region: donor.location, currentArea: donor.location,
        ward: 'Demo ward', donationHistory: 'never',
        availabilityUntil: new Date(Date.now() + 86400000).toISOString(),
        mapConsent: true, mapPoint: donor.location === 'Alappuzha' ? {lat:9.50,lng:76.34} : donor.location === 'Kochi' ? {lat:9.96,lng:76.28} : null}));

    writeDonors([...existingDonors, ...newDonors]);
    return newDonors.length;
  }

  windowObject.RedGoldStore = Object.freeze({
    STORAGE_KEY,
    allowedBloodGroups: [...allowedBloodGroups],
    getDonors: readDonors,
    addDonor,
    updateDonor,
    deleteDonor,
    clearDonors,
    importDonors,
    loadDemoDonors
  });
}(window));
