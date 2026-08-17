import { supabase } from "../../js/supabase.js";
import { t, getLocale } from "../../js/i18n.js";
import {
  buildCalendarFile,
  getManagedBookingStatus,
  toDateKey,
} from "./schedule-utils.js";

const ACCESS_KEY = "emotion_booking_access";
const REMINDER_KEY = "emotion_booking_reminders";

let featureContext = null;
let selectedContext = null;
let realtimeChannel = null;

export function initScheduleFeatures(context) {
  featureContext = context;
  if (!context.isOwner) {
    document.getElementById("adminDashboardDialog")?.remove();
  }
  bindFeatureToolbar();
  bindWaitlistAction();
  bindMyBookingsDialog();
  bindAdminDashboard();
  syncInstallButton();
  bindRealtimeNotifications();
  if (readAccessRecords().length) loadMyBookings();
}

export function setSelectedSlotContext(context) {
  selectedContext = context;
}

export function getRecurringWeeks() {
  const enabled = document.getElementById("recurringBooking")?.checked;
  const value = Number(document.getElementById("recurringWeeks")?.value || 1);
  return enabled ? Math.max(2, Math.min(value, 6)) : 1;
}

export function setBookingDialogAvailability(isFull) {
  document.getElementById("saveSpotBtn")?.classList.toggle("hidden", isFull);
  document.getElementById("joinWaitlistBtn")?.classList.toggle("hidden", !isFull);
  document.getElementById("recurringOptions")?.classList.toggle("hidden", isFull);
}

export function rememberBookingAccess(bookedSlots) {
  const records = readAccessRecords();
  (bookedSlots ?? []).forEach((slot) => {
    if (!slot?.id || !slot?.access_token) return;
    const existing = records.find((record) => record.token === slot.access_token);
    if (existing) {
      existing.id = slot.id;
      existing.type = "booking";
    } else {
      records.push({ id: slot.id, token: slot.access_token, type: "booking" });
    }
  });
  writeAccessRecords(records);
}

function rememberWaitlistAccess(item) {
  if (!item?.id || !item?.access_token) return;
  const records = readAccessRecords();
  records.push({ id: item.id, token: item.access_token, type: "waitlist" });
  writeAccessRecords(dedupeAccess(records));
}

function bindFeatureToolbar() {
  document.getElementById("myBookingsBtn")?.addEventListener("click", openMyBookings);
  document.getElementById("notificationsBtn")?.addEventListener("click", enableNotifications);
  document.getElementById("installAppBtn")?.addEventListener("click", installApp);
  document.getElementById("closeMyBookingsBtn")?.addEventListener("click", () => {
    document.getElementById("myBookingsDialog")?.close();
  });
}

function bindWaitlistAction() {
  const button = document.getElementById("joinWaitlistBtn");
  button?.addEventListener("click", async () => {
    const slot = selectedContext?.slot;
    const name = document.getElementById("clientName")?.value.trim();
    const phone = document.getElementById("clientPhone")?.value.trim() || null;
    const email = document.getElementById("clientEmail")?.value.trim() || null;
    const message = document.getElementById("dialogMessage");

    if (!slot?.id || !name) {
      setMessage(message, t("msg_enter_name"));
      return;
    }

    button.disabled = true;
    const { data, error } = await supabase.rpc("join_slot_waitlist", {
      p_slot_id: slot.id,
      p_name: name,
      p_phone: phone,
      p_email: email,
    });
    button.disabled = false;

    if (error) {
      setMessage(
        message,
        isMissingRpc(error) ? t("feature_migration_required") : t("waitlist_failed")
      );
      return;
    }

    const item = data?.[0];
    rememberWaitlistAccess(item);
    setMessage(message, t("waitlist_joined", { position: item?.position ?? 1 }), "success");
    button.classList.add("is-success");
  });
}

function bindMyBookingsDialog() {
  document.getElementById("myBookingsSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchMyBookings();
  });
}

async function openMyBookings() {
  const dialog = document.getElementById("myBookingsDialog");
  if (dialog && !dialog.open) dialog.showModal();
  await loadMyBookings();
}

