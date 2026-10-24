/* Grow Digital UK — main.js
   Loaded in <head> without defer so the "js" class is set before first paint.
   Everything else waits for the DOM. The site works fully without this file. */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  try {
    initNav();
    initReveal();
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

/* ---------- Scroll reveal (optional, respects reduced motion) ---------- */

function initReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return; // content simply stays visible

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

/* ---------- WhatsApp button: hide when it would cover a button or form field ---------- */

function initWhatsApp() {
  var wa = document.querySelector('.wa-float');
  if (!wa) return;

  var selector = '.btn, button:not(.wa-float), input:not([type="hidden"]), select, textarea, summary, .nav-toggle, .service-picker a, a.card';
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
