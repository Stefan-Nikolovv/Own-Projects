import { applyTranslations, t } from "./i18n.js";

const APP_VERSION = "20260804-59";

let activePageModule = null;
let navigationId = 0;
let navigationQueue = Promise.resolve();

const routes = {
  "#home": {
    html: "/pages/home/home.html",
    js: "/pages/home/home.js",
  },
  "#schedule": {
    html: "/pages/schedule/schedule.html",
    js: "/pages/schedule/schedule.js",
  },
  "#bookings": {
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

async function cleanupActivePage() {
  const pageModule = activePageModule;
  activePageModule = null;
  await pageModule?.destroy?.();
}

export function router() {
  const currentNavigationId = ++navigationId;
  navigationQueue = navigationQueue
    .catch(() => {})
    .then(() => runRoute(currentNavigationId));
  return navigationQueue;
}

async function runRoute(currentNavigationId) {
  if (currentNavigationId !== navigationId) return;

  const app = document.getElementById("app");
  const routeName = window.location.hash.replace("#", "") || "home";
  const route = routes[`#${routeName}`];

  if (!route) {
    await cleanupActivePage();
    if (currentNavigationId !== navigationId) return;
    app.textContent = t("not_found");
    return;
  }

  try {
    const response = await fetch(`${route.html}?v=${APP_VERSION}`);
    if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const pageModule = await import(`${route.js}?v=${APP_VERSION}`);
    if (currentNavigationId !== navigationId) return;

    await cleanupActivePage();
    if (currentNavigationId !== navigationId) return;

    const renderRoute = () => {
      app.replaceChildren(...doc.body.childNodes);
      applyTranslations(app);
      setActiveLink(routeName);
    };

    if (
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.documentElement.classList.add("is-route-transitioning");
      const transition = document.startViewTransition(renderRoute);
      transition.finished.finally(() => {
        document.documentElement.classList.remove("is-route-transitioning");
      });
      await transition.updateCallbackDone;
    } else {
      renderRoute();
    }

    activePageModule = pageModule;
    if (pageModule.init) {
      if (routeName === "bookings") {
        sessionStorage.setItem("emotion_open_my_bookings", "1");
      }
      await pageModule.init();
    }

    applyTranslations(app);
  } catch (error) {
    if (currentNavigationId !== navigationId) return;
    console.error("Router error:", error);
    await cleanupActivePage().catch((cleanupError) => {
      console.error("Page cleanup error:", cleanupError);
    });
    app.textContent = t("load_failed");
  }
}
