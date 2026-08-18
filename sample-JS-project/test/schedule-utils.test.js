import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTicketPayload,
  findNextWorkout,
  getBookingReference,
} from "../js/booking-access.js";

import {
  DAY_SLOT_MAP,
  addDays,
  applySlotRealtimeUpdate,
  buildCalendarFile,
  buildGoogleCalendarUrl,
  findNextAvailableSlot,
  filterRosterBookings,
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
  assert.deepEqual(DAY_SLOT_MAP.Sunday, []);
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
        attendance: "present",
        day_key: "2026-08-12",
        time: "17:00",
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

test("nearest available slot skips past, locked, and full sessions", () => {
  const now = new Date(2026, 7, 18, 17, 30, 0);
  const days = [
    {
      key: "2026-08-18",
      locked: false,
      slots: [
        { id: 1, time: "17:00", locked: false, bookingCount: 1, capacity: 14 },
        { id: 2, time: "18:00", locked: true, bookingCount: 1, capacity: 14 },
      ],
    },
    {
      key: "2026-08-19",
      locked: false,
      slots: [
        { id: 3, time: "17:00", locked: false, bookingCount: 14, capacity: 14 },
        { id: 4, time: "18:00", locked: false, bookingCount: 3, capacity: 14 },
      ],
    },
  ];

  assert.equal(findNextAvailableSlot(days, now)?.slot.id, 4);
});

test("admin roster search matches a participant by name or phone", () => {
  const bookings = [
    { id: "one", name: "Роси", phone: "0878698298" },
    { id: "two", name: "Test User", phone: "09888545390" },
  ];

  assert.deepEqual(filterRosterBookings(bookings, "рос"), [bookings[0]]);
  assert.deepEqual(filterRosterBookings(bookings, "45390"), [bookings[1]]);
  assert.deepEqual(filterRosterBookings(bookings, "  "), bookings);
  assert.deepEqual(filterRosterBookings(bookings, "missing"), []);
});

test("realtime slot updates patch only the matching visible session", () => {
  const days = [
    {
      key: "2026-08-19",
      locked: false,
      slots: [
        {
          id: "slot-a",
          time: "17:00",
          locked: false,
          bookingCount: 2,
          capacity: 14,
        },
      ],
    },
  ];

  assert.equal(
    applySlotRealtimeUpdate(days, {
      id: "slot-a",
      day_key: "2026-08-19",
      booking_count: 5,
      capacity: 12,
      is_day_locked: true,
      is_slot_locked: true,
    }),
    true
  );
  assert.deepEqual(days[0], {
    key: "2026-08-19",
    locked: true,
    slots: [
      {
        id: "slot-a",
        time: "17:00",
        locked: true,
        bookingCount: 5,
        capacity: 12,
      },
    ],
  });
  assert.equal(
    applySlotRealtimeUpdate(days, {
      id: "other-slot",
      day_key: "2026-08-19",
      booking_count: 9,
    }),
    false
  );
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

test("Google Calendar link contains the training time and title", () => {
  const calendarUrl = new URL(
    buildGoogleCalendarUrl({
      dayKey: "2026-08-19",
      time: "17:00",
      title: "Emotion in Motion Training",
    })
  );

  assert.equal(calendarUrl.hostname, "calendar.google.com");
  assert.equal(calendarUrl.searchParams.get("action"), "TEMPLATE");
  assert.equal(calendarUrl.searchParams.get("text"), "Emotion in Motion Training");
  assert.match(calendarUrl.searchParams.get("dates"), /^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
});

test("next workout selects the nearest future active booking", () => {
  const now = new Date(2026, 7, 18, 12, 0, 0);
  const items = [
    { item_type: "waitlist", day_key: "2026-08-18", time: "17:00" },
    { item_type: "booking", day_key: "2026-08-20", time: "18:00" },
    { item_type: "booking", day_key: "2026-08-19", time: "17:00" },
    { item_type: "booking", day_key: "2026-08-17", time: "17:00" },
  ];

  assert.equal(findNextWorkout(items, now)?.day_key, "2026-08-19");
});

test("ticket QR payload excludes the private booking access token", () => {
  const ticket = {
    id: "53dc8e4e-c482-44c2-9f52-16cc7bc78066",
    access_token: "private-token",
    day_key: "2026-08-19",
    time: "17:00",
  };
  const payload = buildTicketPayload(ticket, "https://app.example.com");

  assert.equal(getBookingReference(ticket.id), "EIM-53DC8E4E");
  const ticketUrl = new URL(payload);
  assert.equal(ticketUrl.origin, "https://app.example.com");
  assert.equal(ticketUrl.hash, "#schedule");
  assert.equal(
    ticketUrl.searchParams.get("ticket"),
    "53dc8e4e-c482-44c2-9f52-16cc7bc78066"
  );
  assert.doesNotMatch(payload, /private-token/);
});
