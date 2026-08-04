import test from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  getStartOfWeek,
  isDateInPast,
  isSlotInPast,
  isToday,
  mapBookingError,
  toDateKey,
} from "../pages/schedule/schedule-utils.js";

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

test("booking database errors map to translated UI messages", () => {
  assert.equal(mapBookingError({ message: "SLOT_FULL" }), "msg_full");
  assert.equal(mapBookingError({ message: "DAY_LOCKED" }), "msg_day_locked");
  assert.equal(mapBookingError({ code: "23505" }), "msg_duplicate");
  assert.equal(mapBookingError({ message: "unexpected" }), "msg_save_failed");
});
