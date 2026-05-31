/* =========================================================================
   LOVELOCK ADVERTISING:Shared JS
   Vanilla, no dependencies.
   ========================================================================= */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. Page-load fade-in
     --------------------------------------------------------------------- */
  document.body.classList.add('is-fading-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.remove('is-fading-in'));
  });

  /* ---------------------------------------------------------------------
     2. Sticky nav scrolled state + active link highlight
     --------------------------------------------------------------------- */
  const nav = document.querySelector('.site-nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active link based on current pathname
  const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('#') || href.startsWith('http')) return;
    const target = href.split('/').pop();
    if (target === currentPath) a.classList.add('is-active');
    // services landing should also highlight when on sub-pages
    if (currentPath.startsWith('services-') && target === 'services.html') {
      a.classList.add('is-active');
    }
  });

  /* ---------------------------------------------------------------------
     3. Mobile menu toggle
     --------------------------------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  const setMobileMenu = (open) => {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (navToggle && mobileMenu) {
    // Inject a dedicated close button inside the menu
    if (!mobileMenu.querySelector('.mobile-menu-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'mobile-menu-close';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      closeBtn.addEventListener('click', () => setMobileMenu(false));
      mobileMenu.insertBefore(closeBtn, mobileMenu.firstChild);
    }

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setMobileMenu(!isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setMobileMenu(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMobileMenu(false);
    });
  }

  /* ---------------------------------------------------------------------
     3b. Services dropdown (desktop):touch tap + Esc + outside click
         (hover/focus reveal is handled by CSS)
     --------------------------------------------------------------------- */
  const dropdownItems = document.querySelectorAll('[data-nav-dropdown]');
  if (dropdownItems.length) {
    const closeAll = () => {
      dropdownItems.forEach((item) => {
        item.classList.remove('is-open');
        const trigger = item.querySelector('[data-dropdown-trigger]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    dropdownItems.forEach((item) => {
      const trigger = item.querySelector('[data-dropdown-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', (e) => {
        // Only intercept the link on touch devices (no hover available)
        if (!window.matchMedia('(hover: none)').matches) return;
        e.preventDefault();
        const isOpen = item.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', (e) => {
      dropdownItems.forEach((item) => {
        if (!item.classList.contains('is-open')) return;
        if (!item.contains(e.target)) {
          item.classList.remove('is-open');
          const trigger = item.querySelector('[data-dropdown-trigger]');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  /* ---------------------------------------------------------------------
     3c. Mobile services accordion
     --------------------------------------------------------------------- */
  const mobileServicesToggle = document.querySelector('.mobile-services-toggle');
  const mobileServicesList = document.getElementById('mobile-services-list');
  if (mobileServicesToggle && mobileServicesList) {
    mobileServicesToggle.addEventListener('click', () => {
      const isOpen = mobileServicesToggle.getAttribute('aria-expanded') === 'true';
      mobileServicesToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      mobileServicesList.classList.toggle('is-open', !isOpen);
    });
  }

  /* ---------------------------------------------------------------------
     4. Reveal-on-scroll (IntersectionObserver)
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------------------------------------------------------------------
     5. Animated stat counters
     --------------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const runCount = (el) => {
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const duration = 1600;
      const start = performance.now();
      const startVal = 0;
      const decimals = (el.getAttribute('data-decimals') || '0') | 0;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = startVal + (target - startVal) * ease(progress);
        el.textContent = value.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals);
      };
      requestAnimationFrame(tick);
    };

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach((el) => {
        const t = parseFloat(el.getAttribute('data-count')) || 0;
        const d = (el.getAttribute('data-decimals') || '0') | 0;
        el.textContent = t.toFixed(d);
      });
    } else {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---------------------------------------------------------------------
     6. Hero parallax (0.5x scroll)
     --------------------------------------------------------------------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !prefersReducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateParallax();
  }

  /* ---------------------------------------------------------------------
     7. Page transitions:fade out on internal nav clicks
     --------------------------------------------------------------------- */
  const isInternal = (href) => {
    if (!href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    return true;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!isInternal(href)) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    document.body.classList.add('is-fading-out');
    setTimeout(() => {
      window.location.href = href;
    }, 280);
  });

  // Bfcache restore:make sure we fade back in
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.classList.remove('is-fading-out');
    }
  });

  /* ---------------------------------------------------------------------
     8. Form validation + inline success
     --------------------------------------------------------------------- */
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach((form) => {
    const setError = (field, on) => field.classList.toggle('has-error', !!on);
    const successEl = form.parentElement.querySelector('.form-success');

    const validate = () => {
      let valid = true;
      form.querySelectorAll('.field').forEach((field) => {
        const input = field.querySelector('input, select, textarea');
        if (!input) return;
        const required = input.hasAttribute('required');
        let isOk = true;
        if (required && !input.value.trim()) isOk = false;
        if (input.type === 'email' && input.value.trim()) {
          isOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        setError(field, !isOk);
        if (!isOk) valid = false;
      });
      return valid;
    };

    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('has-error')) {
          if (input.value.trim()) field.classList.remove('has-error');
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        const firstErr = form.querySelector('.field.has-error input, .field.has-error select, .field.has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }
      form.style.display = 'none';
      if (successEl) {
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* ---------------------------------------------------------------------
     9. Current year in footer
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------------
     10. Typographic hero:scramble reveal, cursor parallax, CTA underline
     --------------------------------------------------------------------- */
  (function initTypographicHero() {
    const heroEl = document.querySelector('.hero-typographic');
    if (!heroEl) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // -- Scramble each [data-scramble] element with stagger
    function scrambleOne(el, delay, duration) {
      const finalText = el.textContent;
      const len = finalText.length;
      const start = performance.now() + delay;

      function frame(now) {
        if (now < start) {
          requestAnimationFrame(frame);
          return;
        }
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const settled = Math.floor(progress * len);

        let output = '';
        for (let i = 0; i < len; i++) {
          const ch = finalText[i];
          if (i < settled || ch === ' ' || ch === '.' || ch === ',' || ch === "'") {
            output += ch;
          } else if (/[a-zA-Z]/.test(ch)) {
            const r = scrambleChars[(Math.random() * 26) | 0];
            output += ch === ch.toUpperCase() ? r : r.toLowerCase();
          } else {
            output += ch;
          }
        }
        el.textContent = output;

        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = finalText;
      }
      requestAnimationFrame(frame);
    }

    const scrambleEls = heroEl.querySelectorAll('[data-scramble]');
    if (!reducedMotion) {
      scrambleEls.forEach((el, i) => scrambleOne(el, 120 + i * 220, 700));
    }

    // -- Cursor parallax via CSS custom properties (--tx, --ty)
    const layers = heroEl.querySelectorAll('[data-depth]');
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let raf = null;

    function step() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      layers.forEach((layer) => {
        const depth = parseFloat(layer.getAttribute('data-depth')) || 1;
        layer.style.setProperty('--tx', `${(currentX * depth * 18).toFixed(2)}px`);
        layer.style.setProperty('--ty', `${(currentY * depth * 6).toFixed(2)}px`);
      });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    }

    const supportsHover = window.matchMedia('(hover: hover)').matches;
    if (!reducedMotion && supportsHover) {
      heroEl.addEventListener('mousemove', (e) => {
        const rect = heroEl.getBoundingClientRect();
        targetX = (e.clientX - rect.left) / rect.width - 0.5;
        targetY = (e.clientY - rect.top) / rect.height - 0.5;
        if (!raf) raf = requestAnimationFrame(step);
      });
      heroEl.addEventListener('mouseleave', () => {
        targetX = 0; targetY = 0;
        if (!raf) raf = requestAnimationFrame(step);
      });
    }

    // -- CTA underline reveal after scramble finishes (legacy bottom-left CTA)
    const cta = heroEl.querySelector('.hero-cta');
    if (cta) {
      const totalDelay = reducedMotion ? 200 : (120 + scrambleEls.length * 220 + 800);
      setTimeout(() => cta.classList.add('is-revealed'), totalDelay);
    }

    // -- Prominent centred CTA:magnetic pull + spotlight tracking
    const promoBtn = heroEl.querySelector('.hero-cta-prominent');
    if (promoBtn && !reducedMotion && supportsHover) {
      const radius = 160;       // pixels:how close the cursor has to get
      const strength = 0.35;    // 0..1:how far the button drifts toward cursor
      let pTargetX = 0, pTargetY = 0;
      let pCurrentX = 0, pCurrentY = 0;
      let pRaf = null;

      function promoStep() {
        pCurrentX += (pTargetX - pCurrentX) * 0.18;
        pCurrentY += (pTargetY - pCurrentY) * 0.18;
        promoBtn.style.setProperty('--magnet-x', `${pCurrentX.toFixed(2)}px`);
        promoBtn.style.setProperty('--magnet-y', `${pCurrentY.toFixed(2)}px`);

        if (Math.abs(pTargetX - pCurrentX) > 0.1 || Math.abs(pTargetY - pCurrentY) > 0.1) {
          pRaf = requestAnimationFrame(promoStep);
        } else {
          pRaf = null;
        }
      }

      window.addEventListener('mousemove', (e) => {
        const rect = promoBtn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const falloff = 1 - dist / radius;
          pTargetX = dx * strength * falloff;
          pTargetY = dy * strength * falloff;
        } else {
          pTargetX = 0;
          pTargetY = 0;
        }

        // Spotlight position relative to the button face
        const localX = ((e.clientX - rect.left) / rect.width) * 100;
        const localY = ((e.clientY - rect.top) / rect.height) * 100;
        promoBtn.style.setProperty('--mx', `${localX}%`);
        promoBtn.style.setProperty('--my', `${localY}%`);

        if (!pRaf) pRaf = requestAnimationFrame(promoStep);
      }, { passive: true });

      // Snap back when cursor leaves the page
      document.addEventListener('mouseleave', () => {
        pTargetX = 0; pTargetY = 0;
        if (!pRaf) pRaf = requestAnimationFrame(promoStep);
      });
    }
  })();

  /* ---------------------------------------------------------------------
     11. Service discipline cards:interactive 3D cursor tilt
     --------------------------------------------------------------------- */
  (function initServiceCardTilt() {
    const cards = document.querySelectorAll('.service-grid .service-card');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const MAX = 9;        // max tilt, degrees
    const LIFT = -12;     // hover lift, px (matches the CSS :hover fallback)
    const SCALE = 1.045;

    cards.forEach((card) => {
      let raf = null;
      let lastEvent = null;

      // The .reveal stagger sets a transition-delay on cards 2-4, which would
      // freeze the per-frame tilt updates. Zero it on first hover (the entrance
      // reveal has long finished by the time anyone hovers a card).
      card.addEventListener('mouseenter', () => {
        card.style.transitionDelay = '0s';
      });

      card.addEventListener('mousemove', (e) => {
        lastEvent = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (lastEvent.clientX - rect.left) / rect.width - 0.5;
          const py = (lastEvent.clientY - rect.top) / rect.height - 0.5;
          const rx = (py * MAX * 2).toFixed(2);   // tilt the face toward the cursor
          const ry = (-px * MAX * 2).toFixed(2);
          card.style.transform =
            `translateY(${LIFT}px) scale(${SCALE}) rotateX(${rx}deg) rotateY(${ry}deg)`;
          raf = null;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.transform = '';   // hand control back to CSS
      });
    });
  })();

  /* ---------------------------------------------------------------------
     11b. Founders stage: cursor parallax across layered composition
     Photo tilts toward cursor; ghost word drifts opposite for depth;
     orb glides slightly with the cursor. Stage exposes --fx, --fy.
     --------------------------------------------------------------------- */
  (function initFounderStage() {
    const stages = document.querySelectorAll('[data-founder-stage]');
    if (!stages.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    stages.forEach((stage) => {
      let raf = null;
      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;

      function step() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        stage.style.setProperty('--fx', currentX.toFixed(3));
        stage.style.setProperty('--fy', currentY.toFixed(3));
        if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
          raf = requestAnimationFrame(step);
        } else {
          raf = null;
        }
      }

      stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        targetX = (e.clientX - rect.left) / rect.width - 0.5;
        targetY = (e.clientY - rect.top) / rect.height - 0.5;
        if (!raf) raf = requestAnimationFrame(step);
      });

      stage.addEventListener('mouseleave', () => {
        targetX = 0; targetY = 0;
        if (!raf) raf = requestAnimationFrame(step);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     12. Animated grid backdrop:ambient drift + cursor ripples
     One fixed canvas behind the whole site; dark sections are transparent.
     --------------------------------------------------------------------- */
  (function initGridBackdrop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = document.createElement('canvas');
    canvas.className = 'bg-grid';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRID = 80;                       // grid cell, px
    const STEP = 26;                       // polyline segment length, px
    const STROKE = 'rgba(248, 248, 248, '; // line colour prefix
    const BASE_ALPHA = 0.05;

    let dpr = 1, vw = 0, vh = 0;

    /* --- ambient glows: rendered once to an offscreen layer, blitted each frame --- */
    const glowLayer = document.createElement('canvas');
    const glowCtx = glowLayer.getContext('2d');
    const GLOWS = [
      { fx: 0.15, fy: 0.18, r: 270, a: 0.10 },
      { fx: 0.88, fy: 0.72, r: 310, a: 0.085 },
      { fx: 0.62, fy: 0.44, r: 200, a: 0.05 }
    ];
    function renderGlows() {
      glowLayer.width = canvas.width;
      glowLayer.height = canvas.height;
      glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowCtx.clearRect(0, 0, vw, vh);
      for (let i = 0; i < GLOWS.length; i++) {
        const g = GLOWS[i];
        const cx = g.fx * vw, cy = g.fy * vh;
        const grad = glowCtx.createRadialGradient(cx, cy, 0, cx, cy, g.r);
        grad.addColorStop(0, 'rgba(199, 249, 75, ' + g.a + ')');
        grad.addColorStop(1, 'rgba(199, 249, 75, 0)');
        glowCtx.fillStyle = grad;
        glowCtx.fillRect(cx - g.r, cy - g.r, g.r * 2, g.r * 2);
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGlows();
      if (reduced) drawStatic();
    }

    /* --- cursor ripples --- */
    const ripples = [];
    const LIFE = 2800;    // ms a ripple lives
    const SPEED = 0.30;   // wavefront expansion, px per ms
    const BAND = 80;      // wavefront thickness
    const AMP = 6;        // max grid-line displacement, px
    let lastX = -999, lastY = -999;

    function spawn(x, y) {
      ripples.push({ x: x, y: y, t0: performance.now() });
      if (ripples.length > 4) ripples.shift();
    }
    if (!reduced) {
      window.addEventListener('mousemove', (e) => {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (dx * dx + dy * dy > 120 * 120) {   // needs a much bigger move before spawning
          lastX = e.clientX; lastY = e.clientY;
          spawn(e.clientX, e.clientY);
        }
      }, { passive: true });
      window.addEventListener('mousedown', (e) => spawn(e.clientX, e.clientY), { passive: true });
      window.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (t) spawn(t.clientX, t.clientY);
      }, { passive: true });
    }

    /* accumulated radial displacement at a point from every live ripple */
    const tmp = [0, 0];
    function displace(px, py, now) {
      let ox = 0, oy = 0;
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const age = now - r.t0;
        if (age > LIFE) continue;
        const radius = age * SPEED;
        const dx = px - r.x, dy = py - r.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const b = (d - radius) / BAND;
        if (b < -3 || b > 3) continue;            // skip points away from the wavefront
        const w = Math.exp(-b * b) * AMP * (1 - age / LIFE);
        ox += (dx / d) * w;
        oy += (dy / d) * w;
      }
      tmp[0] = ox; tmp[1] = oy;
    }

    function drawGrid(now) {
      ctx.clearRect(0, 0, vw, vh);
      const dxo = Math.sin(now * 0.00007) * 16;   // slow ambient drift
      const dyo = Math.cos(now * 0.00009) * 14;
      ctx.drawImage(glowLayer, dxo, dyo, vw, vh); // ambient glows drift behind the grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = STROKE + BASE_ALPHA + ')';

      for (let gx = -GRID; gx <= vw + GRID; gx += GRID) {
        ctx.beginPath();
        for (let y = -GRID; y <= vh + GRID; y += STEP) {
          const bx = gx + dxo, by = y + dyo;
          displace(bx, by, now);
          if (y === -GRID) ctx.moveTo(bx + tmp[0], by + tmp[1]);
          else ctx.lineTo(bx + tmp[0], by + tmp[1]);
        }
        ctx.stroke();
      }
      for (let gy = -GRID; gy <= vh + GRID; gy += GRID) {
        ctx.beginPath();
        for (let x = -GRID; x <= vw + GRID; x += STEP) {
          const bx = x + dxo, by = gy + dyo;
          displace(bx, by, now);
          if (x === -GRID) ctx.moveTo(bx + tmp[0], by + tmp[1]);
          else ctx.lineTo(bx + tmp[0], by + tmp[1]);
        }
        ctx.stroke();
      }

      // faint expanding wavefront ring + cull dead ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = now - r.t0;
        if (age > LIFE) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(r.x, r.y, age * SPEED, 0, Math.PI * 2);
        ctx.strokeStyle = STROKE + (0.04 * (1 - age / LIFE)) + ')';
        ctx.stroke();
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, vw, vh);
      ctx.drawImage(glowLayer, 0, 0, vw, vh);
      ctx.lineWidth = 1;
      ctx.strokeStyle = STROKE + BASE_ALPHA + ')';
      ctx.beginPath();
      for (let gx = 0; gx <= vw; gx += GRID) { ctx.moveTo(gx, 0); ctx.lineTo(gx, vh); }
      for (let gy = 0; gy <= vh; gy += GRID) { ctx.moveTo(0, gy); ctx.lineTo(vw, gy); }
      ctx.stroke();
    }

    function loop() {
      drawGrid(performance.now());
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    if (!reduced) requestAnimationFrame(loop);
  })();
})();
