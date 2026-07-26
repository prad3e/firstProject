/**
 * Workshop interest form
 *
 * Submissions are stored in localStorage by default so you can demo immediately.
 * To send leads to a backend, set FORM_ENDPOINT to your API URL (Formspree, Netlify Forms, etc.).
 */
const FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/your-id"

const form = document.getElementById("interest-form");
const successPanel = document.getElementById("form-success");
const successEmail = document.getElementById("success-email");
const registerAnotherBtn = document.getElementById("register-another");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

/* ── Scroll reveal ─────────────────────────────────────────────── */
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

/* ── Validation ──────────────────────────────────────────────────── */
const validators = {
  name(value) {
    if (!value.trim()) return "Please enter your name.";
    if (value.trim().length < 2) return "Name must be at least 2 characters.";
    return "";
  },
  email(value) {
    if (!value.trim()) return "Please enter your email.";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    return ok ? "" : "Please enter a valid email address.";
  },
  interest(value) {
    return value ? "" : "Please select your primary interest.";
  },
};

function setFieldError(name, message) {
  const input = form.elements[name];
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (input) input.classList.toggle("is-invalid", Boolean(message));
  if (errorEl) errorEl.textContent = message;
}

function validateForm() {
  let valid = true;
  Object.entries(validators).forEach(([name, validate]) => {
    const message = validate(form.elements[name].value);
    setFieldError(name, message);
    if (message) valid = false;
  });
  return valid;
}

form.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("blur", () => {
    if (validators[el.name]) {
      setFieldError(el.name, validators[el.name](el.value));
    }
  });
});

/* ── Storage helpers ─────────────────────────────────────────────── */
const STORAGE_KEY = "workshop_interest_submissions";

function loadSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSubmission(entry) {
  const existing = loadSubmissions();
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function collectFormData() {
  const data = new FormData(form);
  return {
    name: data.get("name")?.trim(),
    email: data.get("email")?.trim(),
    company: data.get("company")?.trim() || "",
    role: data.get("role")?.trim() || "",
    experience: data.get("experience") || "",
    interest: data.get("interest") || "",
    format: data.get("format") || "either",
    seats: data.get("seats") || "1",
    goals: data.get("goals")?.trim() || "",
    updates: data.get("updates") === "on",
    submittedAt: new Date().toISOString(),
  };
}

async function submitToEndpoint(payload) {
  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Submission failed");
}

function showSuccess(email) {
  form.hidden = true;
  successPanel.hidden = false;
  successEmail.textContent = email;
}

function resetForm() {
  form.reset();
  form.hidden = false;
  successPanel.hidden = true;
  Object.keys(validators).forEach((name) => setFieldError(name, ""));
}

registerAnotherBtn.addEventListener("click", resetForm);

/* ── Submit ──────────────────────────────────────────────────────── */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.classList.add("is-loading");
  submitBtn.disabled = true;

  const payload = collectFormData();

  try {
    if (FORM_ENDPOINT) {
      await submitToEndpoint(payload);
    } else {
      await new Promise((r) => setTimeout(r, 600));
      saveSubmission(payload);
    }
    showSuccess(payload.email);
    form.reset();
  } catch {
    alert("Something went wrong. Please try again or email us directly.");
  } finally {
    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;
  }
});
