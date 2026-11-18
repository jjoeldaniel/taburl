const STORAGE_KEY = "taburl";
const form = document.getElementById("settings-form");
const input = document.getElementById("url-input");
const clearBtn = document.getElementById("clear-btn");
const status = document.getElementById("status");

function syncLocalCache(url) {
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEY, url);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Non-fatal if localStorage is unavailable.
  }
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.error = isError ? "true" : "false";
}

function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:(?!\d+(?:[/?#]|$))/.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("Please enter a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are supported.");
  }

  return parsed.href;
}

async function loadSettings() {
  try {
    const { [STORAGE_KEY]: tabUrl } =
      await browser.storage.local.get(STORAGE_KEY);
    if (typeof tabUrl === "string") {
      input.value = tabUrl;
      syncLocalCache(tabUrl);
    }
  } catch {
    setStatus("Could not load saved settings.", true);
  }
}

async function clearUrl() {
  await browser.storage.local.remove(STORAGE_KEY);
  syncLocalCache("");
  input.value = "";
  setStatus("Cleared.");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const normalized = normalizeUrl(input.value);
    if (!normalized) {
      await clearUrl();
      return;
    }
    await browser.storage.local.set({ [STORAGE_KEY]: normalized });
    syncLocalCache(normalized);
    input.value = normalized;
    setStatus("Saved.");
  } catch (err) {
    setStatus(err.message || "Failed to save URL.", true);
  }
});

clearBtn.addEventListener("click", async () => {
  try {
    await clearUrl();
  } catch {
    setStatus("Failed to clear URL.", true);
  }
});

loadSettings();
