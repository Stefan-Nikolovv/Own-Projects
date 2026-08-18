const ACCESS_KEY = "emotion_booking_access";
const PROFILE_KEY = "emotion_booking_profile";
const PROFILE_MAX_AGE = 90 * 24 * 60 * 60 * 1000;

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

export function readRememberedBookingProfile(
  storage = globalThis.localStorage,
  now = Date.now()
) {
  try {
    const profile = JSON.parse(storage?.getItem(PROFILE_KEY) || "null");
    if (
      !profile?.name ||
      !Number.isFinite(profile.savedAt) ||
      now - profile.savedAt > PROFILE_MAX_AGE
    ) {
      storage?.removeItem(PROFILE_KEY);
      return null;
    }

    return {
      name: String(profile.name).trim().slice(0, 80),
      phone: String(profile.phone || "").trim().slice(0, 30),
      email: String(profile.email || "").trim().slice(0, 120),
      savedAt: profile.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeRememberedBookingProfile(
  profile,
  storage = globalThis.localStorage,
  savedAt = Date.now()
) {
  const normalized = {
    name: String(profile?.name || "").trim().slice(0, 80),
    phone: String(profile?.phone || "").trim().slice(0, 30),
    email: String(profile?.email || "").trim().slice(0, 120),
    savedAt,
  };

  if (!normalized.name) return null;
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function clearRememberedBookingProfile(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(PROFILE_KEY);
  } catch {
    // Remembering details is optional and must never block booking.
  }
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

export function buildTicketPayload(
  { id },
  origin = "https://emotion-in-motion.invalid"
) {
  const url = new URL("/", origin);
  url.searchParams.set("ticket", id);
  url.hash = "schedule";
  return url.toString();
}

function dedupeAccess(records) {
  const map = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    if (record?.id && record?.token) map.set(record.token, record);
  });
  return [...map.values()];
}
