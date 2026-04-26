const STORAGE_KEY = "app_language";

export const translations = {
  en: {
    nav_home: "Home",
    nav_schedule: "Schedule",
    nav_contact: "Contact",
    nav_login: "Login",
    nav_logout: "Logout",
    brand_subtitle: "Personal Training",

    home_title: "Train with Silvia Mihaylova",
    home_subtitle: "Personal Training",
    home_text:
      "High-energy group sessions with a clean schedule, fast booking, and a simple weekly experience.",
    home_book: "Book your spot",
    home_small_group_title: "Small group feel",
    home_small_group_text:
      "Each slot has limited capacity, so the gym stays comfortable.",
    home_fast_booking_title: "Fast booking",
    home_fast_booking_text:
      "Choose a day, open the slot, enter your name, and save your spot.",
    home_weekly_plan_title: "Weekly plan",
    home_weekly_plan_text: "Clear day-by-day schedule from Monday to Sunday.",

    schedule_title: "Weekly Schedule",
    schedule_subtitle: "Choose a slot and save your spot.",
    no_slots: "No training slots available.",
    day_locked_badge: "Locked",
    day_locked_message:
      "Bookings for this day are currently locked. Please check again later.",
    lock_day: "Lock day",
    unlock_day: "Unlock day",
    lock_day_hint: "Click to lock this day",
    unlock_day_hint: "Click to unlock this day",
    day_lock_failed:
      "Could not update this lock. Make sure you are logged in as admin.",
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
    msg_day_locked: "Bookings for this day are locked.",
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

    login_title: "Admin Login",
    login_subtitle: "Sign in to manage bookings and view client details.",
    login_email_label: "Email",
    login_email_placeholder: "your@email.com",
    login_password_label: "Password",
    login_password_placeholder: "Password",
    login_button: "Log in",
    login_loading: "Logging in...",
    login_missing: "Please enter your email and password.",
    login_invalid: "Invalid email or password.",

    not_found: "404 - Page not found",
    load_failed: "Could not load page.",

    footer_contact: "Contact us.",
    footer_location: "Location",
    footer_rights: "All rights reserved.",
  },

  bg: {
    nav_home: "Начало",
    nav_schedule: "График",
    nav_contact: "Контакти",
    nav_login: "Влизане",
    nav_logout: "Изход",
    brand_subtitle: "Персонални тренировки",

    home_title: "Тренирай със Силвия Михайлова",
    home_subtitle: "Персонални тренировки",
    home_text:
      "Енергични групови тренировки с ясен график, бързо записване и удобен седмичен план.",
    home_book: "Запази място",
    home_small_group_title: "Малки групи",
    home_small_group_text:
      "Всеки час е с ограничен капацитет, за да има комфорт в залата.",
    home_fast_booking_title: "Бързо записване",
    home_fast_booking_text:
      "Избери ден, отвори часа, въведи името си и запази място.",
    home_weekly_plan_title: "Седмичен план",
    home_weekly_plan_text: "Ясен график по дни от понеделник до неделя.",

    schedule_title: "Седмичен график",
    schedule_subtitle: "Избери час и запази своето място.",
    no_slots: "Няма налични тренировки.",
    day_locked_badge: "Заключено",
    day_locked_message:
      "Записванията за този ден в момента са заключени. Моля, проверете по-късно.",
    lock_day: "Заключи деня",
    unlock_day: "Отключи деня",
    lock_day_hint: "Натисни, за да заключиш деня",
    unlock_day_hint: "Натисни, за да отключиш деня",
    day_lock_failed:
      "Заключването не беше обновено. Увери се, че си влязъл като админ.",
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
    msg_day_locked: "Записванията за този ден са заключени.",
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

    login_title: "Админ вход",
    login_subtitle:
      "Влез, за да управляваш записванията и да виждаш данните на клиентите.",
    login_email_label: "Имейл",
    login_email_placeholder: "your@email.com",
    login_password_label: "Парола",
    login_password_placeholder: "Парола",
    login_button: "Влез",
    login_loading: "Влизане...",
    login_missing: "Моля, въведи имейл и парола.",
    login_invalid: "Невалиден имейл или парола.",

    not_found: "404 - Страницата не е намерена",
    load_failed: "Страницата не може да се зареди.",

    footer_contact: "Свържете се с нас.",
    footer_location: "Локация",
    footer_rights: "Всички права запазени.",
  },
};

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
  document.documentElement.lang = currentLanguage;
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
  document.documentElement.lang = currentLanguage;

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