async function loadMyBookings() {
  const list = document.getElementById("myBookingsList");
  const empty = document.getElementById("myBookingsEmpty");
  const searchMessage = document.getElementById("myBookingsSearchMessage");
  if (!list || !empty) return;

  searchMessage?.classList.add("hidden");
  list.replaceChildren();
  const access = readAccessRecords();

  if (!access.length) {
    empty.textContent = "";
    empty.classList.add("hidden");
    return;
  }

  empty.textContent = t("my_bookings_loading");
  empty.classList.remove("hidden");

  const { data, error } = await supabase.rpc("get_my_schedule", {
    p_access: access,
  });

  if (error) {
    empty.textContent = isMissingRpc(error)
      ? t("feature_migration_required")
      : t("my_bookings_failed");
    return;
  }

  const items = data ?? [];
  await showPromotionNotifications(access, items);
  syncResolvedAccess(items);
  empty.classList.toggle("hidden", items.length > 0);
  if (!items.length) {
    empty.textContent = "";
    empty.classList.add("hidden");
    return;
  }

  items.forEach((item) => list.appendChild(createManagedBooking(item)));
  await showDueReminders(items);
}

async function searchMyBookings() {
  const input = document.getElementById("myBookingsSearchInput");
  const button = document.getElementById("myBookingsSearchBtn");
  const message = document.getElementById("myBookingsSearchMessage");
  const list = document.getElementById("myBookingsList");
  const empty = document.getElementById("myBookingsEmpty");
  const contact = input?.value.trim() || "";
  if (!input || !button || !message || !list || !empty) return;

  if (contact.length < 5) {
    setMessage(message, t("booking_search_invalid"), "error");
    input.focus();
    return;
  }

  setSearchLoading(button, true);
  setMessage(message, t("booking_search_loading"), "info");
  let response;
  try {
    [response] = await Promise.all([
      supabase.rpc("search_my_schedule", { p_contact: contact }),
      new Promise((resolve) => window.setTimeout(resolve, 650)),
    ]);
  } catch (error) {
    response = { data: null, error };
  } finally {
    setSearchLoading(button, false);
  }
  const { data, error } = response;

  if (error) {
    setMessage(
      message,
      t(isMissingRpc(error) ? "feature_migration_required" : "booking_search_failed"),
      "error"
    );
    return;
  }

  const items = data ?? [];
  list.replaceChildren();
  empty.classList.toggle("hidden", items.length > 0);
  empty.textContent = t("booking_search_empty");
  items.forEach((item) => list.appendChild(createManagedBooking(item, true)));
  if (items.length) {
    setMessage(message, t("booking_search_found", { count: items.length }), "success");
  } else {
    message.classList.add("hidden");
  }
}

function setSearchLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
  button.setAttribute("aria-busy", String(isLoading));
}

