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
    initAiDemo();
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

/* ---------- Hero slideshow: AI assistants, Websites, Social media on the laptop and phone ----------
   Each slide shows for 5 seconds with the same crossfade. The pills under the devices show the
   active slide and jump to one when clicked. With reduced motion nothing rotates or types. */

function initSlideshow() {
  var show = document.querySelector('[data-slideshow]');
  if (!show) return;

  var groups = show.querySelectorAll('.slides');
  var pills = document.querySelectorAll('[data-slide-to]');
  var count = groups[0].children.length;
  var index = 0;
  var onScreen = true;
  var timer = null;
  var typing = [];

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
    }).observe(show);
  }

  function slidesAt(n) {
    var list = [];
    groups.forEach(function (group) { list.push(group.children[n]); });
    return list;
  }

  // The website slide shows a different concept each time round.
  function nextConcept(n) {
    slidesAt(n).forEach(function (slide) {
      var cycle = slide.querySelector('.concept-cycle');
      if (!cycle) return;
      var items = cycle.children;
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('is-current')) {
          items[i].classList.remove('is-current');
          items[(i + 1) % items.length].classList.add('is-current');
          break;
        }
      }
    });
  }

  // The AI slide: client email shows, the reply types itself out, then the tag appears.
  function playTyping(n) {
    typing.forEach(clearTimeout);
    typing = [];
    if (reducedMotion) return;
    var slides = slidesAt(n).map(function (slide) { return slide.querySelector('.hs-ai'); }).filter(Boolean);
    if (!slides.length) return;
    var outs = slides.map(function (ai) { return ai.querySelector('[data-type]'); });
    outs.forEach(function (out) {
      if (!out.hasAttribute('data-full')) out.setAttribute('data-full', out.textContent);
      out.textContent = '';
    });
    slides.forEach(function (ai) { ai.classList.remove('is-typing'); ai.classList.add('is-waiting'); });

    var words = outs[0].getAttribute('data-full').split(/( )/);
    var shown = 0;
    typing.push(setTimeout(function step() {
      slides.forEach(function (ai) { ai.classList.remove('is-waiting'); ai.classList.add('is-typing'); });
      shown = Math.min(shown + 2, words.length);
      var text = words.slice(0, shown).join('');
      outs.forEach(function (out) { out.textContent = text; });
      if (shown < words.length) typing.push(setTimeout(step, 50));
      else typing.push(setTimeout(function () {
        slides.forEach(function (ai) { ai.classList.remove('is-typing'); });
      }, 250));
    }, 700));
  }

  function go(next) {
    if (next === index) return;
    var leaving = index;
    groups.forEach(function (group) {
      var current = group.children[leaving];
      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      setTimeout(function () { current.classList.remove('is-leaving'); }, 950);
      group.children[next].classList.add('is-active');
    });
    if (slidesAt(leaving)[0].querySelector('.concept-cycle')) {
      setTimeout(function () { nextConcept(leaving); }, 950); // swap while it's out of sight
    }
    index = next;
    pills.forEach(function (pill, i) {
      pill.classList.toggle('is-active', i === next);
      pill.setAttribute('aria-pressed', i === next ? 'true' : 'false');
    });
    playTyping(next);
  }

  function schedule() {
    clearTimeout(timer);
    if (reducedMotion) return;
    timer = setTimeout(function () {
      if (!onScreen || document.hidden) { schedule(); return; }
      go((index + 1) % count);
      schedule();
    }, 5000);
  }

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      go(parseInt(pill.getAttribute('data-slide-to'), 10));
      schedule(); // restart the 5 seconds from the click
    });
  });

  playTyping(0);
  schedule();
}

/* ---------- AI assistant demo: email arrives, reply types itself, tag appears, next example ---------- */

