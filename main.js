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
const today = new Date();
const isoToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = isoToday;

const rules = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => v.replace(/[^\d+]/g, "").replace(/^\+/, "").length >= 10,
  occasion: (v) => v !== "",
  date: (v) => v !== "" && v >= isoToday,
};

function validateField(name) {
  const input = form.elements[name];
  const ok = rules[name](input.value);
  const field = input.closest(".field");
  field.classList.toggle("has-error", !ok);
  input.setAttribute("aria-invalid", String(!ok));
  input.setAttribute("aria-describedby", `e-${name}`);
  return ok;
}

Object.keys(rules).forEach((name) => {
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
  copyStatus.textContent = ok ? "✓ Copied" : "Couldn't copy. Select the message above and copy it.";
  copyBtn.textContent = ok ? "Copy again" : "Copy message";
}

copyBtn.addEventListener("click", () => {
  copyText(currentMessage).then(setCopyStatus);
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
    const firstBad = form.querySelector(".has-error input, .has-error select");
    if (firstBad) firstBad.focus();
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
    `Cake type: ${f.cake.value}`,
  ];
  if (f.details.value.trim()) lines.push(`Details: ${f.details.value.trim()}`);
  const message = lines.join("\n");

  currentMessage = message;
  const done = document.getElementById("inquiry-done");
  document.getElementById("inquiry-preview").textContent = message;
  document.getElementById("send-messenger").href = MESSENGER_URL;
  document.getElementById("send-sms").href = `sms:${PHONE}?body=${encodeURIComponent(message)}`;

  const ok = await copyText(message);
  setCopyStatus(ok);

  done.hidden = false;
  done.focus();
  done.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
