document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation toggle
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("nav-open", !expanded);
    });
  }

  // Client-side validation and submit feedback for forms
  document.querySelectorAll("form[data-validate]").forEach(form => {
    form.addEventListener("submit", event => {
      let valid = true;
      form.querySelectorAll("[required]").forEach(field => {
        const value = String(field.value || "").trim();
        const badEmail = field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const badPassword = field.name === "password" && value && value.length < 8;
        const badNumber = field.type === "number" && value && Number(value) < Number(field.min || 0);
        field.classList.toggle("field-error", !value || badEmail || badPassword || badNumber);
        if (!value || badEmail || badPassword || badNumber) valid = false;
      });
      const note = form.querySelector("[data-form-message]");
      if (!valid) {
        event.preventDefault();
        if (note) {
          note.textContent = "Please check the highlighted fields. Passwords must be at least 8 characters.";
          note.classList.add("form-message-error");
        }
      } else if (note) {
        note.textContent = "Submitting…";
        note.classList.remove("form-message-error");
      }
    });
  });

  // Search/filter service cards
  const search = document.querySelector("[data-service-search]");
  const cards = [...document.querySelectorAll("[data-service-card]")];
  if (search && cards.length) {
    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      cards.forEach(card => {
        card.hidden = !card.textContent.toLowerCase().includes(term);
      });
    });
  }

  // Confirm destructive actions
  document.querySelectorAll("form[data-confirm]").forEach(form => {
    form.addEventListener("submit", event => {
      if (!window.confirm(form.dataset.confirm || "Are you sure you want to continue?")) {
        event.preventDefault();
      }
    });
  });

  // Kenya shilling formatting for price labels
  document.querySelectorAll("[data-kes]").forEach(el => {
    const amount = Number(el.dataset.kes);
    if (Number.isFinite(amount)) {
      el.textContent = new Intl.NumberFormat("en-KE", {
        style: "currency", currency: "KES", maximumFractionDigits: 2
      }).format(amount);
    }
  });
});
