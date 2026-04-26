import { supabase } from "../../js/supabase.js";
import { t } from "../../js/i18n.js";

export async function init() {
  // Already logged in → go straight to schedule
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    window.location.hash = "#schedule";
    return;
  }

  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showError(t("login_missing"));
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = t("login_loading");
    hideError();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(t("login_invalid"));
      loginBtn.disabled = false;
      loginBtn.textContent = t("login_button");
      return;
    }

    window.location.hash = "#schedule";
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
  }

  function hideError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
}
