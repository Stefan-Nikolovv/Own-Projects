const routes = {
  "#home": {
    html: "pages/home/home.html",
    js: "pages/home/home.js",
  },
  "#about": {
    html: "pages/about/about.html",
    js: "pages/about/about.js",
  },
  "#schedule": {
    html: "pages/schedule/schedule.html",
    js: "pages/schedule/schedule.js",
  },
  "#login": {
    html: "pages/login/login.html",
    js: "pages/login/login.js",
  },
};

export async function router() {
  const app = document.getElementById("app");
  const hash = window.location.hash || "#home";
  const route = routes[hash];

  if (!route) {
    app.textContent = "404 - Page not found";
    return;
  }

  try {
    const response = await fetch(route.html);
    if (!response.ok) {
      throw new Error(`Failed to load ${route.html}: ${response.status}`);
    }
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    app.replaceChildren(...doc.body.childNodes);

    const pageModule = await import(`../${route.js}`);

    if (pageModule.init) {
      await pageModule.init();
    }
  } catch (error) {
    console.error("Router error:", error);
    app.innerHTML = `<div class="page"><h1>Error loading page</h1><p>${error.message}</p></div>`;
  }
}
