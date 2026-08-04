export const CAPACITY = 14;

export const DAY_SLOT_MAP = {
  Monday: ["17:00", "18:00"],
  Tuesday: ["18:00"],
  Wednesday: ["17:00", "18:00"],
  Thursday: ["18:00"],
  Friday: ["17:00", "18:00"],
  Saturday: ["10:00", "11:00"],
  Sunday: [],
};

export function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateInPast(dayKey, now = new Date()) {
  return dayKey < toDateKey(now);
}

export function isSlotInPast(dayKey, time, now = new Date()) {
  const todayKey = toDateKey(now);
  if (dayKey !== todayKey) return dayKey < todayKey;

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  return time <= currentTime;
}

export function isToday(dayKey, now = new Date()) {
  return dayKey === toDateKey(now);
}

export function getStableDayKey(date) {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];
}

export function mapBookingError(error) {
  const message = error?.message || "";

  if (error?.code === "23505" || message.includes("DUPLICATE_BOOKING")) {
    return "msg_duplicate";
  }
  if (message.includes("SLOT_FULL")) return "msg_full";
  if (message.includes("DAY_LOCKED")) return "msg_day_locked";
  if (message.includes("SLOT_IN_PAST")) return "msg_past_slot";
  if (message.includes("INVALID_NAME")) return "msg_enter_valid_name";
  if (message.includes("INVALID_PHONE")) return "msg_phone_invalid";

  return "msg_save_failed";
}
