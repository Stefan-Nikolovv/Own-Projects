import { router } from "./router.js";
import { supabase } from "./supabase.js";
import { applyTranslations, initLanguageSwitcher, t } from "./i18n.js";

async function updateAuthNav() {
  const authLink = document.getElementById("authNavLink");
  if (!authLink) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    authLink.dataset.i18n = "nav_logout";
    authLink.textContent = t("nav_logout");
    authLink.href = "#";
    authLink.onclick = async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.hash = "#home";
    };
  } else {
    authLink.dataset.i18n = "nav_login";
    authLink.textContent = t("nav_login");
    authLink.href = "#login";
    authLink.onclick = null;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  initLanguageSwitcher(async () => {
    await router();
    await updateAuthNav();
  });

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
