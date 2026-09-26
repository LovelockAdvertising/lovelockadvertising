/* Lovelock Advertising v2, shared behaviour for every page */
(function () {
  var header = document.querySelector('.header');
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-nav');

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  }
  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

  // Services dropdown: the Services button toggles it (hover also opens it via CSS)
  var navItem = document.querySelector('.nav__item');
  if (navItem) {
    var navToggle = navItem.querySelector('.nav__toggle');
    function setMenu(open) {
      navItem.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    }
    navToggle.addEventListener('click', function () { setMenu(!navItem.classList.contains('is-open')); });
    navItem.addEventListener('focusout', function (e) { if (!navItem.contains(e.relatedTarget)) setMenu(false); });
    document.addEventListener('click', function (e) { if (!navItem.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navItem.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Testimonials: auto-scroll marquee on desktop, manual swipe on mobile
  var quotes = document.querySelector('.quotes');
  if (quotes) {
    var track = quotes.querySelector('.quotes__track');
    var desktop = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    // Show "Read more" only on cards whose text is clamped
    function checkOverflow() {
      Array.prototype.forEach.call(track.querySelectorAll('.quote:not(.is-expanded)'), function (q) {
        var bq = q.querySelector('blockquote');
        q.querySelector('.quote__toggle').hidden = bq.scrollHeight <= bq.clientHeight + 1;
      });
      // Match every collapsed card to the tallest one
      quotes.style.removeProperty('--quote-h');
      var h = 0;
      Array.prototype.forEach.call(track.querySelectorAll('.quote:not(.is-expanded)'), function (q) {
        h = Math.max(h, q.offsetHeight);
      });
      if (h) quotes.style.setProperty('--quote-h', h + 'px');
    }
    // Mobile: infinite swipe loop. A cloned set sits either side of the real
    // cards; when the swipe settles on a clone we jump silently to its twin.
    var mobile = window.matchMedia('(max-width: 767px)');
    var originals = Array.prototype.slice.call(track.querySelectorAll('.quote'));
    function makeClone(q) {
      var c = q.cloneNode(true);
      c.setAttribute('data-clone', '');
      c.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.tabIndex = -1; });
      return c;
    }
    function centreOn(card) {
      var offset = card.getBoundingClientRect().left - quotes.getBoundingClientRect().left;
      quotes.scrollLeft += offset - (quotes.clientWidth - card.offsetWidth) / 2;
    }
    function setMode() {
      Array.prototype.forEach.call(track.querySelectorAll('[data-clone]'), function (c) { c.remove(); });
      if (desktop.matches) {
        originals.forEach(function (q) { track.appendChild(makeClone(q)); });
      } else if (mobile.matches) {
        originals.forEach(function (q) {
          track.insertBefore(makeClone(q), originals[0]);
          track.appendChild(makeClone(q));
        });
      }
      quotes.classList.toggle('is-marquee', desktop.matches);
      quotes.tabIndex = desktop.matches ? -1 : 0;
      checkOverflow();
      if (mobile.matches) centreOn(originals[0]);
    }
    var settle = null;
    quotes.addEventListener('scroll', function () {
      if (!mobile.matches) return;
      clearTimeout(settle);
      settle = setTimeout(function () {
        // First child is the clone of the first real card, one full set earlier
        var setW = originals[0].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left;
        var mid = quotes.getBoundingClientRect().left + quotes.clientWidth / 2;
        var first = originals[0].getBoundingClientRect();
        var last = originals[originals.length - 1].getBoundingClientRect();
        if (mid < first.left) quotes.scrollLeft += setW;
        else if (mid > last.right) quotes.scrollLeft -= setW;
      }, 140);
    }, { passive: true });
    setMode();
    desktop.addEventListener('change', setMode);
    mobile.addEventListener('change', setMode);
    window.addEventListener('resize', checkOverflow);
    if (document.fonts) document.fonts.ready.then(checkOverflow);

    // Expand/collapse; marquee stays paused while a card is open
    track.addEventListener('click', function (e) {
      var btn = e.target.closest('.quote__toggle');
      if (!btn) return;
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide' : 'Read more';
      btn.closest('.quote').classList.toggle('is-expanded', open);
      quotes.classList.toggle('is-paused', !!track.querySelector('.quote.is-expanded'));
    });
  }

  // Hero client showcase: stacked cards, auto-advance, pause on hover
  var showcase = document.getElementById('showcase');
  if (showcase) {
    var cards = Array.prototype.slice.call(showcase.querySelectorAll('.showcase__card'));
    var total = cards.length, current = 0, timer = null, resumeTimer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var OFFSET = 16, SHRINK = 0.05, DELAY = 4500;

    function layout() {
      cards.forEach(function (card, i) {
        var pos = (i - current + total) % total;
        card.style.transform = 'translateY(' + (pos * OFFSET) + 'px) scale(' + (1 - pos * SHRINK) + ')';
        card.style.zIndex = String(total - pos);
        card.classList.toggle('is-front', pos === 0);
        card.setAttribute('tabindex', pos === 0 ? '0' : '-1');
        card.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
    }
    function go(i) { current = (i + total) % total; layout(); }
    function stop() { clearInterval(timer); clearTimeout(resumeTimer); timer = null; }
    function start() {
      if (reduced) return;
      stop();
      timer = setInterval(function () { go(current + 1); }, DELAY);
    }
    function nudge(delta) { go(current + delta); stop(); resumeTimer = setTimeout(start, 8000); }

    showcase.querySelector('.showcase__btn--prev').addEventListener('click', function () { nudge(-1); });
    showcase.querySelector('.showcase__btn--next').addEventListener('click', function () { nudge(1); });
    cards.forEach(function (card, i) {
      card.addEventListener('click', function (e) {
        if (i !== current) { e.preventDefault(); go(i); }  // back card: bring forward instead of opening
      });
    });
    var stack = showcase.querySelector('.showcase__stack');
    stack.addEventListener('mouseenter', stop);
    stack.addEventListener('mouseleave', start);
    showcase.addEventListener('focusin', stop);
    showcase.addEventListener('focusout', start);

    layout();
    start();
  }
})();
