import { supabase } from "../../js/supabase.js";
import { t, getLocale, applyTranslations } from "../../js/i18n.js";
import { config } from "../../js/config.js";
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import {
  buildTicketPayload,
  getBookingReference,
} from "../../js/booking-access.js";
import {
  CAPACITY,
  DAY_SLOT_MAP,
  addDays,
  applySlotRealtimeUpdate,
  buildGoogleCalendarUrl,
  getStableDayKey,
  getStartOfWeek,
  getAvailabilityLevel,
  findNextAvailableSlot,
  isDateInPast,
  isSlotInPast,
  isToday,
  mapBookingError,
  toDateKey,
} from "./schedule-utils.js";
import {
  getRecurringWeeks,
  initScheduleFeatures,
  openAdminDashboard,
  rememberBookingAccess,
  setAttendance,
  setBookingDialogAvailability,
  setSelectedSlotContext,
} from "./schedule-features.js";

let editingBookingId = null;
let pendingRemoveBooking = null;

let state = [];
let selectedSlot = null;
let isOwner = false;
let visibleWeekStart = null;
let weekChangeInProgress = false;
let activeTicket = null;
let scannedBooking = null;

export async function init() {
  try {
    if (config.emailjsPublicKey) {
      emailjs.init(config.emailjsPublicKey);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminAccess, error: adminError } = await supabase.rpc(
      "is_app_admin"
    );
    isOwner = Boolean(user && !adminError && adminAccess);
    if (adminError) {
      console.warn("Admin access could not be verified:", adminError.message);
    }
    visibleWeekStart ??= getStartOfWeek(new Date());

    setScheduleLoading(true);
    state = await loadSchedule();
    renderWeekNav();
    renderWeek({ animate: true });
    renderAdminActions();
    bindNextAvailableAction();
    bindDialogActions();
    resetBookingForm();
    initScheduleFeatures({
      isOwner,
      getState: () => state,
      getWeekStart: () => visibleWeekStart ?? getStartOfWeek(new Date()),
      refreshSchedule: () => refreshScheduleView(),
      showStatus: showScheduleStatus,
      verifyAdmin: isCurrentUserAdmin,
      applySlotChange: applyRealtimeSlotChange,
    });
    setScheduleLoading(false);
    await handleScannedTicket();
  } catch (err) {
    setScheduleLoading(false);
    console.error("Schedule init error:", err);
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `<div class="page"><h1>Error loading schedule</h1><p>${err.message}</p></div>`;
    }
  }
}

async function loadSchedule() {
  const weekDates = getVisibleWeekDates();
  const weekDayKeys = weekDates.map(toDateKey);
  await ensureWeekSlots(weekDates);

  let { data: slotsData, error } = await supabase
    .from("slots")
    .select(
      "id, day_key, time, capacity, booking_count, is_day_locked, is_slot_locked"
    )
    .in("day_key", weekDayKeys);

  if (
    error &&
    (error.message?.includes("is_day_locked") ||
      error.message?.includes("is_slot_locked"))
  ) {
    console.warn(
      "Missing schedule lock columns. Run the latest Supabase migration."
    );

    const fallback = await supabase
      .from("slots")
      .select("id, day_key, time, capacity, booking_count")
      .in("day_key", weekDayKeys);

    slotsData = fallback.data?.map((slot) => ({
      ...slot,
      is_day_locked: false,
      is_slot_locked: false,
    }));
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to load schedule:", error.message);
    return buildEmptyWeek(weekDates);
  }

  const legacyBookingCounts = await loadLegacyBookingCounts(slotsData);

  return weekDates.map((date) => {
    const dayKey = toDateKey(date);
    const stableDayKey = getStableDayKey(date);
    const times = DAY_SLOT_MAP[stableDayKey] || [];

    return {
      key: dayKey,
      stableDayKey,
      dayName: formatDayName(date),
      dateLabel: formatDateLabel(date),
      locked: Boolean(
        slotsData?.some((s) => s.day_key === dayKey && s.is_day_locked)
      ),
      slots: times.map((time) => {
        const dbSlot = slotsData?.find(
          (s) => s.day_key === dayKey && s.time === time
        );
        return {
          id: dbSlot?.id ?? null,
          time,
          capacity: CAPACITY,
          locked: Boolean(dbSlot?.is_slot_locked),
          bookingCount: legacyBookingCounts
            ? legacyBookingCounts.get(dbSlot?.id) ?? 0
            : dbSlot?.booking_count ?? 0,
          bookedUsers: [],
        };
      }),
    };
  });
}

async function loadLegacyBookingCounts(slotsData) {
  const slotIds = (slotsData ?? []).map((slot) => slot.id).filter(Boolean);
  if (!slotIds.length) return new Map();

  const { data, error } = await supabase
    .from("bookings")
    .select("slot_id")
    .in("slot_id", slotIds);

  // The hardened schema intentionally blocks direct booking reads. Its trigger-
  // maintained slots.booking_count is the source of truth in that case.
  if (error) return null;

  return (data ?? []).reduce((counts, booking) => {
    counts.set(booking.slot_id, (counts.get(booking.slot_id) ?? 0) + 1);
    return counts;
  }, new Map());
}