function createManagedBooking(item, readOnly = false) {
  const card = document.createElement("article");
  card.className = "managed-booking";
  const bookingStatus = getManagedBookingStatus(item);
  card.classList.toggle("is-past", bookingStatus.isPast);

  const date = new Date(`${item.day_key}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat(getLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

  const top = document.createElement("div");
  top.className = "managed-booking-top";
  const title = document.createElement("strong");
  title.textContent = `${dateLabel} · ${item.time}`;
  const status = document.createElement("span");
  status.className = `managed-status ${
    bookingStatus.key === "booking_past" ? "past" : item.item_type
  }`;
  status.textContent = t(bookingStatus.key, {
    position: item.queue_position,
  });
  top.append(title, status);

  const name = document.createElement("p");
  name.textContent = item.name;

  const actions = document.createElement("div");
  actions.className = "managed-booking-actions";

  if (!readOnly && !bookingStatus.isPast && item.item_type === "booking") {
    actions.appendChild(createIconButton("fa-calendar-plus", t("add_calendar"), () => {
      downloadCalendar(item);
    }));

    const targetSelect = buildMoveSelect(item);
    if (targetSelect) {
      actions.append(targetSelect);
      actions.appendChild(createIconButton("fa-arrow-right-arrow-left", t("reschedule"), () => {
        manageItem(item, "move", targetSelect.value);
      }));
    }
  }

  if (!readOnly && !bookingStatus.isPast) {
    actions.appendChild(createIconButton("fa-trash", t("cancel_booking"), () => {
      manageItem(item, "cancel");
    }, "danger"));
  }

  card.append(top, name);
  if (!readOnly && !bookingStatus.isPast) card.append(actions);
  return card;
}

function buildMoveSelect(item) {
  const available = (featureContext?.getState() ?? []).flatMap((day) =>
    day.slots
      .filter((slot) =>
        slot.id &&
        !day.locked &&
        !slot.locked &&
        slot.bookingCount < slot.capacity &&
        `${day.key}T${slot.time}` !== `${item.day_key}T${item.time}` &&
        new Date(`${day.key}T${slot.time}:00`) > new Date(Date.now() + 2 * 60 * 60 * 1000)
      )
      .map((slot) => ({ id: slot.id, label: `${day.dateLabel} · ${slot.time}` }))
  );
  if (!available.length) return null;

  const select = document.createElement("select");
  select.className = "managed-move-select";
  select.setAttribute("aria-label", t("reschedule_target"));
  available.forEach((target) => {
    const option = document.createElement("option");
    option.value = target.id;
    option.textContent = target.label;
    select.appendChild(option);
  });
  return select;
}

async function manageItem(item, action, targetSlotId = null) {
  const { error } = await supabase.rpc("manage_my_schedule_item", {
    p_item_type: item.item_type,
    p_item_id: item.item_id,
    p_access_token: item.access_token,
    p_action: action,
    p_target_slot_id: targetSlotId || null,
  });

  if (error) {
    featureContext?.showStatus(t("manage_booking_failed"), "error");
    return;
  }

  if (action === "cancel") removeAccessToken(item.access_token);
  await featureContext?.refreshSchedule();
  await loadMyBookings();
  featureContext?.showStatus(t(action === "move" ? "booking_moved" : "booking_cancelled"), "success");
}

function downloadCalendar(item) {
  const calendar = buildCalendarFile({
    dayKey: item.day_key,
    time: item.time,
    title: "Emotion in Motion Training",
    durationMinutes: 60,
  });
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `emotion-in-motion-${item.day_key}-${item.time.replace(":", "")}.ics`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

function bindAdminDashboard() {
  document.getElementById("closeAdminDashboardBtn")?.addEventListener("click", () => {
    document.getElementById("adminDashboardDialog")?.close();
  });
}

export async function openAdminDashboard() {
  const dialog = document.getElementById("adminDashboardDialog");
  const grid = document.getElementById("adminDashboardGrid");
  if (!featureContext?.isOwner || !dialog || !grid) return;
  if (!(await featureContext.verifyAdmin())) {
    dialog.close();
    featureContext.showStatus(t("admin_required"), "error");
    return;
  }
  if (!dialog.open) dialog.showModal();
  grid.textContent = t("dashboard_loading");

  const start = featureContext.getWeekStart();
  const { data, error } = await supabase.rpc("get_admin_week_dashboard", {
    p_week_start: toDateKey(start),
  });
  if (error || !data) {
    grid.textContent = isMissingRpc(error)
      ? t("feature_migration_required")
      : t("dashboard_failed");
    return;
  }

  grid.replaceChildren();
  [
    ["fa-calendar-check", data.bookings, t("dashboard_bookings")],
    ["fa-person-circle-check", data.present, t("dashboard_present")],
    ["fa-person-circle-xmark", data.absent, t("dashboard_absent")],
    ["fa-list-ol", data.waitlist, t("dashboard_waitlist")],
  ].forEach(([icon, value, label]) => {
    const item = document.createElement("div");
    item.className = "dashboard-stat";
    item.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><strong>${value}</strong><span></span>`;
    item.querySelector("span").textContent = label;
    grid.appendChild(item);
  });
}

export async function setAttendance(booking, attendance, button) {
  button.disabled = true;
  const { error } = await supabase.rpc("set_booking_attendance", {
    p_booking_id: booking.id,
    p_attendance: attendance,
  });
  button.disabled = false;
  if (error) {
    featureContext?.showStatus(t("attendance_failed"), "error");
    return false;
  }
  booking.attendance = attendance;
  return true;
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    featureContext?.showStatus(t("notifications_unsupported"), "error");
    return;
  }
  const permission = await Notification.requestPermission();
  localStorage.setItem(REMINDER_KEY, permission === "granted" ? "on" : "off");
  featureContext?.showStatus(
    t(permission === "granted" ? "notifications_enabled" : "notifications_denied"),
    permission === "granted" ? "success" : "error"
  );
}

