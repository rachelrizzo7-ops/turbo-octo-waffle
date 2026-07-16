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

  /* Scroll pathway rail + mobile progress bar */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var ticks = document.querySelectorAll("#railTicks li");
  var railFill = document.getElementById("railFill");
  var mobileFill = document.getElementById("mobileProgressFill");

  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

    if (railFill) railFill.style.height = pct + "%";
    if (mobileFill) mobileFill.style.width = pct + "%";

    var current = sections[0];
    var triggerLine = window.innerHeight * 0.4;
    sections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      if (rect.top <= triggerLine) current = sec;
    });

    ticks.forEach(function (tick) {
      tick.classList.toggle("active", current && tick.dataset.target === current.id);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  ticks.forEach(function (tick) {
    tick.style.pointerEvents = "auto";
    tick.style.cursor = "pointer";
    tick.addEventListener("click", function () {
      var target = document.getElementById(tick.dataset.target);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* Audience-aware contact CTAs: clicking a "Health Systems" or "Partners"
     link scrolls to #contact and highlights the matching mailto button. */
  var ctaHealth = document.getElementById("ctaHealth");
  var ctaPartner = document.getElementById("ctaPartner");

  document.querySelectorAll("[data-audience]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var audience = link.dataset.audience;
      var target = document.getElementById("contact");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        var focusBtn = audience === "health" ? ctaHealth : ctaPartner;
        if (focusBtn) {
          [ctaHealth, ctaPartner].forEach(function (b) { if (b) b.style.transform = ""; });
          window.setTimeout(function () {
            focusBtn.style.transform = "scale(1.04)";
            focusBtn.focus({ preventScroll: true });
          }, reduceMotion ? 0 : 500);
        }
      }
    });
  });
})();