async function ensureWeekSlots(weekDates) {
  const weekStart = toDateKey(weekDates[0]);
  const { error } = await supabase.rpc("ensure_week_slots", {
    p_week_start: weekStart,
  });

  if (!error) return;

  if (error.message?.includes("WEEK_OUT_OF_RANGE")) return;

  // Keeps local development usable until the migration has been applied.
  if (error.code === "PGRST202" || error.code === "42883") {
    const slots = weekDates.flatMap((date) => {
      const dayKey = getStableDayKey(date);
      return (DAY_SLOT_MAP[dayKey] || []).map((time) => ({
        day_key: toDateKey(date),
        day_name: dayKey,
        time,
        capacity: CAPACITY,
        is_day_locked: false,
      }));
    });

    const { data: existingSlots, error: readError } = await supabase
      .from("slots")
      .select("day_key, time")
      .in("day_key", weekDates.map(toDateKey));

    if (readError) {
      console.warn("Could not check existing schedule slots:", readError.message);
      return;
    }

    const existingKeys = new Set(
      (existingSlots ?? []).map((slot) => `${slot.day_key}:${slot.time}`)
    );
    const missingSlots = slots.filter(
      (slot) => !existingKeys.has(`${slot.day_key}:${slot.time}`)
    );

    if (!missingSlots.length) return;

    const { error: fallbackError } = await supabase
      .from("slots")
      .upsert(missingSlots, {
        onConflict: "day_key,time",
        ignoreDuplicates: true,
      });

    if (!fallbackError) return;

    console.warn(
      "Missing schedule slots could not be created. Apply the Supabase migration.",
      fallbackError.message
    );
    return;
  }

  console.error("Could not create this week's schedule:", error);
}

function buildEmptyWeek(weekDates) {
  return weekDates.map((date) => {
    const stableDayKey = getStableDayKey(date);

    return {
      key: toDateKey(date),
      stableDayKey,
      dayName: formatDayName(date),
      dateLabel: formatDateLabel(date),
      locked: false,
      slots: (DAY_SLOT_MAP[stableDayKey] || []).map((time) => ({
        id: null,
        time,
        capacity: CAPACITY,
        locked: false,
        bookingCount: 0,
        bookedUsers: [],
      })),
    };
  });
}

function getVisibleWeekDates() {
  const monday = new Date(visibleWeekStart ?? getStartOfWeek(new Date()));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}


function renderWeekNav() {
  const controls = document.getElementById("weekNavControls");
  if (!controls) return;

  controls.replaceChildren();

  const previousBtn = createWeekNavButton("previous_week", "fa-chevron-left");
  const nextBtn = createWeekNavButton("next_week", "fa-chevron-right");

  previousBtn.addEventListener("click", () => changeWeek(-1));
  nextBtn.addEventListener("click", () => changeWeek(1));

  const range = document.createElement("p");
  range.className = "week-range-label";
  range.textContent = formatWeekRange();

  controls.append(previousBtn, range, nextBtn);
}

function renderAdminActions() {
  const actions = document.getElementById("adminScheduleActions");
  if (!actions) return;

  actions.replaceChildren();
  actions.classList.toggle("hidden", !isOwner);
  if (!isOwner) return;

  const totalBookings = state.reduce(
    (total, day) =>
      total + day.slots.reduce((dayTotal, slot) => dayTotal + slot.bookingCount, 0),
    0
  );

  const summary = document.createElement("span");
  summary.className = "admin-week-summary";
  summary.textContent = t("admin_week_bookings", { count: totalBookings });

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "admin-toolbar-btn admin-export-btn";
  exportButton.innerHTML = '<i class="fa-solid fa-file-export" aria-hidden="true"></i>';

  const exportLabel = document.createElement("span");
  exportLabel.textContent = t("admin_export_week");
  exportButton.appendChild(exportLabel);
  exportButton.addEventListener("click", () => exportWeekCsv(exportButton));

  const dashboardButton = document.createElement("button");
  dashboardButton.type = "button";
  dashboardButton.className = "admin-toolbar-btn admin-dashboard-btn";
  dashboardButton.innerHTML = '<i class="fa-solid fa-table-cells-large" aria-hidden="true"></i>';
  const dashboardLabel = document.createElement("span");
  dashboardLabel.textContent = t("weekly_dashboard");
  dashboardButton.appendChild(dashboardLabel);
  dashboardButton.addEventListener("click", openAdminDashboard);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "admin-action-buttons";
  buttonGroup.append(dashboardButton, exportButton);

  actions.append(summary, buttonGroup);
}

function createWeekNavButton(labelKey, iconClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "week-nav-btn";
  button.setAttribute("aria-label", t(labelKey));
  button.title = t(labelKey);
  button.innerHTML = `<i class="fa-solid ${iconClass}" aria-hidden="true"></i><span class="sr-only">${t(
    labelKey
  )}</span>`;

  return button;
}

async function changeWeek(direction) {
  if (weekChangeInProgress) return;
  weekChangeInProgress = true;

  const weekGrid = document.getElementById("weekGrid");
  const exitClass =
    direction > 0 ? "week-grid-exit-next" : "week-grid-exit-previous";

  document.querySelectorAll(".week-nav-btn").forEach((button) => {
    button.disabled = true;
  });

  if (!canUseViewTransitions() && !prefersReducedMotion() && weekGrid) {
    weekGrid.classList.add(exitClass);
    await wait(150);
  }

  visibleWeekStart = addDays(
    visibleWeekStart ?? getStartOfWeek(new Date()),
    direction * 7
  );

  try {
    await refreshScheduleView(direction);
  } finally {
    weekChangeInProgress = false;
  }
}

async function refreshScheduleView(direction = 0) {
  setScheduleLoading(true);
  clearScheduleStatus();
  const dialog = document.getElementById("slotDialog");
  if (dialog?.open) {
    dialog.close();
  }

  selectedSlot = null;
  resetBookingForm();

  try {
    state = await loadSchedule();
    const renderUpdatedWeek = () => {
      renderWeekNav();
      renderWeek({ animate: !canUseViewTransitions(), direction });
      renderAdminActions();
    };

    if (canUseViewTransitions()) {
      await document.startViewTransition(renderUpdatedWeek).finished;
    } else {
      renderUpdatedWeek();
    }
    applyTranslations(document.getElementById("app"));
  } finally {
    setScheduleLoading(false);
  }
}

function formatWeekRange() {
  const start = visibleWeekStart ?? getStartOfWeek(new Date());
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const locale = getLocale();

  const startOptions = {
    day: "numeric",
    month: "short",
    ...(!sameYear ? { year: "numeric" } : {}),
  };

  const endOptions = {
    day: "numeric",
    month: "short",
    ...(!sameYear ? { year: "numeric" } : {}),
  };

  const startLabel = new Intl.DateTimeFormat(locale, startOptions).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, endOptions).format(end);

  return `${startLabel} - ${endLabel}`;
}

