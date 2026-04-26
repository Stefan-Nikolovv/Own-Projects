import { supabase, OWNER_EMAIL } from "../../js/supabase.js";
import { t, getLocale, applyTranslations } from "../../js/i18n.js";

const CAPACITY = 16;
let editingBookingId = null;
let pendingRemoveBooking = null;

const DAY_SLOT_MAP = {
  Monday: ["17:00", "18:00"],
  Tuesday: ["18:00"],
  Wednesday: ["17:00", "18:00"],
  Thursday: ["18:00"],
  Friday: ["17:00", "18:00"],
  Saturday: ["10:00", "11:00"],
  Sunday: [],
};

let state = [];
let selectedSlot = null;
let isOwner = false;

export async function init() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isOwner = user?.email === OWNER_EMAIL;

    state = await loadSchedule();
    renderWeek();
    bindDialogActions();
    // applyTranslations(document.getElementById("app"));
    resetBookingForm();
  } catch (err) {
    console.error("Schedule init error:", err);
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `<div class="page"><h1>Error loading schedule</h1><p>${err.message}</p></div>`;
    }
  }
}

async function loadSchedule() {
  const weekDates = getCurrentWeekDates();
  const weekDayKeys = weekDates.map(toDateKey);

  const slotsToUpsert = weekDates.flatMap((date) => {
    const dayKey = getStableDayKey(date);
    return (DAY_SLOT_MAP[dayKey] || []).map((time) => ({
      day_key: toDateKey(date),
      day_name: dayKey,
      time,
      capacity: CAPACITY,
    }));
  });

  if (slotsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("slots")
      .upsert(slotsToUpsert, {
        onConflict: "day_key,time",
        ignoreDuplicates: true,
      });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
    }
  }

  const { data: slotsData, error } = await supabase
    .from("slots")
    .select("id, day_key, time, capacity")
    .in("day_key", weekDayKeys);

  if (error) {
    console.error("Failed to load schedule:", error.message);
    return buildEmptyWeek(weekDates);
  }

  const slotIds = slotsData?.map((s) => s.id) ?? [];

  const { data: bookingCounts, error: countError } = await supabase
    .from("bookings")
    .select("slot_id")
    .in("slot_id", slotIds);

  if (countError) {
    console.error("Failed to load booking counts:", countError.message);
  }

  const countMap = {};
  bookingCounts?.forEach(({ slot_id }) => {
    countMap[slot_id] = (countMap[slot_id] ?? 0) + 1;
  });

  return weekDates.map((date) => {
    const dayKey = toDateKey(date);
    const stableDayKey = getStableDayKey(date);
    const times = DAY_SLOT_MAP[stableDayKey] || [];

    return {
      key: dayKey,
      dayName: formatDayName(date),
      dateLabel: formatDateLabel(date),
      slots: times.map((time) => {
        const dbSlot = slotsData?.find(
          (s) => s.day_key === dayKey && s.time === time
        );
        const bookingCount = dbSlot ? countMap[dbSlot.id] ?? 0 : 0;

        return {
          id: dbSlot?.id ?? null,
          time,
          capacity: CAPACITY,
          bookingCount,
          bookedUsers: [],
        };
      }),
    };
  });
}

function buildEmptyWeek(weekDates) {
  return weekDates.map((date) => {
    const stableDayKey = getStableDayKey(date);

    return {
      key: toDateKey(date),
      dayName: formatDayName(date),
      dateLabel: formatDateLabel(date),
      slots: (DAY_SLOT_MAP[stableDayKey] || []).map((time) => ({
        id: null,
        time,
        capacity: CAPACITY,
        bookingCount: 0,
        bookedUsers: [],
      })),
    };
  });
}

function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getStableDayKey(date) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return dayNames[date.getDay()];
}

