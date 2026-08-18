import { router } from "./router.js";
import { supabase } from "./supabase.js";
import { applyTranslations, initLanguageSwitcher, initThemeToggle, t } from "./i18n.js";

let pendingServiceWorker = null;
let reloadForUpdate = false;
let connectionWasOffline = !navigator.onLine;
let connectionStatusTimer = null;

function initMobileInputZoomGuard() {
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  const originalContent = viewport.content;
  const lockedContent = `${originalContent.replace(
    /,\s*maximum-scale\s*=\s*[^,]+/i,
    ""
  )}, maximum-scale=1`;
  const isFormControl = (target) =>
    target instanceof Element &&
    Boolean(target.closest("input, textarea, select, [contenteditable='true']"));

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (isFormControl(event.target)) viewport.content = lockedContent;
    },
    { capture: true, passive: true }
  );
  document.addEventListener("focusin", (event) => {
    if (isFormControl(event.target)) viewport.content = lockedContent;
  });
  document.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!isFormControl(document.activeElement)) {
        viewport.content = originalContent;
      }
    }, 250);
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.deferredInstallPrompt = event;
  window.dispatchEvent(new CustomEvent("app-install-ready"));
});

function showPwaUpdate(worker) {
  if (!worker || sessionStorage.getItem("emotion_update_dismissed") === "1") {
    return;
  }

  pendingServiceWorker = worker;
  document.getElementById("pwaUpdateToast")?.classList.remove("hidden");
}

function bindPwaUpdateActions() {
  const toast = document.getElementById("pwaUpdateToast");
  const applyButton = document.getElementById("applyPwaUpdateBtn");
  const dismissButton = document.getElementById("dismissPwaUpdateBtn");

  applyButton?.addEventListener("click", () => {
    if (!pendingServiceWorker) {
      window.location.reload();
      return;
    }

    reloadForUpdate = true;
    applyButton.disabled = true;
    applyButton.classList.add("is-updating");
    pendingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  });

  dismissButton?.addEventListener("click", () => {
    sessionStorage.setItem("emotion_update_dismissed", "1");
    toast?.classList.add("hidden");
  });
}

function showConnectionStatus(isOnline, transient = false) {
  const status = document.getElementById("connectionStatus");
  const title = document.getElementById("connectionStatusTitle");
  const text = document.getElementById("connectionStatusText");
  const icon = status?.querySelector("i");
  if (!status || !title || !text || !icon) return;

  window.clearTimeout(connectionStatusTimer);
  document.body.classList.toggle("is-offline", !isOnline);
  status.classList.remove("hidden", "is-online", "is-offline");
  status.classList.add(isOnline ? "is-online" : "is-offline");
  icon.className = isOnline
    ? "fa-solid fa-wifi"
    : "fa-solid fa-wifi-slash";
  title.textContent = t(
    isOnline ? "connection_online_title" : "connection_offline_title"
  );
  text.textContent = t(
    isOnline ? "connection_online_text" : "connection_offline_text"
  );

  if (transient) {
    connectionStatusTimer = window.setTimeout(() => {
      status.classList.add("hidden");
    }, 3200);
  }
}

async function handleConnectionRestored() {
  const shouldRefresh = connectionWasOffline;
  connectionWasOffline = false;
  showConnectionStatus(true, true);
  window.dispatchEvent(new CustomEvent("emotion:connection-restored"));

  const isScheduleRoute = ["#schedule", "#bookings"].includes(
    window.location.hash
  );
  const hasOpenDialog = Boolean(document.querySelector("dialog[open]"));
  if (shouldRefresh && isScheduleRoute && !hasOpenDialog) {
    await router();
    await updateAuthNav();
  }
}

function handleConnectionLost() {
  connectionWasOffline = true;
  showConnectionStatus(false);
}

window.addEventListener("online", handleConnectionRestored);
window.addEventListener("offline", handleConnectionLost);

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");

    if (registration.waiting && navigator.serviceWorker.controller) {
      showPwaUpdate(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      installingWorker?.addEventListener("statechange", () => {
        if (
          installingWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showPwaUpdate(registration.waiting || installingWorker);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadForUpdate) return;
      reloadForUpdate = false;
      window.location.reload();
    });
  } catch (error) {
    console.warn("Service worker registration failed:", error.message);
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", registerServiceWorker);
}

async function updateAuthNav() {
  const authLink = document.getElementById("authNavLink");
  if (!authLink) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authLabel = authLink.querySelector(".nav-label");
  const updateLabel = (translationKey) => {
    if (authLabel) {
      authLabel.dataset.i18n = translationKey;
      authLabel.textContent = t(translationKey);
      return;
    }

    authLink.textContent = t(translationKey);
  };

  if (user) {
    updateLabel("nav_logout");
    authLink.href = "#";
    authLink.onclick = async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.hash = "#home";
    };
  } else {
    updateLabel("nav_login");
    authLink.href = "#login";
    authLink.onclick = null;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  bindPwaUpdateActions();
  initMobileInputZoomGuard();
  if (!navigator.onLine) showConnectionStatus(false);
  initLanguageSwitcher(async () => {
    await router();
    await updateAuthNav();
  });

  initThemeToggle();

  applyTranslations(document);
  await updateAuthNav();
  await router();
});

window.addEventListener("hashchange", async () => {
  await router();
  await updateAuthNav();
});

supabase.auth.onAuthStateChange(() => {
  updateAuthNav();
});
