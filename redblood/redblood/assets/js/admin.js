"use strict";

(function initialiseAdminDashboard() {
const store = window.RedGoldStore;
const donorTable = document.querySelector("[data-donor-table]");
const emptyState = document.querySelector("[data-admin-empty]");
const searchInput = document.querySelector("[data-admin-search]");
const bloodFilter = document.querySelector("[data-admin-blood]");
const statusFilter = document.querySelector("[data-admin-status]");
const editDialog = document.querySelector("[data-edit-dialog]");
const editForm = document.querySelector("[data-edit-form]");
const editError = document.querySelector("[data-edit-error]");
const toast = document.querySelector("[data-toast]");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast is-visible ${type === "error" ? "toast-error" : ""}`;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function updateStatistics(donors) {
  const values = {
    total: donors.length,
    approved: donors.filter((donor) => donor.status === "approved").length,
    available: donors.filter((donor) => donor.status === "approved" && donor.available).length,
    pending: donors.filter((donor) => donor.status === "pending").length
  };

  Object.entries(values).forEach(([name, value]) => {
    const element = document.querySelector(`[data-stat="${name}"]`);
    if (element) {
      element.textContent = String(value);
    }
  });
}

function getFilteredDonors(donors) {
  const term = searchInput.value.trim().toLowerCase();

  return donors
    .filter((donor) => !term || [donor.name, donor.phone, donor.location]
      .some((value) => value.toLowerCase().includes(term)))
    .filter((donor) => !bloodFilter.value || donor.bloodGroup === bloodFilter.value)
    .filter((donor) => !statusFilter.value || donor.status === statusFilter.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderDashboard() {
  const donors = store.getDonors();
  const filteredDonors = getFilteredDonors(donors);
  updateStatistics(donors);

  emptyState.hidden = filteredDonors.length !== 0;
  donorTable.closest(".table-wrap").hidden = filteredDonors.length === 0;

  donorTable.innerHTML = filteredDonors.map((donor) => `
    <tr>
      <td data-label="Donor">
        <strong>${escapeHtml(donor.name)}</strong>
        <small>${escapeHtml(donor.location)} · Age ${escapeHtml(donor.age)}</small>
      </td>
      <td data-label="Blood"><span class="table-blood">${escapeHtml(donor.bloodGroup)}</span></td>
      <td data-label="Contact">
        <a href="tel:${escapeHtml(donor.phone)}">${escapeHtml(donor.phone)}</a>
        <small>${escapeHtml({ M: "Male", F: "Female", O: "Other" }[donor.sex] || "Other")}</small>
      </td>
      <td data-label="Status">
        <span class="status-pill status-${escapeHtml(donor.status)}">${escapeHtml(statusLabel(donor.status))}</span>
      </td>
      <td data-label="Availability">
        <button class="switch-button ${donor.available ? "is-on" : ""}" type="button" data-action="availability" data-id="${escapeHtml(donor.id)}" aria-pressed="${donor.available}">
          ${donor.available ? "Available" : "Unavailable"}
        </button>
      </td>
      <td data-label="Actions">
        <div class="row-actions">
          ${donor.status !== "approved" ? `<button type="button" data-action="approve" data-id="${escapeHtml(donor.id)}">Approve</button>` : ""}
          ${donor.status !== "rejected" ? `<button type="button" data-action="reject" data-id="${escapeHtml(donor.id)}">Reject</button>` : ""}
          <button type="button" data-action="edit" data-id="${escapeHtml(donor.id)}">Edit</button>
          <button class="danger-link" type="button" data-action="delete" data-id="${escapeHtml(donor.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openEditDialog(id) {
  const donor = store.getDonors().find((item) => item.id === id);

  if (!donor) {
    showToast("The selected donor could not be found.", "error");
    return;
  }

  editError.textContent = "";
  editForm.elements.id.value = donor.id;
  editForm.elements.name.value = donor.name;
  editForm.elements.age.value = donor.age;
  editForm.elements.sex.value = donor.sex;
  editForm.elements.bloodGroup.value = donor.bloodGroup;
  editForm.elements.phone.value = donor.phone;
  editForm.elements.location.value = donor.location;
  editDialog.showModal();
}

donorTable.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  const donor = store.getDonors().find((item) => item.id === id);

  if (!donor) {
    showToast("The selected donor could not be found.", "error");
    return;
  }

  try {
    if (action === "approve") {
      store.updateDonor(id, { status: "approved" });
      showToast(`${donor.name} approved.`);
    } else if (action === "reject") {
      store.updateDonor(id, { status: "rejected" });
      showToast(`${donor.name} rejected.`);
    } else if (action === "availability") {
      store.updateDonor(id, { available: !donor.available });
      showToast(`Availability updated for ${donor.name}.`);
    } else if (action === "edit") {
      openEditDialog(id);
    } else if (action === "delete" && window.confirm(`Delete ${donor.name}? This cannot be undone.`)) {
      store.deleteDonor(id);
      showToast(`${donor.name} deleted.`);
    }
  } catch (error) {
    showToast(error.message, "error");
  }
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(editForm);

  try {
    store.updateDonor(formData.get("id"), {
      name: formData.get("name"),
      age: Number(formData.get("age")),
      sex: formData.get("sex"),
      bloodGroup: formData.get("bloodGroup"),
      phone: formData.get("phone"),
      location: formData.get("location")
    });
    editDialog.close();
    showToast("Donor details updated.");
  } catch (error) {
    editError.textContent = error.message;
  }
});

document.querySelectorAll("[data-dialog-cancel]").forEach((button) => {
  button.addEventListener("click", () => editDialog.close());
});

[searchInput, bloodFilter, statusFilter].forEach((element) => {
  element.addEventListener("input", renderDashboard);
});

document.querySelector("[data-load-demo]").addEventListener("click", () => {
  const added = store.loadDemoDonors();
  showToast(added ? `${added} demonstration donors added.` : "Demo donors are already loaded.");
});

document.querySelector("[data-export]").addEventListener("click", () => {
  const donors = store.getDonors();
  const blob = new Blob([JSON.stringify(donors, null, 2)], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = downloadUrl;
  link.download = `redgold-donors-${date}.json`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast(`${donors.length} donor records exported.`);
});

document.querySelector("[data-import]").addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const value = JSON.parse(reader.result);

      if (!window.confirm("Importing will replace all current local donor records. Continue?")) {
        return;
      }

      const count = store.importDonors(value);
      showToast(`${count} donor records imported.`);
    } catch (error) {
      showToast(`Import failed: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
});

document.querySelector("[data-clear]").addEventListener("click", () => {
  if (window.confirm("Delete every local donor record? Export a backup first if needed.")) {
    store.clearDonors();
    showToast("All local donor records deleted.");
  }
});

window.addEventListener("redgold:donors-changed", renderDashboard);
renderDashboard();
}());
