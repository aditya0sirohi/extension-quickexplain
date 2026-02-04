const api = typeof browser !== "undefined" ? browser : chrome;

const toggle = document.getElementById("toggle");

// Load saved state
api.storage.local.get(["enabled"], (res) => {
  toggle.checked = res.enabled !== false; // default ON
});

// Handle toggle
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  api.storage.local.set({ enabled });
});