function renderWeek({ animate = false, direction = 0 } = {}) {
  const weekGrid = document.getElementById("weekGrid");
  if (!weekGrid) return;

  weekGrid.classList.remove("week-grid-exit-next", "week-grid-exit-previous");
  weekGrid.replaceChildren();

  state.forEach((day, dayIndex) => {
    if (!day.slots.length) return;

    const dayCard = document.createElement("article");
    dayCard.className = "day-card";
    dayCard.dataset.dayKey = day.key;
    if (animate && !prefersReducedMotion()) {
      dayCard.classList.add(
        "day-card-enter",
        direction < 0 ? "day-card-enter-previous" : "day-card-enter-next"
      );
      dayCard.style.setProperty(
        "--card-enter-delay",
        `${Math.min(dayIndex * 45, 270)}ms`
      );
    }
    const dayIsToday = isToday(day.key);
    const dayIsPast = isDateInPast(day.key);
    dayCard.classList.toggle("day-card-today", dayIsToday);
    dayCard.classList.toggle("day-card-past", dayIsPast);

    const header = document.createElement("div");
    header.className = "day-card-header";

    const dayName = document.createElement("div");
    dayName.className = "day-name";
    dayName.textContent = day.dayName;

    const dayDate = document.createElement("div");
    dayDate.className = "day-date";
    dayDate.textContent = day.dateLabel;

    if (dayIsToday) {
      const todayBadge = document.createElement("span");
      todayBadge.className = "today-badge";
      todayBadge.textContent = t("today");
      dayName.appendChild(todayBadge);
    }

    const dayMeta = document.createElement("div");
    dayMeta.className = "day-meta";
    dayMeta.append(dayName, dayDate);

    header.appendChild(dayMeta);

    if (isOwner) {
      header.appendChild(createDayLockButton(day));
    }

    const slotList = document.createElement("div");
    slotList.className = "slot-list";

    if (day.locked) {
      const lockedText = document.createElement("p");
      lockedText.className = "day-locked-message";
      lockedText.textContent = t("day_locked_message");
      slotList.appendChild(lockedText);
    }

    if (!day.slots.length) {
      const emptyText = document.createElement("p");
      emptyText.className = "empty-state";
      emptyText.textContent = t("no_slots");
      slotList.appendChild(emptyText);
    } else {
      day.slots.forEach((slot) => {
        const spotsLeft = slot.capacity - slot.bookingCount;
        const availability = getAvailabilityLevel(spotsLeft);
        const slotIsPast = isSlotInPast(day.key, slot.time);
        const slotIsLocked = day.locked || slot.locked;

        const slotRow = document.createElement("div");
        slotRow.className = "slot-row";

        const slotBtn = document.createElement("button");
        slotBtn.className = "slot-btn";
        slotBtn.classList.add(`slot-${availability}`);
        if (slotIsLocked) {
          slotBtn.classList.add("slot-btn-locked");
        }
        slotBtn.type = "button";
        slotBtn.disabled = slotIsLocked || (slotIsPast && !isOwner);

        const top = document.createElement("div");
        top.className = "slot-top";

        const time = document.createElement("span");
        time.className = "slot-time";
        time.textContent = slot.time;

        const badge = document.createElement("span");
        badge.className = "slot-badge";
        badge.textContent = slotIsPast
          ? t("past")
          : day.locked
          ? t("day_locked_badge")
          : slot.locked
          ? t("slot_locked_badge")
          : spotsLeft > 0
          ? availability === "almost-full"
            ? t("almost_full", { count: spotsLeft })
            : t("spots_left", { count: spotsLeft })
          : t("join_waitlist_short");

        top.append(time, badge);

        const meta = document.createElement("div");
        meta.className = "slot-meta";
        meta.textContent = t("booked_total", {
          booked: slot.bookingCount,
          capacity: slot.capacity,
        });

        slotBtn.append(top, meta);
        if (!slotIsLocked && (!slotIsPast || isOwner)) {
          slotBtn.addEventListener("click", () => openSlot(day.key, slot.time));
        }

        slotRow.appendChild(slotBtn);
        if (isOwner) {
          slotRow.classList.add("slot-row-admin");
          slotRow.appendChild(createSlotLockButton(day, slot));
        }
        slotList.appendChild(slotRow);
      });
    }

    dayCard.append(header, slotList);
    weekGrid.appendChild(dayCard);
  });

  updateNextAvailableAction();
}

function applyRealtimeSlotChange(record) {
  if (!applySlotRealtimeUpdate(state, record)) return false;

  renderWeek();
  renderAdminActions();

  const selectedDay = selectedSlot
    ? state.find((day) => day.key === selectedSlot.dayKey)
    : null;
  const selected = selectedDay?.slots.find(
    (slot) => slot.time === selectedSlot?.time
  );

  if (selected?.id === record.id) {
    setSelectedSlotContext({ day: selectedDay, slot: selected });
    const spots = document.getElementById("dialogSpots");
    if (spots) {
      spots.textContent = `${selected.capacity - selected.bookingCount} / ${selected.capacity}`;
    }
    setBookingDialogAvailability(
      selected.bookingCount >= selected.capacity && !isOwner
    );
  }

  return true;
}

function bindNextAvailableAction() {
  const button = document.getElementById("nextAvailableBtn");
  if (!button) return;

  button.addEventListener("click", async () => {
    const next = findNextAvailableSlot(state);
    if (!next) return;

    button.classList.add("is-opening");
    try {
      await openSlot(next.day.key, next.slot.time);
    } finally {
      button.classList.remove("is-opening");
    }
  });

  updateNextAvailableAction();
}

