const STORAGE_KEY = "pt_schedule_v1";
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

export function init() {
  state = loadSchedule();
  renderWeek();
  bindDialogActions();
}

function loadSchedule() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const freshWeek = createWeekSchedule();

  if (!saved || !Array.isArray(saved)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshWeek));
    return freshWeek;
  }

  const mergedWeek = freshWeek.map((freshDay) => {
    const savedDay = saved.find((item) => item.key === freshDay.key);

    if (!savedDay) return freshDay;

    const mergedSlots = freshDay.slots.map((freshSlot) => {
      const savedSlot = savedDay.slots?.find(
        (item) => item.time === freshSlot.time
      );

      return {
        ...freshSlot,
        bookedUsers: Array.isArray(savedSlot?.bookedUsers)
          ? savedSlot.bookedUsers
          : [],
      };
    });

    return {
      ...freshDay,
      slots: mergedSlots,
    };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedWeek));
  return mergedWeek;
}

function createWeekSchedule() {
  const weekDates = getCurrentWeekDates();

  return weekDates.map((date) => {
    const dayName = formatDayName(date);
    const times = DAY_SLOT_MAP[dayName] || [];

    return {
      key: toDateKey(date),
      dayName,
      dateLabel: formatDateLabel(date),
      slots: times.map((time) => ({
        time,
        capacity: CAPACITY,
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
        const spotsLeft = getSpotsLeft(slot);

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
        meta.textContent = `${slot.bookedUsers.length} booked / ${slot.capacity} total`;

        slotBtn.append(top, meta);
        slotBtn.addEventListener("click", () => openSlot(day.key, slot.time));

        slotList.appendChild(slotBtn);
      });
    }

    dayCard.append(header, slotList);
    weekGrid.appendChild(dayCard);
  });
}

function openSlot(dayKey, time) {
  const spinner = document.getElementById("slotSpinner");
  if (spinner) {
    spinner.classList.remove("hidden");
  }

  setTimeout(() => {
    if (spinner) {
      spinner.classList.add("hidden");
    }

    const day = state.find((item) => item.key === dayKey);
    const slot = day?.slots.find((item) => item.time === time);

    if (!day || !slot) return;

    selectedSlot = { dayKey, time };

    const dialogDay = document.getElementById("dialogDay");
    const dialogTime = document.getElementById("dialogTime");
    const dialogSpots = document.getElementById("dialogSpots");
    const clientName = document.getElementById("clientName");
    const dialog = document.getElementById("slotDialog");

    if (dialogDay) {
      dialogDay.textContent = `${day.dayName} • ${day.dateLabel}`;
    }

    if (dialogTime) {
      dialogTime.textContent = slot.time;
    }

    if (dialogSpots) {
      dialogSpots.textContent = `${getSpotsLeft(slot)} of ${
        slot.capacity
      } spots available`;
    }

    if (clientName) {
      clientName.value = "";
    }

    renderSavedNames(slot.bookedUsers);
    clearDialogMessage();

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    if (clientName) {
      clientName.focus();
    }
  }, 500);
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

function saveSpot() {
  if (!selectedSlot) return;

  const input = document.getElementById("clientName");
  if (!input) return;

  const name = input.value.trim();

  if (!name) {
    showDialogMessage("Please enter your name.");
    input.focus();
    return;
  }

  const day = state.find((item) => item.key === selectedSlot.dayKey);
  const slot = day?.slots.find((item) => item.time === selectedSlot.time);

  if (!day || !slot) return;

  const alreadyExists = slot.bookedUsers.some(
    (savedName) => savedName.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    showDialogMessage("This name is already saved for this slot.");
    input.focus();
    return;
  }

  if (slot.bookedUsers.length >= slot.capacity) {
    showDialogMessage("No spots left for this slot.");
    return;
  }

  slot.bookedUsers.push(name);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const dialogSpots = document.getElementById("dialogSpots");
  if (dialogSpots) {
    dialogSpots.textContent = `${getSpotsLeft(slot)} of ${
      slot.capacity
    } spots available`;
  }

  renderSavedNames(slot.bookedUsers);
  renderWeek();

  input.value = "";
  input.focus();

  showDialogMessage("Your spot has been saved.", "success");
}

function renderSavedNames(names) {
  const list = document.getElementById("savedNamesList");
  if (!list) return;

  list.replaceChildren();

  if (!names.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No saved names yet.";
    list.appendChild(empty);
    return;
  }

  names.forEach((name) => {
    const item = document.createElement("li");
    item.textContent = name;
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

function getSpotsLeft(slot) {
  return slot.capacity - slot.bookedUsers.length;
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
