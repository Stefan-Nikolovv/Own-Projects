import { applyTranslations } from "./i18n.js";

const routes = {
  "#home": {
    html: "/pages/home/home.html",
    js: "/pages/home/home.js",
  },
  "#schedule": {
    html: "/pages/schedule/schedule.html",
    js: "/pages/schedule/schedule.js",
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
    app.textContent = "404 - Page not found";
    return;
  }

  try {
    const response = await fetch(route.html);
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    app.replaceChildren(...doc.body.childNodes);
    applyTranslations(app);

    const pageModule = await import(route.js);
    if (pageModule.init) {
      await pageModule.init();
    }

    setActiveLink(routeName);
  } catch (error) {
    console.error("Router error:", error);
    app.textContent = "Could not load page.";
  }
}
