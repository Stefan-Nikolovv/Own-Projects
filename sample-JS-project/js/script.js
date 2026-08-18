import { router } from "./router.js";
import { supabase } from "./supabase.js";
import { applyTranslations, initLanguageSwitcher, initThemeToggle, t } from "./i18n.js";

let pendingServiceWorker = null;
let reloadForUpdate = false;

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
