const STORAGE_KEY = "taburl";
const HTTP_URL_RE = /^https?:\/\//i;

function isValidHttpUrl(url) {
  return typeof url === "string" && HTTP_URL_RE.test(url);
}

async function openInTabWithoutUrlBarFocus(url) {
  try {
    const currentTab = await browser.tabs.getCurrent();
    if (currentTab && typeof currentTab.id === "number") {
      // Creating a new tab with an explicit URL places focus on the page rather
      // than Firefox's default new-tab selection on the address bar.
      await browser.tabs.create({
        url,
        active: true,
        windowId: currentTab.windowId,
        index: currentTab.index,
      });
      await browser.tabs.remove(currentTab.id);
      return;
    }
  } catch (err) {
    console.error("TabURL: tab replacement failed, falling back to location.replace:", err);
  }
  window.location.replace(url);
}

async function init() {
  let targetUrl = null;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (isValidHttpUrl(cached)) {
      targetUrl = cached;
    }
  } catch {
    // Ignore localStorage errors and fall back to browser.storage.local.
  }

  if (!targetUrl) {
    try {
      const { [STORAGE_KEY]: stored } =
        await browser.storage.local.get(STORAGE_KEY);
      if (isValidHttpUrl(stored)) {
        targetUrl = stored;
        try {
          localStorage.setItem(STORAGE_KEY, stored);
        } catch {
          // Non-fatal if localStorage is unavailable.
        }
      }
    } catch (err) {
      console.error("TabURL: failed to load URL:", err);
    }
  }

  if (targetUrl) {
    await openInTabWithoutUrlBarFocus(targetUrl);
    return;
  }

  const showSetup = () => {
    const main = document.getElementById("setup");
    const btn = document.getElementById("open-options");
    if (main) {
      main.hidden = false;
    }
    if (btn) {
      btn.addEventListener("click", () => browser.runtime.openOptionsPage());
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showSetup, { once: true });
  } else {
    showSetup();
  }
}

init();