function updateNextAvailableAction() {
  const button = document.getElementById("nextAvailableBtn");
  if (!button) return;

  const label = button.querySelector("span");
  const next = findNextAvailableSlot(state);
  button.disabled = !next;
  button.classList.toggle("is-empty", !next);

  if (label) {
    label.removeAttribute("data-i18n");
    label.textContent = next
      ? t("next_available_at", {
          date: next.day.dateLabel,
          time: next.slot.time,
        })
      : t("no_available_slots");
  }
}

function createSlotLockButton(day, slot) {
  const label = slot.locked ? t("unlock_slot") : t("lock_slot");
  const hint = slot.locked ? t("unlock_slot_hint") : t("lock_slot_hint");
  const button = document.createElement("button");

  button.type = "button";
  button.className = slot.locked
    ? "slot-lock-btn slot-lock-btn-unlock"
    : "slot-lock-btn";
  button.setAttribute("aria-label", `${label}: ${slot.time}`);
  button.setAttribute("aria-pressed", String(slot.locked));
  button.title = `${hint}: ${slot.time}`;
  button.innerHTML = slot.locked
    ? '<i class="fa-solid fa-lock" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i>';
  button.addEventListener("click", () => toggleSlotLock(day.key, slot.id, button));

  return button;
}

async function toggleSlotLock(dayKey, slotId, button) {
  const day = state.find((item) => item.key === dayKey);
  const slot = day?.slots.find((item) => item.id === slotId);
  if (!isOwner || !day || !slot?.id) return;

  button.disabled = true;
  button.classList.add("is-changing");
  const nextLocked = !slot.locked;

  try {
    const { error } = await supabase.rpc("set_slot_lock", {
      p_slot_id: slot.id,
      p_locked: nextLocked,
    });
    if (error) throw error;

    slot.locked = nextLocked;
    renderWeek();
  } catch (error) {
    console.error("Failed to update slot lock:", error);
    button.disabled = false;
    button.classList.remove("is-changing");
    renderDayLockFeedback(day, t("slot_lock_failed"), "error");
  }
}

function createDayLockButton(day) {
  const label = day.locked ? t("unlock_day") : t("lock_day");
  const hint = day.locked ? t("unlock_day_hint") : t("lock_day_hint");

  const button = document.createElement("button");
  button.type = "button";
  button.className = day.locked
    ? "day-lock-btn day-lock-btn-unlock"
    : "day-lock-btn";
  button.setAttribute("aria-label", label);
  button.title = hint;
  button.innerHTML = day.locked
    ? '<i class="fa-solid fa-lock" aria-hidden="true"></i><span class="sr-only"></span>'
    : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i><span class="sr-only"></span>';
  button.querySelector(".sr-only").textContent = label;
  button.addEventListener("click", () => toggleDayLock(day.key, button));

  return button;
}

async function toggleDayLock(dayKey, button) {
  const day = state.find((item) => item.key === dayKey);
  if (!isOwner || !day) return;

  button.disabled = true;
  button.classList.add("is-changing");
  const nextLocked = !day.locked;

  try {
    const { error } = await supabase.rpc("set_day_lock", {
      p_day_key: day.key,
      p_locked: nextLocked,
    });

    if (error) throw error;

    day.locked = nextLocked;
    renderWeek();
    showDayLockConfirmation(day.key, nextLocked);
  } catch (error) {
    console.error("Failed to update day lock:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    button.disabled = false;
    renderDayLockFeedback(day, t("day_lock_failed"), "error");
  }
}

function renderDayLockFeedback(day, message, type = "error") {
  const weekGrid = document.getElementById("weekGrid");
  const dayCard = weekGrid?.querySelector(`[data-day-key="${day.key}"]`);
  if (!dayCard) return;

  const existing = dayCard.querySelector(".day-lock-feedback");
  existing?.remove();

  const feedback = document.createElement("p");
  feedback.className = `day-lock-feedback ${type}`;
  feedback.textContent = message;

  const header = dayCard.querySelector(".day-card-header");
  header?.insertAdjacentElement("afterend", feedback);
}

function showDayLockConfirmation(dayKey, locked) {
  const dayCard = document.querySelector(`[data-day-key="${dayKey}"]`);
  if (!dayCard || prefersReducedMotion()) return;

  dayCard.classList.add(
    "day-card-lock-confirm",
    locked ? "is-locked" : "is-unlocked"
  );
}

async function openSlot(dayKey, time) {
  const spinner = document.getElementById("slotSpinner");
  if (spinner) spinner.classList.remove("hidden");

  const day = state.find((item) => item.key === dayKey);
  const slot = day?.slots.find((item) => item.time === time);

  if (!day || !slot || !slot.id) {
    if (spinner) spinner.classList.add("hidden");
    return;
  }

  const { data: bookings, error } = await fetchSlotBookings(slot.id);

  if (spinner) spinner.classList.add("hidden");

  if (error) {
    console.error("Failed to load bookings:", error.message);
    showScheduleStatus(t("schedule_load_failed"), "error");
    return;
  }

  slot.bookedUsers = bookings ?? [];
  slot.bookingCount = slot.bookedUsers.length;
  renderWeek();
  renderAdminActions();
  selectedSlot = { dayKey, time };
  setSelectedSlotContext({ day, slot });

  const dialogDay = document.getElementById("dialogDay");
  const dialogTime = document.getElementById("dialogTime");
  const dialogSpots = document.getElementById("dialogSpots");
  const clientName = document.getElementById("clientName");
  const clientPhone = document.getElementById("clientPhone");
  const clientEmail = document.getElementById("clientEmail");
  const dialog = document.getElementById("slotDialog");

  if (dialogDay) dialogDay.textContent = `${day.dayName} \u2022 ${day.dateLabel}`;
  if (dialogTime) dialogTime.textContent = slot.time;
  if (dialogSpots) {
    const spotsLeft = slot.capacity - slot.bookingCount;
    dialogSpots.textContent = `${spotsLeft} / ${slot.capacity}`;
  }

  if (clientName) clientName.value = "";
  if (clientPhone) clientPhone.value = "";
  if (clientEmail) clientEmail.value = "";

  resetBookingForm();
  setBookingDialogAvailability(slot.bookingCount >= slot.capacity && !isOwner);
  renderSavedNames(slot.bookedUsers);
  clearDialogMessage();

  if (dialog && !dialog.open) dialog.showModal();
}

function bindDialogActions() {
  const saveBtn = document.getElementById("saveSpotBtn");
  const clientName = document.getElementById("clientName");
  const dialog = document.getElementById("slotDialog");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const removeConfirmDialog = document.getElementById("removeConfirmDialog");
  const cancelRemoveBtn = document.getElementById("cancelRemoveBtn");
  const confirmRemoveBtn = document.getElementById("confirmRemoveBtn");
  const closeTicketBtn = document.getElementById("closeBookingTicketBtn");
  const ticketDialog = document.getElementById("bookingTicketDialog");
  const ticketCalendarBtn = document.getElementById("ticketCalendarBtn");
  const ticketShareBtn = document.getElementById("ticketShareBtn");
  const ticketCheckinDialog = document.getElementById("ticketCheckinDialog");
  const closeTicketCheckinBtn = document.getElementById("closeTicketCheckinBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveSpot);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetBookingForm);
  }

  if (cancelRemoveBtn) {
    cancelRemoveBtn.addEventListener("click", closeRemoveConfirmDialog);
  }

  if (confirmRemoveBtn) {
    confirmRemoveBtn.addEventListener("click", confirmRemoveBooking);
  }

  closeTicketBtn?.addEventListener("click", closeBookingTicket);
  ticketCalendarBtn?.addEventListener("click", downloadBookingTicketCalendar);
  ticketShareBtn?.addEventListener("click", shareBookingTicket);
  ticketDialog?.addEventListener("close", () => {
    activeTicket = null;
  });
  closeTicketCheckinBtn?.addEventListener("click", () => {
    ticketCheckinDialog?.close();
  });
  ticketCheckinDialog?.addEventListener("close", clearScannedTicketUrl);
  document.querySelectorAll(".ticket-checkin-btn").forEach((button) => {
    button.addEventListener("click", () => {
      updateScannedTicketAttendance(button.dataset.attendance);
    });
  });

  if (clientName) {
    clientName.addEventListener("input", clearDialogMessage);
    clientName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveSpot();
      }
    });
  }

  if (dialog) {
    dialog.addEventListener("close", () => {
      clearDialogMessage();
      selectedSlot = null;
      setSelectedSlotContext(null);
      resetBookingForm();
    });
  }

  if (removeConfirmDialog) {
    removeConfirmDialog.addEventListener("close", () => {
      pendingRemoveBooking = null;
    });
  }
}

