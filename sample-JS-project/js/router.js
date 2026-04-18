const routes = {
  "#home": {
    html: "/pages/home/home.html",
    js: "/pages/home/home.js",
  },
  "#about": {
    html: "/pages/about/about.html",
    js: "/pages/about/about.js",
  },
  "#schedule": {
    html: "/pages/schedule/schedule.html",
    js: "/pages/schedule/schedule.js",
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

  const response = await fetch(route.html);
  const htmlText = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  app.replaceChildren(...doc.body.childNodes);

  const pageModule = await import(route.js);

  if (pageModule.init) {
    pageModule.init();
  }
}