function initAiDemo() {
  var demos = document.querySelectorAll('[data-ai-demo]');
  if (!demos.length || reducedMotion) return; // the first example simply shows complete

  demos.forEach(function (demo) {
    var examples = demo.querySelectorAll('.ai-ex');
    var dots = demo.querySelectorAll('.ai-demo-steps span');
    var title = demo.querySelector('.ai-demo-title');
    var index = 0;
    var onScreen = true;
    var timers = [];

    // Remember each full reply, then hide replies until they are typed.
    examples.forEach(function (ex) {
      var out = ex.querySelector('[data-type]');
      out.setAttribute('data-full', out.textContent);
    });
    demo.classList.add('is-animated');

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
      }).observe(demo);
    }

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function play(n) {
      timers.forEach(clearTimeout);
      timers = [];
      examples.forEach(function (ex, i) {
        ex.classList.toggle('is-active', i === n);
        ex.classList.remove('is-typing', 'is-done');
      });
      dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === n); });
      var ex = examples[n];
      if (title) title.textContent = ex.getAttribute('data-title');

      var out = ex.querySelector('[data-type]');
      var words = out.getAttribute('data-full').split(/( |\n)/);
      var shown = 0;
      out.textContent = '';

      later(function () {
        ex.classList.add('is-typing');
        (function typeNext() {
          // Add one word (plus the space or line break after it) at a time.
          shown = Math.min(shown + 2, words.length);
          out.textContent = words.slice(0, shown).join('');
          if (shown < words.length) later(typeNext, 55);
          else later(function () {
            ex.classList.remove('is-typing');
            ex.classList.add('is-done');
          }, 250);
        })();
      }, 900);

      later(next, 10000);
    }

    function next() {
      // Wait while the demo is off screen or the tab is hidden, then carry on.
      if (!onScreen || document.hidden) { later(next, 1000); return; }
      index = (index + 1) % examples.length;
      play(index);
    }

    play(0);
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
      var finished = false;
      // The real number is already in the page; it's only replaced once animation frames run.
      function step(time) {
        if (finished) return;
        if (start === null) start = time;
        var progress = Math.min((time - start) / 1200, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = progress < 1 ? Math.round(end * eased) : end;
        if (progress < 1) window.requestAnimationFrame(step);
        else finished = true;
      }
      window.requestAnimationFrame(step);
      // Safety net: always end on the real price, even if animation frames are slow or paused.
      setTimeout(function () { finished = true; el.textContent = end; }, 1500);
    });
  }, { threshold: 0.6 });

  els.forEach(function (el) { observer.observe(el); });
}

/* ---------- WhatsApp button: hide when it would cover a button, form field or text ---------- */

function initWhatsApp() {
  var wa = document.querySelector('.wa-float');
  if (!wa) return;

  var selector = '.btn, button:not(.wa-float), input:not([type="hidden"]), select, textarea, summary, .nav-toggle, .service-picker a, a.card, .concept-tile';
  // Text is checked line by line, so the button can still show in the gaps beside short lines.
  // The animated hero devices are pictures, not reading text, so they're skipped.
  var textSelector = 'main p, main li, main h1, main h2, main h3, main dt, main dd, main th, main td, main caption, .site-footer p, .site-footer li';
  var ticking = false;
  var range = document.createRange();

  function overlaps(a, b) {
    return !(b.right < a.left || b.left > a.right || b.bottom < a.top || b.top > a.bottom);
  }

  function coversText(box) {
    var els = document.querySelectorAll(textSelector);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var er = el.getBoundingClientRect();
      if (er.bottom < box.top || er.top > box.bottom || er.right < box.left || er.left > box.right) continue;
      if (el.closest('.devices, .ai-demo, .marquee, [aria-hidden="true"]')) continue;
      range.selectNodeContents(el);
      var lines = range.getClientRects();
      for (var j = 0; j < lines.length; j++) {
        if (lines[j].width > 0 && overlaps(box, lines[j])) return true;
      }
    }
    return false;
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
    var half = wa.offsetWidth / 2 + 6;
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
      if (!covering) covering = coversText(box);
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
