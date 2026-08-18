import { supabase } from "../../js/supabase.js";
import { getLocale, t } from "../../js/i18n.js";
import {
  findNextWorkout,
  readBookingAccess,
} from "../../js/booking-access.js";
import { buildCalendarFile } from "../schedule/schedule-utils.js";

let nextWorkout = null;

export function init() {
  document.querySelector(".primary-btn")?.addEventListener("click", () => {
    window.location.hash = "#schedule";
  });

  document
    .getElementById("nextWorkoutCalendarBtn")
    ?.addEventListener("click", downloadNextWorkout);
  document
    .getElementById("nextWorkoutManageBtn")
    ?.addEventListener("click", openBookingManager);

  loadNextWorkout();
}

async function loadNextWorkout() {
  nextWorkout = null;
  const access = readBookingAccess();
  if (!access.length) return;

  const { data, error } = await supabase.rpc("get_my_schedule", {
    p_access: access,
  });
  if (error) {
    console.warn("Next workout could not be loaded:", error.message);
    return;
  }

  nextWorkout = findNextWorkout(data);
  if (!nextWorkout) return;

  renderNextWorkout(nextWorkout);
}

function renderNextWorkout(item) {
  const panel = document.getElementById("nextWorkoutPanel");
  const date = document.getElementById("nextWorkoutDate");
  const name = document.getElementById("nextWorkoutName");
  if (!panel || !date || !name) return;

  const startsAt = new Date(`${item.day_key}T${item.time}:00`);
  const dateLabel = new Intl.DateTimeFormat(getLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(startsAt);

  date.textContent = `${dateLabel} · ${item.time}`;
  name.textContent = item.name;
  panel.classList.remove("hidden");
  updateCountdown(startsAt, panel);
}

function updateCountdown(startsAt, panel) {
  const countdown = document.getElementById("nextWorkoutCountdown");
  if (!countdown || !panel.isConnected) return;

  const milliseconds = startsAt.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(milliseconds / 36e5));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workoutDay = new Date(startsAt);
  workoutDay.setHours(0, 0, 0, 0);
  const calendarDays = Math.round((workoutDay - today) / 86_400_000);
  countdown.textContent = calendarDays >= 2
    ? t("next_workout_in_days", { count: calendarDays })
    : calendarDays === 1
    ? t("next_workout_tomorrow")
    : t("next_workout_in_hours", { count: hours });

  window.setTimeout(() => updateCountdown(startsAt, panel), 60_000);
}

function downloadNextWorkout() {
  if (!nextWorkout) return;

  const calendar = buildCalendarFile({
    dayKey: nextWorkout.day_key,
    time: nextWorkout.time,
    title: "Emotion in Motion Training",
  });
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `emotion-in-motion-${nextWorkout.day_key}-${nextWorkout.time.replace(":", "")}.ics`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

function openBookingManager() {
  sessionStorage.setItem("emotion_open_my_bookings", "1");
  window.location.hash = "#schedule";
}
