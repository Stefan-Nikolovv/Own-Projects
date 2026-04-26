let currentLanguage = localStorage.getItem(STORAGE_KEY);

if (!currentLanguage) {
  currentLanguage = "en";
  localStorage.setItem(STORAGE_KEY, currentLanguage);
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  currentLanguage = lang === "bg" ? "bg" : "en";
  localStorage.setItem(STORAGE_KEY, currentLanguage);
}

export function getLocale() {
  return currentLanguage === "bg" ? "bg-BG" : "en-GB";
}

export function t(key, vars = {}) {
  const text =
    translations[currentLanguage]?.[key] ?? translations.en?.[key] ?? key;

  return Object.entries(vars).reduce((result, [name, value]) => {
    return result.replaceAll(`{${name}}`, String(value));
  }, text);
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
}

export function initLanguageSwitcher(onChange) {
  const buttons = document.querySelectorAll(".lang-btn");

  const syncActive = () => {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === currentLanguage);
    });
  };

  syncActive();

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setLanguage(btn.dataset.lang);
      syncActive();

      if (onChange) {
        await onChange();
      }

      applyTranslations(document);
    });
  });
}