async function showDueReminders(items) {
  if (
    !("Notification" in window) ||
    localStorage.getItem(REMINDER_KEY) !== "on" ||
    Notification.permission !== "granted"
  ) return;
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;

  for (const item of items.filter((entry) => entry.item_type === "booking")) {
    const startsAt = new Date(`${item.day_key}T${item.time}:00`).getTime();
    const hoursAway = (startsAt - Date.now()) / 36e5;
    const reminderId = `emotion-reminder-${item.item_id}`;
    if (hoursAway > 0 && hoursAway <= 24 && !sessionStorage.getItem(reminderId)) {
      await registration.showNotification(t("reminder_title"), {
        body: t("reminder_body", { date: item.day_key, time: item.time }),
        icon: "/assets/img/output-image.png",
        tag: reminderId,
      });
      sessionStorage.setItem(reminderId, "shown");
    }
  }
}

async function showPromotionNotifications(previousAccess, items) {
  const promoted = items.filter((item) => {
    const previous = previousAccess.find((record) => record.token === item.access_token);
    return previous?.type === "waitlist" && item.item_type === "booking";
  });
  if (!promoted.length || !("Notification" in window) || Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  const item = promoted[0];
  await registration.showNotification(t("waitlist_promoted_title"), {
    body: t("waitlist_promoted_body", { date: item.day_key, time: item.time }),
    icon: "/assets/img/output-image.png",
    tag: `waitlist-promoted-${item.access_token}`,
  });
}

function bindRealtimeNotifications() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel("schedule-day-reopened")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "slots" },
      async (payload) => {
        if (
          payload.old?.is_day_locked !== true ||
          payload.new?.is_day_locked !== false ||
          !("Notification" in window) ||
          Notification.permission !== "granted"
        ) return;

        const registration = await navigator.serviceWorker?.ready;
        registration?.showNotification(t("day_reopened_title"), {
          body: t("day_reopened_body", { date: payload.new.day_key }),
          icon: "/assets/img/output-image.png",
          tag: `day-reopened-${payload.new.day_key}`,
        });
      }
    )
    .subscribe();
}

function syncInstallButton() {
  const button = document.getElementById("installAppBtn");
  if (!button) return;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  button.classList.toggle("hidden", standalone || !window.deferredInstallPrompt);
  window.addEventListener("app-install-ready", () => button.classList.remove("hidden"), { once: true });
}

async function installApp() {
  const prompt = window.deferredInstallPrompt;
  if (!prompt) {
    featureContext?.showStatus(t("install_hint"), "success");
    return;
  }
  await prompt.prompt();
  await prompt.userChoice;
  window.deferredInstallPrompt = null;
  document.getElementById("installAppBtn")?.classList.add("hidden");
}

function createIconButton(icon, label, action, tone = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `managed-action ${tone}`.trim();
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span></span>`;
  button.querySelector("span").textContent = label;
  button.addEventListener("click", action);
  return button;
}

function readAccessRecords() {
  try {
    return dedupeAccess(JSON.parse(localStorage.getItem(ACCESS_KEY) || "[]"));
  } catch {
    return [];
  }
}

function writeAccessRecords(records) {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(dedupeAccess(records).slice(-40)));
}

function dedupeAccess(records) {
  const map = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    if (record?.id && record?.token) map.set(record.token, record);
  });
  return [...map.values()];
}

function syncResolvedAccess(items) {
  const known = readAccessRecords();
  items.forEach((item) => {
    const record = known.find((entry) => entry.token === item.access_token);
    if (record) {
      record.id = item.item_id;
      record.type = item.item_type;
    }
  });
  writeAccessRecords(known);
}

function removeAccessToken(token) {
  writeAccessRecords(readAccessRecords().filter((record) => record.token !== token));
}

function setMessage(element, message, type = "error") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("hidden", "error", "success", "info");
  element.classList.add("dialog-message", type);
}

function isMissingRpc(error) {
  return error?.code === "PGRST202" || error?.code === "42883";
}
