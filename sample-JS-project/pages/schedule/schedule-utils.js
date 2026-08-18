export const CAPACITY = 14;

export const DAY_SLOT_MAP = {
  Monday: ["17:00", "18:00"],
  Tuesday: ["17:00", "18:00"],
  Wednesday: ["17:00", "18:00"],
  Thursday: ["17:00", "18:00"],
  Friday: ["17:00", "18:00"],
  Saturday: ["10:00", "11:00", "12:00"],
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

export function getManagedBookingStatus(item, now = new Date()) {
  const isPast = isSlotInPast(item.day_key, item.time, now);
  const attendance = item.attendance || "pending";

  if (isPast) {
    return { key: "booking_past", isPast };
  }

  if (item.item_type === "waitlist") {
    return { key: "waitlist_position", isPast };
  }

  return { key: `attendance_${attendance}`, isPast };
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
  if (message.includes("SLOT_LOCKED")) return "msg_slot_locked";
  if (message.includes("DAY_LOCKED")) return "msg_day_locked";
  if (message.includes("SLOT_IN_PAST")) return "msg_past_slot";
  if (message.includes("BOOKING_CUTOFF")) return "msg_booking_cutoff";
  if (message.includes("INVALID_NAME")) return "msg_enter_valid_name";
  if (message.includes("INVALID_PHONE")) return "msg_phone_invalid";
  if (message.includes("FEATURE_MIGRATION_REQUIRED")) {
    return "feature_migration_required";
  }

  return "msg_save_failed";
}

export function getAvailabilityLevel(spotsLeft) {
  if (spotsLeft <= 0) return "full";
  if (spotsLeft <= 3) return "almost-full";
  return "available";
}

export function findNextAvailableSlot(days, now = new Date()) {
  return (days ?? [])
    .flatMap((day) =>
      (day.slots ?? []).map((slot) => ({ day, slot }))
    )
    .filter(({ day, slot }) =>
      !day.locked &&
      !slot.locked &&
      Boolean(slot.id) &&
      slot.bookingCount < slot.capacity &&
      !isSlotInPast(day.key, slot.time, now)
    )
    .sort((a, b) =>
      `${a.day.key}T${a.slot.time}`.localeCompare(`${b.day.key}T${b.slot.time}`)
    )[0] ?? null;
}

export function buildCalendarFile({
  dayKey,
  time,
  title,
  durationMinutes = 60,
}) {
  const start = new Date(`${dayKey}T${time}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const stamp = (date) =>
    date
      .toISOString()
      .replaceAll("-", "")
      .replaceAll(":", "")
      .replace(/\.\d{3}Z$/, "Z");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Emotion in Motion//Schedule//EN",
    "BEGIN:VEVENT",
    `UID:${dayKey}-${time.replace(":", "")}@emotion-in-motion`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${String(title).replaceAll(",", "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
