// Sweet Treats by Char: booked slots
// Updated by Claude whenever Char confirms orders. One line per day that has
// bookings or changes. Days not listed have all slots open (4 cakes a day).
//
//   ["2026-11-28", 2],                          2 cakes booked that day
//   ["2026-12-25", "closed"],                   no pickups that day
//   ["2026-12-24", 1, "Bento cakes only"],      1 booked, plus a note customers see
//   ["2026-12-31", 0, "", 6],                   change that day's limit to 6 cakes

window.BOOKINGS = [
  ["2026-11-27", 1],
  ["2026-11-28", "closed"],
  ["2026-11-29", "closed"],
  ["2026-12-06", 2],
  ["2026-12-12", 1],
  ["2026-12-24", 1],
  ["2027-01-16", 1],
];
