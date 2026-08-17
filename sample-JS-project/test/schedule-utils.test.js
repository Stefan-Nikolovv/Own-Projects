import test from "node:test";
import assert from "node:assert/strict";

import {
  DAY_SLOT_MAP,
  addDays,
  buildCalendarFile,
  getAvailabilityLevel,
  getManagedBookingStatus,
  getStartOfWeek,
  isDateInPast,
  isSlotInPast,
  isToday,
  mapBookingError,
  toDateKey,
} from "../pages/schedule/schedule-utils.js";

test("weekly timetable includes the expanded training hours", () => {
  assert.deepEqual(DAY_SLOT_MAP.Tuesday, ["17:00", "18:00"]);
  assert.deepEqual(DAY_SLOT_MAP.Thursday, ["17:00", "18:00"]);
  assert.deepEqual(DAY_SLOT_MAP.Saturday, ["10:00", "11:00", "12:00"]);
  assert.deepEqual(DAY_SLOT_MAP.Sunday, ["12:00"]);
});

test("getStartOfWeek returns Monday for weekdays and Sunday", () => {
  assert.equal(toDateKey(getStartOfWeek(new Date(2026, 7, 5))), "2026-08-03");
  assert.equal(toDateKey(getStartOfWeek(new Date(2026, 7, 9))), "2026-08-03");
});

test("addDays crosses month boundaries", () => {
  assert.equal(toDateKey(addDays(new Date(2026, 3, 27), 6)), "2026-05-03");
});

test("past and today checks compare local date keys", () => {
  const now = new Date(2026, 7, 4, 12, 0, 0);
  assert.equal(isDateInPast("2026-08-03", now), true);
  assert.equal(isDateInPast("2026-08-04", now), false);
  assert.equal(isToday("2026-08-04", now), true);
  assert.equal(isSlotInPast("2026-08-04", "11:59", now), true);
  assert.equal(isSlotInPast("2026-08-04", "12:30", now), false);
});

test("managed bookings do not label past pending sessions as upcoming", () => {
  const now = new Date(2026, 7, 17, 12, 0, 0);

  assert.deepEqual(
    getManagedBookingStatus(
      {
        item_type: "booking",
        attendance: "pending",
        day_key: "2026-05-02",
        time: "10:00",
      },
      now
    ),
    { key: "booking_past", isPast: true }
  );

  assert.deepEqual(
    getManagedBookingStatus(
      {
        item_type: "booking",
        attendance: "pending",
        day_key: "2026-08-18",
        time: "17:00",
      },
      now
    ),
    { key: "attendance_pending", isPast: false }
  );
});

test("booking database errors map to translated UI messages", () => {
  assert.equal(mapBookingError({ message: "SLOT_FULL" }), "msg_full");
  assert.equal(mapBookingError({ message: "DAY_LOCKED" }), "msg_day_locked");
  assert.equal(mapBookingError({ message: "SLOT_LOCKED" }), "msg_slot_locked");
  assert.equal(mapBookingError({ code: "23505" }), "msg_duplicate");
  assert.equal(
    mapBookingError({ message: "BOOKING_CUTOFF" }),
    "msg_booking_cutoff"
  );
  assert.equal(mapBookingError({ message: "unexpected" }), "msg_save_failed");
});

test("availability signals full and nearly full sessions", () => {
  assert.equal(getAvailabilityLevel(8), "available");
  assert.equal(getAvailabilityLevel(3), "almost-full");
  assert.equal(getAvailabilityLevel(0), "full");
});

test("calendar export creates a valid event shell", () => {
  const calendar = buildCalendarFile({
    dayKey: "2026-08-05",
    time: "17:00",
    title: "Emotion in Motion Training",
  });

  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.match(calendar, /BEGIN:VEVENT/);
  assert.match(calendar, /UID:2026-08-05-1700@emotion-in-motion/);
  assert.match(calendar, /SUMMARY:Emotion in Motion Training/);
  assert.match(calendar, /END:VCALENDAR/);
});
