const ACCESS_KEY = "emotion_booking_access";

export function readBookingAccess(storage = globalThis.localStorage) {
  try {
    return dedupeAccess(JSON.parse(storage?.getItem(ACCESS_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeBookingAccess(records, storage = globalThis.localStorage) {
  storage?.setItem(
    ACCESS_KEY,
    JSON.stringify(dedupeAccess(records).slice(-40))
  );
}

export function findNextWorkout(items, now = new Date()) {
  return (items ?? [])
    .filter(
      (item) =>
        item.item_type === "booking" &&
        item.attendance !== "cancelled" &&
        new Date(`${item.day_key}T${item.time}:00`) > now
    )
    .sort((a, b) =>
      `${a.day_key}T${a.time}`.localeCompare(`${b.day_key}T${b.time}`)
    )[0] ?? null;
}

export function getBookingReference(bookingId) {
  const shortId = String(bookingId || "").replaceAll("-", "").slice(0, 8);
  return shortId ? `EIM-${shortId.toUpperCase()}` : "EIM";
}

export function buildTicketPayload({ id, day_key: dayKey, time }) {
  return JSON.stringify({
    type: "emotion-in-motion-booking",
    version: 1,
    bookingId: id,
    day: dayKey,
    time,
  });
}

function dedupeAccess(records) {
  const map = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    if (record?.id && record?.token) map.set(record.token, record);
  });
  return [...map.values()];
}
