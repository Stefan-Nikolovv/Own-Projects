export function init() {
  const bookBtn = document.querySelector(".primary-btn");

  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      window.location.hash = "#schedule";
    });
  }
}
