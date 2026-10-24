/* Grow Digital UK — main.js
   Loaded in <head> without defer so the "js" class is set before first paint.
   Everything else waits for the DOM. The site works fully without this file. */

document.documentElement.classList.add('js');

var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', function () {
  try {
    initNav();
    initHeader();
    initReveal();
    initSlideshow();
    initCountUp();
    initWhatsApp();
    initForms();
  } catch (err) {
    // If anything goes wrong, make sure nothing is left hidden.
    document.documentElement.classList.remove('reveal-on');
    if (window.console) console.error(err);
  }
});

/* ---------- Mobile navigation ---------- */

function initNav() {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  function setOpen(open, returnFocus) {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('menu-open', open);
    if (!open && returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('nav-open'));
  });

  // Close when any menu link is tapped
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) {
      setOpen(false, true);
    }
  });

  // Close when tapping outside the header
  document.addEventListener('click', function (e) {
    if (header.classList.contains('nav-open') && !header.contains(e.target)) {
      setOpen(false);
    }
  });

  // Close if the screen is resized up to desktop
  var desktop = window.matchMedia('(min-width: 1080px)');
  var onChange = function () { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  else if (desktop.addListener) desktop.addListener(onChange);
}

/* ---------- Header: solid with a soft shadow once the page scrolls ---------- */

function initHeader() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var update = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------- Scroll reveal (optional, respects reduced motion) ---------- */

function initReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (reducedMotion || !('IntersectionObserver' in window)) return; // content simply stays visible

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  // Anything already on screen is shown straight away, so nothing flickers.
  var vh = window.innerHeight || document.documentElement.clientHeight;
  items.forEach(function (el) {
    if (el.getBoundingClientRect().top < vh) el.classList.add('is-visible');
    else observer.observe(el);
  });

  document.documentElement.classList.add('reveal-on');

  // Safety net: show everything after 4 seconds regardless.
  setTimeout(function () {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }, 4000);
}

/* ---------- Hero slideshow: crossfade the laptop and phone together every 4 seconds ---------- */

function initSlideshow() {
  var shows = document.querySelectorAll('[data-slideshow]');
  if (!shows.length || reducedMotion) return; // first slide simply stays on screen

  shows.forEach(function (show) {
    var groups = show.querySelectorAll('.slides');
    var count = groups[0].children.length;
    var index = 0;
    var onScreen = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
      }).observe(show);
    }

    setInterval(function () {
      if (!onScreen || document.hidden) return;
      var next = (index + 1) % count;
      groups.forEach(function (group) {
        var current = group.children[index];
        current.classList.remove('is-active');
        current.classList.add('is-leaving');
        setTimeout(function () { current.classList.remove('is-leaving'); }, 950);
        group.children[next].classList.add('is-active');
      });
      index = next;
    }, 4000);
  });
}

/* ---------- Count prices up once when they scroll into view ---------- */

function initCountUp() {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length || reducedMotion || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      var el = entry.target;
      var end = parseInt(el.getAttribute('data-count'), 10);
      var start = null;
      // The real number is already in the page; it's only replaced once animation frames run.
      function step(time) {
        if (start === null) start = time;
        var progress = Math.min((time - start) / 1200, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = progress < 1 ? Math.round(end * eased) : end;
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
      // Safety net: always end on the real price, even if animation frames are paused.
      setTimeout(function () { el.textContent = end; }, 1500);
    });
  }, { threshold: 0.6 });

  els.forEach(function (el) { observer.observe(el); });
}

/* ---------- WhatsApp button: hide when it would cover a button or form field ---------- */

function initWhatsApp() {
  var wa = document.querySelector('.wa-float');
  if (!wa) return;

  var selector = '.btn, button:not(.wa-float), input:not([type="hidden"]), select, textarea, summary, .nav-toggle, .service-picker a, a.card, .concept-tile';
  var ticking = false;

  function overlaps(a, b) {
    return !(b.right < a.left || b.left > a.right || b.bottom < a.top || b.top > a.bottom);
  }

  function check() {
    ticking = false;
    var menuOpen = document.documentElement.classList.contains('menu-open');
    var focused = document.activeElement && document.activeElement.matches &&
      document.activeElement.matches('input, select, textarea');

    // Measure from the centre so the check is the same whether or not the
    // button is currently scaled down; add a little breathing room.
    var r = wa.getBoundingClientRect();
    var cx = (r.left + r.right) / 2;
    var cy = (r.top + r.bottom) / 2;
    var half = 28 + 8;
    var box = { left: cx - half, right: cx + half, top: cy - half, bottom: cy + half };

    var covering = false;
    if (!menuOpen && !focused) {
      var els = document.querySelectorAll(selector);
      for (var i = 0; i < els.length; i++) {
        var er = els[i].getBoundingClientRect();
        if (er.width === 0 && er.height === 0) continue;
        if (er.bottom < box.top || er.top > box.bottom) continue;
        if (overlaps(box, er)) { covering = true; break; }
      }
    }

    wa.classList.toggle('is-hidden', menuOpen || focused || covering);
  }

  function schedule() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(check);
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', function () { setTimeout(schedule, 50); });
  document.addEventListener('click', function () { setTimeout(schedule, 50); });
  check();
}

/* ---------- Contact form (Formspree). Without JS the form posts normally. ---------- */

function initForms() {
  var forms = document.querySelectorAll('form[data-formspree]');
  if (!forms.length || !window.fetch || !window.FormData) return;

  forms.forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) return; // let the browser show its own messages
      e.preventDefault();

      var original = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      if (status) { status.textContent = ''; status.className = 'form-status'; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          if (status) {
            status.textContent = 'Thanks — your message has been sent. We reply within 24 hours.';
            status.className = 'form-status success';
          }
        } else {
          throw new Error('Form error');
        }
      }).catch(function () {
        if (status) {
          status.textContent = 'Sorry, something went wrong. Please email info@growdigitaluk.com or message us on WhatsApp.';
          status.className = 'form-status error';
        }
      }).then(function () {
        if (button) { button.disabled = false; button.textContent = original; }
        if (status) status.focus();
      });
    });
  });
}
