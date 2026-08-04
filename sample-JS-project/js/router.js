import { applyTranslations, t } from "./i18n.js";

const APP_VERSION = "20260804-31";

const routes = {
  "#home": {
    html: "/pages/home/home.html",
    js: "/pages/home/home.js",
  },
  "#schedule": {
    html: "/pages/schedule/schedule.html",
    js: "/pages/schedule/schedule.js",
  },
  "#login": {
    html: "/pages/login/login.html",
    js: "/pages/login/login.js",
  },
  "#contact": {
    html: "/pages/contact/contact.html",
    js: "/pages/contact/contact.js",
  },
};

function setActiveLink(currentRoute) {
  const links = document.querySelectorAll(".navbar a[href^='#']");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === `#${currentRoute}`);
  });
}

export async function router() {
  const app = document.getElementById("app");
  const routeName = window.location.hash.replace("#", "") || "home";
  const route = routes[`#${routeName}`];

  if (!route) {
    app.textContent = t("not_found");
    return;
  }

  try {
    const response = await fetch(`${route.html}?v=${APP_VERSION}`, {
      cache: "no-store",
    });
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    app.replaceChildren(...doc.body.childNodes);

    const pageModule = await import(`${route.js}?v=${APP_VERSION}`);
    if (pageModule.init) {
      await pageModule.init();
    }

    applyTranslations(app);
    setActiveLink(routeName);
  } catch (error) {
    console.error("Router error:", error);
    app.textContent = t("load_failed");
  }
}
