(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav toggle */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Insights tab filter (Insights page only — no-op elsewhere) */
  var tabs = document.querySelectorAll(".tab-btn");
  var insightCards = document.querySelectorAll("[data-category]");
  if (tabs.length && insightCards.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-pressed", "false"); });
        tab.setAttribute("aria-pressed", "true");
        var cat = tab.dataset.filter;
        insightCards.forEach(function (card) {
          var show = cat === "all" || card.dataset.category === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* Contact form — client-side confirmation only.
     No backend is wired up yet; connect to a real form handler
     (e.g. Formspree, Netlify Forms) before this goes live. */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("formStatus");
      if (status) {
        status.textContent = "Thanks — your message has been noted. (Demo form: connect a real backend before launch.)";
        status.classList.add("visible");
      }
      contactForm.reset();
    });
  }
})();
