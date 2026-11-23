// Sweet Treats by Char: small, dependency-free interactions
document.documentElement.classList.add("js");

// ---- Settings (edit here) ----
const MESSENGER_URL = "https://m.me/100083340789131";
const PHONE = "+639661943736";

// ---- Year in footer ----
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Header border on scroll ----
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---- Mobile menu ----
const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");
function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// ---- Entrances ----
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      const i = Math.max(0, siblings.indexOf(el));
      el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
      el.classList.add("in");
      el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// ---- Messenger links: one place to change the URL ----
document.querySelectorAll(".js-messenger").forEach((a) => { a.href = MESSENGER_URL; });

// Messenger links (m.me) cannot carry a typed message, so we copy the text
// to the clipboard and tell the customer to paste it in the chat.

// "Ask about this cake" buttons copy a short note so the customer can paste it in Messenger
document.querySelectorAll(".js-messenger[data-cake]").forEach((a) => {
  a.addEventListener("click", () => {
    copyText(`Hi Char! I'd like to ask about the ${a.dataset.cake}.`).then((ok) => {
      if (ok) toast("Message copied. In Messenger, press and hold the message box and tap Paste.");
    });
  });
});

// Copy must start inside the click itself, or phones block it.
function copyText(text) {
  const fallback = () => {
    try {
      const t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.top = "0"; t.style.opacity = "0";
      document.body.appendChild(t);
      t.focus(); t.select(); t.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      t.remove(); return ok;
    } catch { return false; }
  };
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true, () => fallback());
  }
  return Promise.resolve(fallback());
}

let toastTimer;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 5000);
}

// ---- Gallery lightbox ----
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
document.querySelectorAll(".gallery__open, .review__shot").forEach((btn) => {
  btn.addEventListener("click", () => {
    const img = btn.querySelector("img");
    lbImg.src = btn.dataset.full;
    lbImg.alt = img.alt;
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else window.open(btn.dataset.full, "_blank");
  });
});
lightbox.querySelector(".lightbox__close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

// ---- Inquiry form: validate, then build a ready-to-send message ----
const form = document.getElementById("inquiry");
const dateInput = document.getElementById("f-date");

// ---- Reservation slots ----
// Char's rules are below. Booked days live in bookings.js.
const SLOTS = {
  dailySlots: 4,        // cakes per day
  leadDays: 4,          // earliest pickup = today + this many days
  monthsAhead: 3,       // how far ahead customers can book
  closedWeekdays: [],   // open every day; e.g. ["monday"] to close Mondays
  pickupTimes: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 NN", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"],
};

const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = new Date(); today.setHours(0, 0, 0, 0);
const isoToday = toIso(today);
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const dayOverrides = {};   // iso -> { slots, booked, closed, note }
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function firstBookable() { const d = new Date(today); d.setDate(d.getDate() + SLOTS.leadDays); return d; }
function lastBookable() { return new Date(today.getFullYear(), today.getMonth() + SLOTS.monthsAhead + 1, 0); }

function dayInfo(d) {
  const iso = toIso(d);
  const o = dayOverrides[iso] || {};
  const closedDay = SLOTS.closedWeekdays.includes(WEEKDAYS[d.getDay()]);
  const total = o.slots ?? (closedDay ? 0 : SLOTS.dailySlots);
  const left = Math.max(0, total - (o.booked || 0));
  let state = "open";
  if (d < firstBookable() || d > lastBookable()) state = "unavailable";
  else if (o.closed || total === 0) state = "closed";
  else if (left === 0) state = "full";
  else if (left === 1) state = "few";
  return { iso, left, total, state, note: o.note || "" };
}

const calGrid = document.getElementById("cal-grid");
const calMonth = document.getElementById("cal-month");
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const pickedEl = document.getElementById("slots-picked");
const noteEl = document.getElementById("slots-note");

function renderCalendar() {
  const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
  calMonth.textContent = viewMonth.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  calPrev.disabled = viewMonth <= new Date(today.getFullYear(), today.getMonth(), 1);
  calNext.disabled = new Date(y, m + 1, 1) > lastBookable();
  calGrid.innerHTML = "";
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) {
    const b = document.createElement("span"); b.className = "cal__blank"; calGrid.appendChild(b);
  }
  const days = new Date(y, m + 1, 0).getDate();
  for (let n = 1; n <= days; n++) {
    const d = new Date(y, m, n);
    const info = dayInfo(d);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cal__day is-${info.state}`;
    btn.dataset.date = info.iso;
    const label = { open: `${info.left} left`, few: "1 left", full: "Full", closed: "Closed", unavailable: "" }[info.state];
    btn.innerHTML = `${n}${label ? `<small>${label}</small>` : ""}`;
    const long = d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });
    const spoken = { open: `${info.left} slots left`, few: "1 slot left", full: "fully booked", closed: "closed", unavailable: "not available" }[info.state];
    btn.setAttribute("aria-label", `${long}, ${spoken}`);
    btn.setAttribute("aria-pressed", String(dateInput.value === info.iso));
    btn.disabled = !(info.state === "open" || info.state === "few");
    calGrid.appendChild(btn);
  }
}

function pickDate(iso) {
  dateInput.value = iso;
  const info = dayInfo(fromIso(iso));
  const long = fromIso(iso).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });
  pickedEl.textContent = `${long}: ${info.left} of ${info.total} slot${info.total === 1 ? "" : "s"} left`;
  noteEl.textContent = info.note;
  renderCalendar();
  if (document.getElementById("slots").classList.contains("has-error")) validateField("date");
}

calGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".cal__day");
  if (btn && !btn.disabled) { pickDate(btn.dataset.date); calGrid.querySelector(`[data-date="${btn.dataset.date}"]`)?.focus(); }
});
calPrev.addEventListener("click", () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCalendar(); });
calNext.addEventListener("click", () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCalendar(); });

function renderTimes() {
  const list = document.getElementById("times-list");
  const current = form.elements.time ? form.elements.time.value : "";
  list.innerHTML = "";
  SLOTS.pickupTimes.forEach((t, i) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="radio" name="time" value="${t.replace(/"/g, "&quot;")}" id="t-${i}"><span></span>`;
    label.querySelector("span").textContent = t;
    if (t === current) label.querySelector("input").checked = true;
    list.appendChild(label);
  });
}
document.getElementById("times-list").addEventListener("change", () => {
  if (document.getElementById("f-time").classList.contains("has-error")) validateField("time");
});

