/* GAVELLI — motion system (≈2 KB, no dependencies).
   1. Reveal: elements with [data-gv-reveal] get .is-in once they enter the viewport.
   2. Header: html.gv-scrolled after the first few pixels of scroll (compact header).
   3. "A day, considered": marks the step in the middle of the viewport as active.
   Parallax and scroll-scale are pure CSS (gavelli-system.css). */
(function () {
  'use strict';
  window.GVMotion = true;

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Reveal */
  var revealIO = null;
  if (hasIO && !reduce && root.classList.contains('gv-motion')) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  } else {
    root.classList.remove('gv-motion');
  }

  function scanReveal(scope) {
    if (!revealIO) return;
    scope.querySelectorAll('[data-gv-reveal]:not(.is-in)').forEach(function (el) {
      revealIO.observe(el);
    });
  }

  /* 2. Header state */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      root.classList.toggle('gv-scrolled', window.scrollY > 24);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 3. Sticky storytelling */
  function initDay(section) {
    if (!hasIO || section.dataset.gvDayReady) return;
    section.dataset.gvDayReady = 'true';
    var steps = section.querySelectorAll('[data-gv-step]');
    var visuals = section.querySelectorAll('[data-gv-visual]');
    var marks = section.querySelectorAll('[data-gv-mark]');

    function activate(index) {
      section.setAttribute('data-active', index);
      steps.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
      visuals.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
      marks.forEach(function (el, i) {
        el.classList.toggle('is-active', i === index);
        if (i === index) { el.setAttribute('aria-current', 'step'); } else { el.removeAttribute('aria-current'); }
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(Array.prototype.indexOf.call(steps, entry.target));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    steps.forEach(function (step) { io.observe(step); });
    activate(0);
  }

  function init(scope) {
    scanReveal(scope);
    scope.querySelectorAll('[data-gv-day]').forEach(initDay);
  }

  init(document);

  /* Theme editor: re-run when a section is added or re-rendered. */
  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
    event.target.querySelectorAll('[data-gv-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  });
})();
