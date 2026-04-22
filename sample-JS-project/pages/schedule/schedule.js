import { supabase, OWNER_EMAIL } from "../../js/supabase.js";

const CAPACITY = 16;

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

  // Upsert slots for this week (ignoreDuplicates preserves existing booking_count)
  const slotsToUpsert = weekDates.flatMap((date) => {
    const dayName = formatDayName(date);
    return (DAY_SLOT_MAP[dayName] || []).map((time) => ({
      day_key: toDateKey(date),
      day_name: dayName,
      time,
      capacity: CAPACITY,
    }));
  });

  if (slotsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("slots")
      .upsert(slotsToUpsert, { onConflict: "day_key,time", ignoreDuplicates: true });
    
    if (upsertError) {
      console.error("Upsert error:", upsertError);
    }
  }

  // Fetch slots for this week
  const { data: slotsData, error } = await supabase
    .from("slots")
    .select("id, day_key, time, capacity")
    .in("day_key", weekDayKeys);

  if (error) {
    console.error("Failed to load schedule:", error.message);
    return buildEmptyWeek(weekDates);
  }

  const slotIds = slotsData?.map((s) => s.id) ?? [];

  // Fetch real booking counts directly from the bookings table
  const { data: bookingCounts, error: countError } = await supabase
    .from("bookings")
    .select("slot_id")
    .in("slot_id", slotIds);

  if (countError) {
    console.error("Failed to load booking counts:", countError.message);
  }

  // Build a count map: slot_id -> number of bookings
  const countMap = {};
  bookingCounts?.forEach(({ slot_id }) => {
    countMap[slot_id] = (countMap[slot_id] ?? 0) + 1;
  });

  return weekDates.map((date) => {
    const dayKey = toDateKey(date);
    const dayName = formatDayName(date);
    const times = DAY_SLOT_MAP[dayName] || [];

    return {
      key: dayKey,
      dayName,
      dateLabel: formatDateLabel(date),
      slots: times.map((time) => {
        const dbSlot = slotsData?.find(
          (s) => s.day_key === dayKey && s.time === time
        );
        const bookingCount = dbSlot ? (countMap[dbSlot.id] ?? 0) : 0;
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
    const dayName = formatDayName(date);
    return {
      key: toDateKey(date),
      dayName,
      dateLabel: formatDateLabel(date),
      slots: (DAY_SLOT_MAP[dayName] || []).map((time) => ({
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
  const day = today.getDay(); // Sunday = 0
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
      emptyText.textContent = "No training slots available.";
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
        badge.textContent = spotsLeft > 0 ? `${spotsLeft} spots left` : "Full";

        top.append(time, badge);

        const meta = document.createElement("div");
        meta.className = "slot-meta";
        meta.textContent = `${slot.bookingCount} booked / ${slot.capacity} total`;

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

  // RPC returns name+phone for the owner, name only (phone=null) for everyone else
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
    dialogSpots.textContent = `${spotsLeft} of ${slot.capacity} spots available`;
  }
  if (clientName) clientName.value = "";
  if (clientPhone) clientPhone.value = "";

  renderSavedNames(slot.bookedUsers);
  clearDialogMessage();

  if (dialog && !dialog.open) dialog.showModal();
  if (clientName) clientName.focus();
}

function bindDialogActions() {
  const saveBtn = document.getElementById("saveSpotBtn");
  const clientName = document.getElementById("clientName");
  const dialog = document.getElementById("slotDialog");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveSpot);
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
    });
  }
}

async function saveSpot() {
  if (!selectedSlot) return;

  const nameInput = document.getElementById("clientName");
  const phoneInput = document.getElementById("clientPhone");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput?.value.trim() || null;

  if (!name) {
    showDialogMessage("Please enter your name.");
    nameInput.focus();
    return;
  }

  const day = state.find((item) => item.key === selectedSlot.dayKey);
  const slot = day?.slots.find((item) => item.time === selectedSlot.time);

  if (!day || !slot || !slot.id) return;

  const alreadyExists = slot.bookedUsers.some(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  );
  if (alreadyExists) {
    showDialogMessage("This name is already saved for this slot.");
    nameInput.focus();
    return;
  }

  if (slot.bookingCount >= slot.capacity) {
    showDialogMessage("No spots left for this slot.");
    return;
  }

  const saveBtn = document.getElementById("saveSpotBtn");
  if (saveBtn) saveBtn.disabled = true;

  const { data: newBooking, error } = await supabase
    .from("bookings")
    .insert({ slot_id: slot.id, name, phone })
    .select("id, name, phone")
    .single();

  if (saveBtn) saveBtn.disabled = false;

  if (error) {
    if (error.code === "23505") {
      showDialogMessage("This name is already saved for this slot.");
    } else {
      showDialogMessage("Failed to save. Please try again.");
    }
    nameInput.focus();
    return;
  }

  // For non-owners, mask the phone in local state (matches what the RPC returns)
  slot.bookedUsers.push({
    id: newBooking.id,
    name: newBooking.name,
    phone: isOwner ? newBooking.phone : null,
  });

  // Use bookedUsers.length as the source of truth — it was fetched fresh from
  // the RPC when the dialog opened, so it's always accurate regardless of
  // whatever stale value is stored in slots.booking_count
  const newBookingCount = Math.abs(slot.bookedUsers.length);
  const { error: updateError } = await supabase
    .from("slots")
    .update({ booking_count: newBookingCount })
    .eq("id", slot.id);

  if (updateError) {
    console.error("Failed to update booking_count:", updateError);
  }

  slot.bookingCount = newBookingCount;

  const dialogSpots = document.getElementById("dialogSpots");
  if (dialogSpots) {
    const spotsLeft = slot.capacity - slot.bookingCount;
    dialogSpots.textContent = `${spotsLeft} of ${slot.capacity} spots available`;
  }

  renderSavedNames(slot.bookedUsers);
  renderWeek();

  nameInput.value = "";
  if (phoneInput) phoneInput.value = "";
  nameInput.focus();

  showDialogMessage("Your spot has been saved!", "success");
}

function renderSavedNames(bookings) {
  const list = document.getElementById("savedNamesList");
  if (!list) return;

  list.replaceChildren();

  if (!bookings.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No saved names yet.";
    list.appendChild(empty);
    return;
  }

  bookings.forEach((booking) => {
    const item = document.createElement("li");
    // Phone is only non-null for the owner (the RPC masks it for everyone else)
    if (isOwner && booking.phone) {
      item.textContent = `${booking.name} — ${booking.phone}`;
    } else {
      item.textContent = booking.name;
    }
    list.appendChild(item);
  });
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
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
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