async function saveSpot() {
  if (!selectedSlot) return;

  const nameInput = document.getElementById("clientName");
  const phoneInput = document.getElementById("clientPhone");
  const emailInput = document.getElementById("clientEmail");
  const saveBtn = document.getElementById("saveSpotBtn");

  if (!nameInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput?.value.trim() || null;
  const email = emailInput?.value.trim() || null;
  const recurringWeeks = getRecurringWeeks();

  if (!name) {
    showDialogMessage(t("msg_enter_name"));
    return;
  }

  if (name.length < 2 || name.length > 80) {
    showDialogMessage(t("msg_enter_valid_name"));
    return;
  }

  if (phone && phone.length > 30) {
    showDialogMessage(t("msg_phone_invalid"));
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showDialogMessage(t("msg_email_invalid"));
    return;
  }

  const day = state.find((item) => item.key === selectedSlot.dayKey);
  const slot = day?.slots.find((item) => item.time === selectedSlot.time);

  if (!day || !slot || !slot.id) return;

  const lockState = await getSlotLockState(slot.id);
  if ((day.locked || lockState.dayLocked) && !editingBookingId) {
    day.locked = true;
    renderWeek();
    showDialogMessage(t("msg_day_locked"));
    return;
  }

  if ((slot.locked || lockState.slotLocked) && !editingBookingId) {
    slot.locked = true;
    renderWeek();
    showDialogMessage(t("msg_slot_locked"));
    return;
  }

  const duplicateBooking = slot.bookedUsers.find((b) => {
    const sameName = (b.name || "").toLowerCase() === name.toLowerCase();
    const sameRecord = b.id === editingBookingId;
    return sameName && !sameRecord;
  });

  if (duplicateBooking) {
    showDialogMessage(t("msg_duplicate"));
    return;
  }

  if (!editingBookingId && slot.bookingCount >= slot.capacity && !isOwner) {
    showDialogMessage(t("msg_full"));
    return;
  }

  if (saveBtn) saveBtn.disabled = true;

  let newBookingId = null;

  try {
    if (editingBookingId) {
      const { error } = await supabase
        .from("bookings")
        .update({ name, phone })
        .eq("id", editingBookingId);

      if (error) {
        console.error(error);
        showDialogMessage(t("msg_update_failed"));
        return;
      }

      slot.bookedUsers = slot.bookedUsers.map((booking) =>
        booking.id === editingBookingId
          ? {
              ...booking,
              name,
              phone: isOwner ? phone : null,
            }
          : booking
      );

      showDialogMessage(t("msg_updated"), "success");
    } else {
      const { booking, error } = await createBooking(
        slot.id,
        name,
        phone,
        email,
        recurringWeeks
      );

      if (error) {
        console.error(error);
        showDialogMessage(t(mapBookingError(error)));
        return;
      }

      slot.bookedUsers.push({
        id: booking.id,
        name: booking.name,
        phone: isOwner ? booking.phone : null,
      });
      newBookingId = booking.id;
      rememberBookingAccess(booking.booked_slots ?? [booking]);

      slot.bookingCount = booking.booking_count ?? slot.bookedUsers.length;
      const createdCount = booking.booked_slots?.length ?? 1;
      activeTicket = {
        id: booking.id,
        name: booking.name ?? name,
        day_key: day.key,
        dateLabel: day.dateLabel,
        dayName: day.dayName,
        time: slot.time,
        createdCount,
      };
      showDialogMessage(
        createdCount > 1
          ? t("recurring_saved", { count: createdCount })
          : t("msg_saved"),
        "success"
      );

      if (email) {
        const day = state.find((item) => item.key === selectedSlot.dayKey);
        sendConfirmationEmail(email, name, day?.dayName ?? "", day?.dateLabel ?? "", slot.time);
      }
    }

    const dialogSpots = document.getElementById("dialogSpots");
    if (dialogSpots) {
      const spotsLeft = slot.capacity - slot.bookingCount;
      dialogSpots.textContent = `${spotsLeft} / ${slot.capacity}`;
    }

    renderSavedNames(slot.bookedUsers, newBookingId);
    renderWeek();
    renderAdminActions();
    resetBookingForm();
    if (newBookingId) {
      playBookingSuccess(saveBtn, dialogSpots);
      window.setTimeout(showBookingTicket, 520);
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function showBookingTicket() {
  if (!activeTicket) return;

  const sourceDialog = document.getElementById("slotDialog");
  const ticketDialog = document.getElementById("bookingTicketDialog");
  const dateTime = document.getElementById("ticketDateTime");
  const name = document.getElementById("ticketName");
  const reference = document.getElementById("ticketReference");
  const recurring = document.getElementById("ticketRecurring");
  const canvas = document.getElementById("ticketQrCanvas");
  const shareStatus = document.getElementById("ticketShareStatus");
  if (!ticketDialog || !dateTime || !name || !reference || !canvas) return;

  dateTime.textContent = `${activeTicket.dayName} · ${activeTicket.dateLabel} · ${activeTicket.time}`;
  name.textContent = activeTicket.name;
  reference.textContent = getBookingReference(activeTicket.id);
  recurring?.classList.toggle("hidden", activeTicket.createdCount <= 1);
  if (recurring && activeTicket.createdCount > 1) {
    recurring.textContent = t("ticket_recurring", {
      count: activeTicket.createdCount,
    });
  }
  shareStatus?.classList.add("hidden");

  try {
    await QRCode.toCanvas(
      canvas,
      buildTicketPayload(activeTicket, window.location.origin),
      {
      width: 148,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#060810", light: "#ffffff" },
      }
    );
  } catch (error) {
    console.warn("Booking QR code could not be rendered:", error.message);
  }

  if (sourceDialog?.open) sourceDialog.close();
  if (!ticketDialog.open) ticketDialog.showModal();
}

function closeBookingTicket() {
  const dialog = document.getElementById("bookingTicketDialog");
  if (dialog?.open) dialog.close();
  activeTicket = null;
}

function downloadBookingTicketCalendar() {
  if (!activeTicket) return;

  const calendarUrl = buildGoogleCalendarUrl({
    dayKey: activeTicket.day_key,
    time: activeTicket.time,
    title: "Emotion in Motion Training",
  });
  window.open(calendarUrl, "_blank", "noopener,noreferrer");
}

async function shareBookingTicket() {
  if (!activeTicket) return;

  const status = document.getElementById("ticketShareStatus");
  const text = t("ticket_share_text", {
    date: activeTicket.dateLabel,
    time: activeTicket.time,
    reference: getBookingReference(activeTicket.id),
  });

  try {
    if (navigator.share) {
      await navigator.share({
        title: t("ticket_title"),
        text,
        url: `${window.location.origin}/#schedule`,
      });
      return;
    }

    await navigator.clipboard.writeText(
      `${text}\n${window.location.origin}/#schedule`
    );
    if (status) {
      status.textContent = t("ticket_copied");
      status.classList.remove("hidden");
    }
  } catch (error) {
    if (error.name !== "AbortError" && status) {
      status.textContent = t("ticket_share_failed");
      status.classList.remove("hidden");
    }
  }
}

async function handleScannedTicket() {
  const bookingId = new URL(window.location.href).searchParams.get("ticket");
  if (!bookingId) return;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    showScheduleStatus(t("ticket_checkin_invalid"), "error");
    clearScannedTicketUrl();
    return;
  }

  if (!isOwner) {
    showScheduleStatus(t("ticket_checkin_admin"), "error");
    return;
  }

  const dialog = document.getElementById("ticketCheckinDialog");
  const loading = document.getElementById("ticketCheckinLoading");
  const details = document.getElementById("ticketCheckinDetails");
  const actions = document.getElementById("ticketCheckinActions");
  if (!dialog || !loading || !details || !actions) return;

  loading.textContent = t("ticket_checkin_loading");
  loading.classList.remove("hidden");
  details.classList.add("hidden");
  actions.classList.add("hidden");
  if (!dialog.open) dialog.showModal();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, name, attendance, slot_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    loading.textContent = t("ticket_checkin_invalid");
    return;
  }

  const { data: slot, error: slotError } = await supabase
    .from("slots")
    .select("day_key, time")
    .eq("id", booking.slot_id)
    .maybeSingle();

  if (slotError || !slot) {
    loading.textContent = t("ticket_checkin_invalid");
    return;
  }

  scannedBooking = { ...booking, ...slot };
  const date = new Date(`${slot.day_key}T${slot.time}:00`);
  document.getElementById("ticketCheckinName").textContent = booking.name;
  document.getElementById("ticketCheckinDate").textContent =
    new Intl.DateTimeFormat(getLocale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  renderScannedTicketAttendance();
  loading.classList.add("hidden");
  details.classList.remove("hidden");
  actions.classList.remove("hidden");
}

function renderScannedTicketAttendance() {
  const status = document.getElementById("ticketCheckinStatus");
  if (!status || !scannedBooking) return;
  const statusKey = `attendance_${scannedBooking.attendance || "pending"}`;
  status.textContent = t(statusKey);
  status.className = `managed-status ${scannedBooking.attendance || "booking"}`;
}

async function updateScannedTicketAttendance(attendance) {
  if (!scannedBooking || !["present", "absent"].includes(attendance)) return;

  const buttons = document.querySelectorAll(".ticket-checkin-btn");
  buttons.forEach((button) => {
    button.disabled = true;
  });
  const { error } = await supabase.rpc("set_booking_attendance", {
    p_booking_id: scannedBooking.id,
    p_attendance: attendance,
  });
  buttons.forEach((button) => {
    button.disabled = false;
  });

  const message = document.getElementById("ticketCheckinMessage");
  if (error) {
    if (message) {
      message.textContent = t("attendance_failed");
      message.classList.remove("hidden");
    }
    return;
  }

  scannedBooking.attendance = attendance;
  renderScannedTicketAttendance();
  if (message) {
    message.textContent = t("ticket_checkin_saved");
    message.classList.remove("hidden");
  }
}

function clearScannedTicketUrl() {
  scannedBooking = null;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("ticket")) return;
  url.searchParams.delete("ticket");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function sendConfirmationEmail(email, name, dayName, dateLabel, time) {
  if (!config.emailjsServiceId || !config.emailjsTemplateId) {
    console.warn("EmailJS not configured. Skipping confirmation email.");
    return;
  }

  try {
    await emailjs.send(config.emailjsServiceId, config.emailjsTemplateId, {
      to_email: email,
      to_name: name,
      day_name: dayName,
      date_label: dateLabel,
      slot_time: time,
    });
  } catch (err) {
    console.warn("Confirmation email could not be sent:", err);
  }
}

async function createBooking(slotId, name, phone, email, recurringWeeks) {
  let { data, error } = await supabase.rpc("book_slot_v2", {
    p_slot_id: slotId,
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_recurring_weeks: recurringWeeks,
  });

  if (!error) {
    return { booking: data?.[0], error: null };
  }

  // Compatibility with the first hardened migration and the legacy schema.
  if (error.code === "PGRST202" || error.code === "42883") {
    if (recurringWeeks > 1) {
      return {
        booking: null,
        error: { message: "FEATURE_MIGRATION_REQUIRED" },
      };
    }

    const rpcFallback = await supabase.rpc("book_slot", {
      p_slot_id: slotId,
      p_name: name,
      p_phone: phone,
    });

    if (!isMissingRpc(rpcFallback.error)) {
      data = rpcFallback.data;
      error = rpcFallback.error;
    } else {
      const fallback = await supabase
        .from("bookings")
        .insert({ slot_id: slotId, name, phone })
        .select("id, name, phone")
        .single();

      data = fallback.data
        ? [{ ...fallback.data, booking_count: undefined }]
        : null;
      error = fallback.error;
    }
  }

  return { booking: data?.[0] ?? null, error };
}

async function getSlotLockState(slotId) {
  const { data, error } = await supabase
    .from("slots")
    .select("is_day_locked, is_slot_locked")
    .eq("id", slotId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to check slot locks:", error.message);
    return { dayLocked: false, slotLocked: false };
  }

  return {
    dayLocked: Boolean(data?.is_day_locked),
    slotLocked: Boolean(data?.is_slot_locked),
  };
}

function isMissingRpc(error) {
  return error?.code === "PGRST202" || error?.code === "42883";
}

async function fetchSlotBookings(slotId) {
  const result = await supabase.rpc("get_slot_bookings", {
    p_slot_id: slotId,
  });

  if (!isMissingRpc(result.error)) return result;

  return supabase.rpc("get_bookings_with_phone", {
    p_slot_id: slotId,
  });
}

async function exportWeekCsv(button) {
  button.disabled = true;
  clearScheduleStatus();

  try {
    if (!(await isCurrentUserAdmin())) {
      isOwner = false;
      renderAdminActions();
      showScheduleStatus(t("admin_required"), "error");
      return;
    }

    const rows = [["Date", "Day", "Time", "Name", "Phone", "Email", "Attendance"]];
    const { data, error } = await supabase.rpc("get_admin_week_export", {
      p_week_start: toDateKey(visibleWeekStart ?? getStartOfWeek(new Date())),
    });

    if (error) throw error;
    (data ?? []).forEach((booking) => {
      rows.push([
        booking.day_key,
        booking.day_name,
        booking.time,
        booking.name,
        booking.phone || "",
        booking.email || "",
        booking.attendance || "",
      ]);
    });

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule-${toDateKey(visibleWeekStart)}.csv`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 0);
    showScheduleStatus(t("admin_export_ready"), "success");
  } catch (error) {
    console.error("Could not export week:", error);
    showScheduleStatus(
      t(isMissingRpc(error) ? "feature_migration_required" : "admin_export_failed"),
      "error"
    );
  } finally {
    button.disabled = false;
  }
}

async function isCurrentUserAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("is_app_admin");
  return !error && Boolean(data);
}

function renderSavedNames(bookings, highlightedBookingId = null) {
  const list = document.getElementById("savedNamesList");
  if (!list) return;

  list.replaceChildren();

  if (!bookings.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = t("dialog_no_names");
    list.appendChild(empty);
    return;
  }

  bookings.forEach((booking) => {
    const item = document.createElement("li");
    item.className = "saved-user-item";
    item.dataset.bookingId = booking.id;
    if (booking.id === highlightedBookingId && !prefersReducedMotion()) {
      item.classList.add("saved-user-item-new");
    }

    const info = document.createElement("div");
    info.className = "saved-user-info";
    info.textContent =
      isOwner && booking.phone
        ? `${booking.name} — ${booking.phone}`
        : booking.name;

    item.appendChild(info);

    if (isOwner) {
      const actions = document.createElement("div");
      actions.className = "saved-user-actions";

      const btnEdit = document.createElement("button");
      const btnRemove = document.createElement("button");

      btnEdit.className = "user-edit-btn";
      btnEdit.type = "button";
      btnRemove.className = "user-remove-btn";
      btnRemove.type = "button";

      btnEdit.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
      btnEdit.setAttribute("aria-label", t("edit_btn"));
      btnEdit.title = t("edit_btn");
      btnRemove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
      btnRemove.setAttribute("aria-label", t("remove_btn_small"));
      btnRemove.title = t("remove_btn_small");

      btnEdit.addEventListener("click", () => handleEditBooking(booking));
      btnRemove.addEventListener("click", () => handleRemoveBooking(booking));

      const attendance = document.createElement("div");
      attendance.className = "attendance-controls";
      [
        ["present", "fa-check", "attendance_present"],
        ["absent", "fa-xmark", "attendance_absent"],
      ].forEach(([value, icon, labelKey]) => {
        const attendanceButton = document.createElement("button");
        attendanceButton.type = "button";
        attendanceButton.className = `attendance-btn ${value}`;
        attendanceButton.classList.toggle("active", booking.attendance === value);
        attendanceButton.setAttribute("aria-label", t(labelKey));
        attendanceButton.title = t(labelKey);
        attendanceButton.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
        attendanceButton.addEventListener("click", async () => {
          if (await setAttendance(booking, value, attendanceButton)) {
            renderSavedNames(bookings);
          }
        });
        attendance.appendChild(attendanceButton);
      });

      const management = document.createElement("div");
      management.className = "booking-management-controls";
      management.append(btnEdit, btnRemove);

      actions.append(attendance, management);
      item.appendChild(actions);
    }

    list.appendChild(item);
  });
}

function playBookingSuccess(button, spotsElement) {
  if (!button) return;

  button.classList.add("is-success");
  button.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i><span>${t(
    "msg_saved"
  )}</span>`;
  spotsElement?.classList.add("is-updated");

  window.setTimeout(() => {
    button.classList.remove("is-success");
    button.textContent = t("dialog_save");
    spotsElement?.classList.remove("is-updated");
  }, 1400);
}

function handleEditBooking(currentUser) {
  editingBookingId = currentUser.id;

  const nameEl = document.getElementById("clientName");
  const telEl = document.getElementById("clientPhone");
  const saveBtn = document.getElementById("saveSpotBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (nameEl) nameEl.value = currentUser.name || "";
  if (telEl) telEl.value = currentUser.phone || "";

  if (saveBtn) saveBtn.textContent = t("dialog_update");
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");

  clearDialogMessage();

  const fieldToScroll = nameEl || telEl;
  fieldToScroll?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

}

function handleRemoveBooking(currentUser) {
  pendingRemoveBooking = currentUser;

  const title = document.getElementById("removeConfirmTitle");
  const text = document.getElementById("removeConfirmText");
  const dialog = document.getElementById("removeConfirmDialog");

  if (title) title.textContent = t("remove_question");
  if (text) text.textContent = t("remove_text");

  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

function closeRemoveConfirmDialog() {
  const dialog = document.getElementById("removeConfirmDialog");
  if (dialog?.open) {
    dialog.close();
  }
  pendingRemoveBooking = null;
}

async function confirmRemoveBooking() {
  if (!pendingRemoveBooking || !selectedSlot) return;

  const currentUser = pendingRemoveBooking;
  const day = state.find((item) => item.key === selectedSlot.dayKey);
  const slot = day?.slots.find((item) => item.time === selectedSlot.time);

  if (!day || !slot) {
    closeRemoveConfirmDialog();
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", currentUser.id);

  if (error) {
    console.error(error);
    closeRemoveConfirmDialog();
    showDialogMessage(t("msg_update_failed"));
    return;
  }

  slot.bookedUsers = slot.bookedUsers.filter(
    (booking) => booking.id !== currentUser.id
  );
  slot.bookingCount = slot.bookedUsers.length;

  if (editingBookingId === currentUser.id) {
    resetBookingForm();
  }

  const dialogSpots = document.getElementById("dialogSpots");
  if (dialogSpots) {
    const spotsLeft = slot.capacity - slot.bookingCount;
    dialogSpots.textContent = `${spotsLeft} / ${slot.capacity}`;
  }

  renderSavedNames(slot.bookedUsers);
  renderWeek();
  renderAdminActions();
  closeRemoveConfirmDialog();
  showDialogMessage(t("msg_removed"), "success");
}

function resetBookingForm() {
  editingBookingId = null;

  const nameEl = document.getElementById("clientName");
  const telEl = document.getElementById("clientPhone");
  const emailEl = document.getElementById("clientEmail");
  const saveBtn = document.getElementById("saveSpotBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const recurringBooking = document.getElementById("recurringBooking");

  if (nameEl) nameEl.value = "";
  if (telEl) telEl.value = "";
  if (emailEl) emailEl.value = "";
  if (recurringBooking) recurringBooking.checked = false;

  if (saveBtn) saveBtn.textContent = t("dialog_save");
  if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
}

function showDialogMessage(text, type = "error") {
  const message = document.getElementById("dialogMessage");
  if (!message) return;

  message.textContent = text;
  message.className = `dialog-message ${type}`;
}

function clearDialogMessage() {
  const message = document.getElementById("dialogMessage");
  if (!message) return;

  message.textContent = "";
  message.className = "dialog-message hidden";
}

function setScheduleLoading(loading) {
  const spinner = document.getElementById("slotSpinner");
  const page = document.querySelector(".schedule-page");
  spinner?.classList.toggle("hidden", !loading);
  spinner?.setAttribute("aria-hidden", String(!loading));
  page?.setAttribute("aria-busy", String(loading));

  document.querySelectorAll(".week-nav-btn").forEach((button) => {
    button.disabled = loading;
  });
}

function showScheduleStatus(message, type = "error") {
  const status = document.getElementById("scheduleStatus");
  if (!status) return;

  status.textContent = message;
  status.className = `schedule-status ${type}`;
}

function clearScheduleStatus() {
  const status = document.getElementById("scheduleStatus");
  if (!status) return;

  status.textContent = "";
  status.className = "schedule-status hidden";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canUseViewTransitions() {
  return typeof document.startViewTransition === "function" && !prefersReducedMotion();
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function formatDayName(date) {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: "long",
  }).format(date);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat(getLocale(), {
    day: "numeric",
    month: "short",
  }).format(date);
}
