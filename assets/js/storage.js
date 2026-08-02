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
      status: allowedStatuses.includes(input.status) ? input.status : "pending",
      createdAt: preserveId && input.createdAt ? input.createdAt : now,
      updatedAt: now
    };

    if (preserveId && input.updatedAt) {
      donor.updatedAt = input.updatedAt;
    }

    validateDonor(donor);
    return donor;
  }

  function validateDonor(donor) {
    if (donor.name.length < 2) {
      throw new Error("The donor name must contain at least two characters.");
    }

    if (!Number.isInteger(donor.age) || donor.age < 18 || donor.age > 65) {
      throw new Error("The donor age must be between 18 and 65.");
    }

    if (!allowedSexValues.includes(donor.sex)) {
      throw new Error("Choose a valid gender option.");
    }

    if (!allowedBloodGroups.includes(donor.bloodGroup)) {
      throw new Error("Choose a valid blood group.");
    }

    if (donor.phone.length < 10 || donor.phone.length > 15) {
      throw new Error("The mobile number must contain 10 to 15 digits.");
    }

    if (donor.location.length < 2) {
      throw new Error("The location must contain at least two characters.");
    }

    if (!donor.sharePhone) {
      throw new Error("Contact-sharing consent is required.");
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
      throw new Error("This mobile number is already registered.");
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
      .map((donor) => normaliseDonor(donor));

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
