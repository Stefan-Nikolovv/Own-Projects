import { router } from "./router.js";
import { supabase } from "./supabase.js";

async function updateAuthNav() {
  const authLink = document.getElementById("authNavLink");
  if (!authLink) {
    console.log("authNavLink not found");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (user) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.onclick = async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.hash = "#home";
    };
  } else {
    authLink.textContent = "Login";
    authLink.href = "#login";
    authLink.onclick = null;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  updateAuthNav();
  router();
});

window.addEventListener("hashchange", router);

supabase.auth.onAuthStateChange(() => {
  updateAuthNav();
});