// Booked days come from bookings.js
(window.BOOKINGS || []).forEach(([date, booked, note = "", slots]) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return;
  const closed = String(booked).toLowerCase() === "closed";
  dayOverrides[date] = {
    booked: closed ? 0 : Number(booked) || 0,
    slots: closed ? 0 : (Number.isFinite(slots) ? slots : undefined),
    closed,
    note: closed ? "" : note,
  };
});

renderTimes();
renderCalendar();

// ---- Validation ----
const rules = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => v.replace(/[^\d+]/g, "").replace(/^\+/, "").length >= 10,
  occasion: (v) => v !== "",
  date: (v) => v !== "" && ["open", "few"].includes(dayInfo(fromIso(v)).state),
  time: (v) => v !== "",
  agree: (v) => v === true,
};

function validateField(name) {
  const value = name === "agree" ? form.elements.agree.checked
    : form.elements[name] ? form.elements[name].value : "";
  const ok = rules[name](value);
  const field = name === "date" ? document.getElementById("slots")
    : name === "time" ? document.getElementById("f-time")
    : form.elements[name].closest(".field");
  field.classList.toggle("has-error", !ok);
  if (name !== "date" && name !== "time") {
    form.elements[name].setAttribute("aria-invalid", String(!ok));
    form.elements[name].setAttribute("aria-describedby", `e-${name}`);
  }
  return ok;
}

form.elements.agree.addEventListener("change", () => {
  if (document.getElementById("policy").classList.contains("has-error")) validateField("agree");
});

["name", "phone", "occasion"].forEach((name) => {
  form.elements[name].addEventListener("blur", () => {
    if (form.elements[name].value !== "") validateField(name);
  });
  form.elements[name].addEventListener("input", () => {
    if (form.elements[name].closest(".field").classList.contains("has-error")) validateField(name);
  });
});

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

let currentMessage = "";
const copyBtn = document.getElementById("copy-message");
const copyStatus = document.getElementById("copy-status");

function setCopyStatus(ok) {
  copyStatus.textContent = ok ? "✓ Copied" : "Couldn't copy. Select the message above, copy it, then tap Open Messenger.";
  copyStatus.classList.toggle("is-error", !ok);
}

// Copy, then take the customer straight to Char's Messenger chat
copyBtn.addEventListener("click", () => {
  copyText(currentMessage).then((ok) => {
    setCopyStatus(ok);
    if (!ok) return;
    copyStatus.textContent = "✓ Copied. Opening Messenger…";
    toast("Message copied. In Messenger, press and hold the message box and tap Paste.");
    setTimeout(() => { window.location.href = MESSENGER_URL; }, 1200);
  });
});

// Copy again right as Messenger opens, so the clipboard surely holds the message
document.getElementById("send-messenger").addEventListener("click", () => {
  if (!currentMessage) return;
  copyText(currentMessage).then((ok) => {
    setCopyStatus(ok);
    if (ok) toast("Message copied. In Messenger, press and hold the message box and tap Paste.");
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const results = Object.keys(rules).map(validateField);
  if (results.includes(false)) {
    const firstBad = form.querySelector(".has-error input:not([type=hidden]), .has-error select, .has-error .cal__day:not(:disabled)");
    if (firstBad) firstBad.focus();
    form.querySelector(".has-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const f = form.elements;
  const lines = [
    "Hi Char! I'd like to inquire about a cake.",
    "",
    `Name: ${f.name.value.trim()}`,
    `Mobile: ${f.phone.value.trim()}`,
    `Occasion: ${f.occasion.value}`,
    `Pickup date: ${formatDate(f.date.value)}`,
    `Pickup time: ${f.time.value}`,
    `Cake type: ${f.cake.value}`,
  ];
  if (f.details.value.trim()) lines.push(`Details: ${f.details.value.trim()}`);
  lines.push("", f.cake.value === "Rush cake"
    ? "I have read and agree to the reservation policy (rush cake: full payment upfront plus ₱180 rush fee)."
    : "I have read and agree to the reservation policy (50% non-refundable downpayment to secure my slot).");
  const message = lines.join("\n");

  currentMessage = message;
  const done = document.getElementById("inquiry-done");
  document.getElementById("inquiry-preview").textContent = message;
  document.getElementById("send-messenger").href = MESSENGER_URL;
  document.getElementById("send-sms").href = `sms:${PHONE}?body=${encodeURIComponent(message)}`;

  copyStatus.textContent = "";
  copyStatus.classList.remove("is-error");

  done.hidden = false;
  done.focus();
  done.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
