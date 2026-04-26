const STORAGE_KEY = "app_language";

export const translations = {
  en: {
    nav_home: "Home",
    nav_schedule: "Schedule",
    nav_contact: "Contact",

    home_title: "Train with Silvia Mihaylova",
    home_subtitle: "Personal Training",
    home_book: "Book your spot",

    schedule_title: "Weekly Schedule",
    schedule_subtitle: "Choose a slot and save your spot.",
    no_slots: "No training slots available.",
    spots_left: "{count} spots left",
    full: "Full",
    booked_total: "{booked} booked / {capacity} total",

    dialog_name_label: "Your name",
    dialog_phone_label: "Phone number",
    dialog_saved_names: "Saved names",
    dialog_save: "Save your spot",
    dialog_update: "Update booking",
    dialog_cancel_edit: "Cancel edit",
    dialog_no_names: "No saved names yet.",

    msg_enter_name: "Please enter your name.",
    msg_duplicate: "This name is already saved for this slot.",
    msg_full: "No spots left for this slot.",
    msg_saved: "Your spot has been saved!",
    msg_updated: "Booking updated successfully!",
    msg_removed: "Booking removed successfully.",
    msg_update_failed: "Failed to update booking. Please try again.",
    msg_save_failed: "Failed to save. Please try again.",

    edit_btn: "Edit",
    remove_btn_small: "Remove",

    remove_eyebrow: "Remove booking",
    remove_question: "Are you sure?",
    remove_text: "This booking will be removed from the selected slot.",
    remove_keep: "Keep booking",
    remove_btn: "Remove",

    footer_rights: "All rights reserved.",
  },

  bg: {
    nav_home: "Начало",
    nav_schedule: "График",
    nav_contact: "Контакти",

    home_title: "Тренирай със Силвия Михайлова",
    home_subtitle: "Персонални тренировки",
    home_book: "Запази място",

    schedule_title: "Седмичен график",
    schedule_subtitle: "Избери час и запази своето място.",
    no_slots: "Няма налични тренировки.",
    spots_left: "Остават {count} места",
    full: "Запълнено",
    booked_total: "{booked} записани / {capacity} общо",

    dialog_name_label: "Твоето име",
    dialog_phone_label: "Телефонен номер",
    dialog_saved_names: "Записани имена",
    dialog_save: "Запази място",
    dialog_update: "Обнови записването",
    dialog_cancel_edit: "Откажи редакцията",
    dialog_no_names: "Все още няма записани имена.",

    msg_enter_name: "Моля, въведи име.",
    msg_duplicate: "Това име вече е записано за този час.",
    msg_full: "Няма свободни места за този час.",
    msg_saved: "Твоето място беше запазено!",
    msg_updated: "Записването беше обновено успешно!",
    msg_removed: "Записването беше премахнато успешно.",
    msg_update_failed: "Неуспешно обновяване. Опитай отново.",
    msg_save_failed: "Неуспешно запазване. Опитай отново.",

    edit_btn: "Редактирай",
    remove_btn_small: "Изтрий",

    remove_eyebrow: "Премахване на записване",
    remove_question: "Сигурни ли сте?",
    remove_text: "Това записване ще бъде премахнато от избрания час.",
    remove_keep: "Запази записването",
    remove_btn: "Премахни",

    footer_rights: "Всички права запазени.",
  },
};

let currentLanguage = localStorage.getItem(STORAGE_KEY) || "en";

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

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      setLanguage(btn.dataset.lang);
      syncActive();
      if (onChange) {
        await onChange();
      }
    });
  });

  syncActive();
}
