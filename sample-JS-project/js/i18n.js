const STORAGE_KEY = "app_language";

export const translations = {
  en: {
    nav_home: "Home",
    nav_schedule: "Schedule",
    nav_contact: "Contact",
    nav_login: "Login",
    nav_logout: "Logout",
    brand_subtitle: "Personal Training",

    home_title: "Train with Silviya Mihaylova",
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
    previous_week: "Previous week",
    next_week: "Next week",
    today: "Today",
    past: "Past",
    no_slots: "No training slots available.",
    schedule_setup_required:
      "The schedule could not be prepared. The database migration may still need to be applied.",
    schedule_load_failed: "Could not load the bookings for this session.",
    day_locked_badge: "Locked",
    day_locked_message:
      "Bookings for this day are currently locked. Please check again later.",
    lock_day: "Lock day",
    unlock_day: "Unlock day",
    lock_day_hint: "Click to lock this day",
    unlock_day_hint: "Click to unlock this day",
    day_lock_failed:
      "Could not update this lock. Make sure you are logged in as admin.",
    slot_locked_badge: "Slot locked",
    lock_slot: "Lock slot",
    unlock_slot: "Unlock slot",
    lock_slot_hint: "Click to lock this training slot",
    unlock_slot_hint: "Click to unlock this training slot",
    slot_lock_failed:
      "Could not update this slot lock. Make sure you are logged in as admin.",
    spots_left: "{count} spots left",
    almost_full: "Only {count} left",
    full: "Full",
    join_waitlist_short: "Join waitlist",
    booked_total: "{booked} booked / {capacity} total",
    next_available: "Next available",
    next_available_at: "Next: {date} at {time}",
    no_available_slots: "No available slots this week",

    my_bookings: "My bookings",
    booking_tools: "Booking tools",
    my_bookings_hint: "View device bookings or find them by the exact phone or email used when booking.",
    my_bookings_loading: "Loading your reservations...",
    my_bookings_failed: "Your reservations could not be loaded.",
    my_bookings_refreshed: "Your reservations are up to date.",
    booking_search_label: "Find by phone or email",
    booking_search_placeholder: "Phone or email",
    booking_search_loading: "Searching for your bookings...",
    booking_search_invalid: "Enter a valid phone number or email.",
    booking_search_failed: "Bookings could not be searched right now.",
    booking_search_empty: "No bookings match this phone or email.",
    booking_search_found: "Found {count} booking(s).",
    search: "Search",
    refresh: "Refresh",
    reminders: "Reminders",
    install_app: "Install app",
    install_hint: "Use your browser menu to add this app to your home screen.",
    notifications_enabled: "Training reminders are enabled.",
    notifications_denied: "Notification permission was not granted.",
    notifications_unsupported: "Notifications are not supported on this device.",
    reminder_title: "Training reminder",
    reminder_body: "Your training is on {date} at {time}.",
    waitlist_promoted_title: "A spot opened up!",
    waitlist_promoted_body: "You are booked for {date} at {time}.",
    day_reopened_title: "Bookings reopened",
    day_reopened_body: "Training bookings for {date} are open again.",
    feature_migration_required: "Apply the booking experience migration to enable this feature.",
    recurring_booking: "Repeat this booking",
    recurring_weeks: "Weeks",
    recurring_saved: "{count} training sessions were booked!",
    join_waitlist: "Join waiting list",
    waitlist_joined: "You joined the waiting list at position {position}.",
    waitlist_failed: "The waiting list could not be updated.",
    waitlist_position: "Waiting #{position}",
    add_calendar: "Add to calendar",
    reschedule: "Move",
    reschedule_target: "Choose another training session",
    cancel_booking: "Cancel",
    booking_moved: "Your booking was moved successfully.",
    booking_cancelled: "Your booking was cancelled.",
    manage_booking_failed: "This booking could not be changed. The two-hour cutoff may have passed.",
    msg_booking_cutoff: "Bookings close two hours before training.",

    admin_overview: "Admin overview",
    weekly_dashboard: "Dashboard",
    dashboard_loading: "Loading this week's activity...",
    dashboard_failed: "The dashboard could not be loaded.",
    dashboard_bookings: "Bookings",
    dashboard_present: "Present",
    dashboard_absent: "Absent",
    dashboard_waitlist: "Waiting",
    attendance_pending: "Upcoming",
    booking_past: "Past",
    attendance_present: "Present",
    attendance_absent: "Absent",
    attendance_cancelled: "Cancelled",
    attendance_failed: "Attendance could not be updated.",

    dialog_name_label: "Your name",
    dialog_phone_label: "Phone number",
    dialog_email_label: "Email address",
    dialog_email_placeholder: "your@email.com",
    dialog_email_hint: "A confirmation email will be sent to this address.",
    dialog_saved_names: "Saved names",
    dialog_save: "Save your spot",
    dialog_update: "Update booking",
    dialog_cancel_edit: "Cancel edit",
    dialog_no_names: "No saved names yet.",

    msg_enter_name: "Please enter your name.",
    msg_enter_valid_name: "Please enter a name between 2 and 80 characters.",
    msg_phone_invalid: "Please enter a shorter phone number.",
    msg_email_invalid: "Please enter a valid email address.",
    msg_duplicate: "This name is already saved for this slot.",
    msg_full: "No spots left for this slot.",
    msg_day_locked: "Bookings for this day are locked.",
    msg_slot_locked: "Bookings for this training slot are locked.",
    msg_past_slot: "Past sessions can no longer be booked.",
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

    admin_week_bookings: "{count} bookings this week",
    admin_export_week: "Export CSV",
    admin_export_ready: "The weekly attendance file is ready.",
    admin_export_failed: "Could not export this week.",
    admin_required: "Log in with the registered admin account to use this tool.",

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

    contact_eyebrow: "Get in Touch",
    contact_title: "Contact",
    contact_subtitle: "Have a question or want to book a session? Reach out through any of the channels below.",
    contact_phone_title: "Phone",
    contact_instagram_text: "@emotioninmotion.by_silviya",
    contact_location_title: "Location",
    contact_location_text: "Find us on Google Maps",
    contact_hours_title: "Working Hours",
    contact_hours_weekdays: "Mon – Fri",
    contact_hours_saturday: "Saturday",
    contact_hours_sunday: "Sunday",
    contact_hours_closed: "Closed",

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
    previous_week: "Предишна седмица",
    next_week: "Следваща седмица",
    today: "Днес",
    past: "Минало",
    no_slots: "Няма налични тренировки.",
    schedule_setup_required:
      "Графикът не можа да бъде подготвен. Възможно е миграцията на базата данни да не е приложена.",
    schedule_load_failed: "Записванията за тази тренировка не можаха да се заредят.",
    day_locked_badge: "Заключено",
    day_locked_message:
      "Записванията за този ден в момента са заключени. Моля, проверете по-късно.",
    lock_day: "Заключи деня",
    unlock_day: "Отключи деня",
    lock_day_hint: "Натисни, за да заключиш деня",
    unlock_day_hint: "Натисни, за да отключиш деня",
    day_lock_failed:
      "Заключването не беше обновено. Увери се, че си влязъл като админ.",
    slot_locked_badge: "Часът е заключен",
    lock_slot: "Заключи часа",
    unlock_slot: "Отключи часа",
    lock_slot_hint: "Натисни, за да заключиш този час",
    unlock_slot_hint: "Натисни, за да отключиш този час",
    slot_lock_failed:
      "Заключването на часа не беше обновено. Увери се, че си влязъл като админ.",
    spots_left: "Остават {count} места",
    almost_full: "Само {count} места",
    full: "Запълнено",
    join_waitlist_short: "Лист на чакащи",
    booked_total: "{booked} записани / {capacity} общо",
    next_available: "Най-близък час",
    next_available_at: "Най-близък: {date} от {time}",
    no_available_slots: "Няма свободни часове тази седмица",

    my_bookings: "Моите записвания",
    booking_tools: "Управление на записвания",
    my_bookings_hint: "Виж записванията от устройството или ги намери по точния телефон или имейл от записването.",
    my_bookings_loading: "Зареждане на записванията...",
    my_bookings_failed: "Записванията не можаха да се заредят.",
    my_bookings_refreshed: "Записванията са актуални.",
    booking_search_label: "Търси по телефон или имейл",
    booking_search_placeholder: "Телефон или имейл",
    booking_search_loading: "Търсене на записвания...",
    booking_search_invalid: "Въведи валиден телефон или имейл.",
    booking_search_failed: "Записванията не могат да бъдат потърсени в момента.",
    booking_search_empty: "Няма записвания с този телефон или имейл.",
    booking_search_found: "Намерени записвания: {count}.",
    search: "Търси",
    refresh: "Обнови",
    reminders: "Напомняния",
    install_app: "Инсталирай",
    install_hint: "Използвай менюто на браузъра, за да добавиш приложението на началния екран.",
    notifications_enabled: "Напомнянията за тренировка са включени.",
    notifications_denied: "Достъпът до известия не беше разрешен.",
    notifications_unsupported: "Това устройство не поддържа известия.",
    reminder_title: "Напомняне за тренировка",
    reminder_body: "Тренировката ти е на {date} от {time}.",
    waitlist_promoted_title: "Освободи се място!",
    waitlist_promoted_body: "Вече си записан/а за {date} от {time}.",
    day_reopened_title: "Записванията са отворени",
    day_reopened_body: "Записванията за {date} отново са активни.",
    feature_migration_required: "Приложи миграцията booking experience, за да активираш тази функция.",
    recurring_booking: "Повтори записването",
    recurring_weeks: "Седмици",
    recurring_saved: "Запазени са {count} тренировки!",
    join_waitlist: "Включи се в чакащите",
    waitlist_joined: "Добавен/а си в листа на позиция {position}.",
    waitlist_failed: "Листът на чакащи не можа да бъде обновен.",
    waitlist_position: "Чакащ #{position}",
    add_calendar: "Добави в календар",
    reschedule: "Премести",
    reschedule_target: "Избери друга тренировка",
    cancel_booking: "Откажи",
    booking_moved: "Записването беше преместено успешно.",
    booking_cancelled: "Записването беше отказано.",
    manage_booking_failed: "Записването не може да бъде променено. Възможно е двучасовият срок да е изтекъл.",
    msg_booking_cutoff: "Записванията приключват два часа преди тренировката.",

    admin_overview: "Админ преглед",
    weekly_dashboard: "Табло",
    dashboard_loading: "Зареждане на активността за седмицата...",
    dashboard_failed: "Таблото не можа да се зареди.",
    dashboard_bookings: "Записвания",
    dashboard_present: "Присъствали",
    dashboard_absent: "Отсъствали",
    dashboard_waitlist: "Чакащи",
    attendance_pending: "Предстоящо",
    booking_past: "Изминала",
    attendance_present: "Присъства",
    attendance_absent: "Отсъства",
    attendance_cancelled: "Отказано",
    attendance_failed: "Присъствието не можа да бъде обновено.",

    dialog_name_label: "Твоето име",
    dialog_phone_label: "Телефонен номер",
    dialog_email_label: "Имейл адрес",
    dialog_email_placeholder: "your@email.com",
    dialog_email_hint: "На този адрес ще бъде изпратен имейл за потвърждение.",
    dialog_saved_names: "Записани имена",
    dialog_save: "Запази място",
    dialog_update: "Обнови записването",
    dialog_cancel_edit: "Откажи редакцията",
    dialog_no_names: "Все още няма записани имена.",

    msg_enter_name: "Моля, въведи име.",
    msg_enter_valid_name: "Моля, въведи име между 2 и 80 символа.",
    msg_phone_invalid: "Моля, въведи по-кратък телефонен номер.",
    msg_email_invalid: "Моля, въведи валиден имейл адрес.",
    msg_duplicate: "Това име вече е записано за този час.",
    msg_full: "Няма свободни места за този час.",
    msg_day_locked: "Записванията за този ден са заключени.",
    msg_slot_locked: "Записванията за този час са заключени.",
    msg_past_slot: "Не може да се записва за изминала тренировка.",
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

    admin_week_bookings: "{count} записвания тази седмица",
    admin_export_week: "Експорт CSV",
    admin_export_ready: "Файлът с посещенията е готов.",
    admin_export_failed: "Седмицата не можа да бъде експортирана.",
    admin_required: "Влез с регистрирания админ профил, за да използваш този инструмент.",

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

    contact_eyebrow: "Свържете се",
    contact_title: "Контакти",
    contact_subtitle: "Имате въпрос или искате да запазите час? Свържете се с нас по някой от каналите по-долу.",
    contact_phone_title: "Телефон",
    contact_instagram_text: "@emotioninmotion.by_silviya",
    contact_location_title: "Локация",
    contact_location_text: "Намерете ни в Google Maps",
    contact_hours_title: "Работно време",
    contact_hours_weekdays: "Пон – Пет",
    contact_hours_saturday: "Събота",
    contact_hours_sunday: "Неделя",
    contact_hours_closed: "Затворено",

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

/* ------------------------------------------------------------------ */
/* Theme toggle                                                         */
/* ------------------------------------------------------------------ */

const THEME_KEY = "app_theme";

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initThemeToggle() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || getSystemTheme();
  applyTheme(theme);

  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}