function renderWeek() {
  const weekGrid = document.getElementById("weekGrid");
  if (!weekGrid) return;

  weekGrid.replaceChildren();

  state.forEach((day) => {
    const dayCard = document.createElement("article");
    dayCard.className = "day-card";

    const header = document.createElement("div");
    header.className = "day-card-header";

    const dayName = document.createElement("div");
    dayName.className = "day-name";
    dayName.textContent = day.dayName;

    const dayDate = document.createElement("div");
    dayDate.className = "day-date";
    dayDate.textContent = day.dateLabel;

    header.append(dayName, dayDate);

    const slotList = document.createElement("div");
    slotList.className = "slot-list";

    if (!day.slots.length) {
      const emptyText = document.createElement("p");
      emptyText.className = "empty-state";
      emptyText.textContent = t("no_slots");
      slotList.appendChild(emptyText);
    } else {
      day.slots.forEach((slot) => {
        const spotsLeft = slot.capacity - slot.bookingCount;

        const slotBtn = document.createElement("button");
        slotBtn.className = "slot-btn";
        slotBtn.type = "button";
        slotBtn.disabled = spotsLeft <= 0;

        const top = document.createElement("div");
        top.className = "slot-top";

        const time = document.createElement("span");
        time.className = "slot-time";
        time.textContent = slot.time;

        const badge = document.createElement("span");
        badge.className = "slot-badge";
        badge.textContent =
          spotsLeft > 0 ? t("spots_left", { count: spotsLeft }) : t("full");

        top.append(time, badge);

        const meta = document.createElement("div");
        meta.className = "slot-meta";
        meta.textContent = t("booked_total", {
          booked: slot.bookingCount,
          capacity: slot.capacity,
        });

        slotBtn.append(top, meta);
        slotBtn.addEventListener("click", () => openSlot(day.key, slot.time));

        slotList.appendChild(slotBtn);
      });
    }

    dayCard.append(header, slotList);
    weekGrid.appendChild(dayCard);
  });
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

  const { data: bookings, error } = await supabase.rpc(
    "get_bookings_with_phone",
    { p_slot_id: slot.id }
  );

  if (spinner) spinner.classList.add("hidden");

  if (error) {
    console.error("Failed to load bookings:", error.message);
    return;
  }

  slot.bookedUsers = bookings ?? [];
  slot.bookingCount = slot.bookedUsers.length;
  selectedSlot = { dayKey, time };

  const dialogDay = document.getElementById("dialogDay");
  const dialogTime = document.getElementById("dialogTime");
  const dialogSpots = document.getElementById("dialogSpots");
  const clientName = document.getElementById("clientName");
  const clientPhone = document.getElementById("clientPhone");
  const dialog = document.getElementById("slotDialog");

  if (dialogDay) dialogDay.textContent = `${day.dayName} • ${day.dateLabel}`;
  if (dialogTime) dialogTime.textContent = slot.time;
  if (dialogSpots) {
    const spotsLeft = slot.capacity - slot.bookingCount;
    dialogSpots.textContent = `${spotsLeft} / ${slot.capacity}`;
  }

  if (clientName) clientName.value = "";
  if (clientPhone) clientPhone.value = "";

  resetBookingForm();
  renderSavedNames(slot.bookedUsers);
  clearDialogMessage();

  if (dialog && !dialog.open) dialog.showModal();
  if (clientName) clientName.focus();
}

function bindDialogActions() {
  const saveBtn = document.getElementById("saveSpotBtn");
  const clientName = document.getElementById("clientName");
  const dialog = document.getElementById("slotDialog");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const removeConfirmDialog = document.getElementById("removeConfirmDialog");
  const cancelRemoveBtn = document.getElementById("cancelRemoveBtn");
  const confirmRemoveBtn = document.getElementById("confirmRemoveBtn");

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
  const saveBtn = document.getElementById("saveSpotBtn");

  if (!nameInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput?.value.trim() || null;

  if (!name) {
    showDialogMessage(t("msg_enter_name"));
    nameInput.focus();
    return;
  }

  const day = state.find((item) => item.key === selectedSlot.dayKey);
  const slot = day?.slots.find((item) => item.time === selectedSlot.time);

  if (!day || !slot || !slot.id) return;

  const duplicateBooking = slot.bookedUsers.find((b) => {
    const sameName = (b.name || "").toLowerCase() === name.toLowerCase();
    const sameRecord = b.id === editingBookingId;
    return sameName && !sameRecord;
  });

  if (duplicateBooking) {
    showDialogMessage(t("msg_duplicate"));
    nameInput.focus();
    return;
  }

  if (!editingBookingId && slot.bookingCount >= slot.capacity) {
    showDialogMessage(t("msg_full"));
    return;
  }

  if (saveBtn) saveBtn.disabled = true;

  try {
    if (editingBookingId) {
      const { error } = await supabase
        .from("bookings")
        .update({ name, phone })
        .eq("id", editingBookingId);

      if (error) {
        console.error(error);
        showDialogMessage(t("msg_update_failed"));
        nameInput.focus();
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
      const { data, error } = await supabase
        .from("bookings")
        .insert({ slot_id: slot.id, name, phone })
        .select("id, name, phone")
        .single();

      if (error) {
        console.error(error);

        if (error.code === "23505") {
          showDialogMessage(t("msg_duplicate"));
        } else {
          showDialogMessage(t("msg_save_failed"));
        }

        nameInput.focus();
        return;
      }

      slot.bookedUsers.push({
        id: data.id,
        name: data.name,
        phone: isOwner ? data.phone : null,
      });

      slot.bookingCount = slot.bookedUsers.length;
      showDialogMessage(t("msg_saved"), "success");
    }

    const dialogSpots = document.getElementById("dialogSpots");
    if (dialogSpots) {
      const spotsLeft = slot.capacity - slot.bookingCount;
      dialogSpots.textContent = `${spotsLeft} / ${slot.capacity}`;
    }

    renderSavedNames(slot.bookedUsers);
    renderWeek();
    resetBookingForm();
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function renderSavedNames(bookings) {
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

      btnEdit.textContent = t("edit_btn");
      btnRemove.textContent = t("remove_btn_small");

      btnEdit.addEventListener("click", () => handleEditBooking(booking));
      btnRemove.addEventListener("click", () => handleRemoveBooking(booking));

      actions.append(btnEdit, btnRemove);
      item.appendChild(actions);
    }

    list.appendChild(item);
  });
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

  setTimeout(() => {
    nameEl?.focus({ preventScroll: true });
    nameEl?.select?.();
  }, 250);
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
  closeRemoveConfirmDialog();
  showDialogMessage(t("msg_removed"), "success");
}

function resetBookingForm() {
  editingBookingId = null;

  const nameEl = document.getElementById("clientName");
  const telEl = document.getElementById("clientPhone");
  const saveBtn = document.getElementById("saveSpotBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (nameEl) nameEl.value = "";
  if (telEl) telEl.value = "";

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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
