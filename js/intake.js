/* =========================================================================
   LOVELOCK ADVERTISING:Intake Modal
   Multi-step lead qualification quiz. Vanilla, no deps.

   ⚠️  Before going live: replace YOUR_FORMSPREE_ID with the real Formspree
       form ID (see https://formspree.io). Endpoint becomes
       https://formspree.io/f/<id>.
   ========================================================================= */
(function () {
  'use strict';

  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORMSPREE_ID';
  const FALLBACK_EMAIL = 'hello@lovelockadvertising.com';

  /* ---------------------------------------------------------------------
     Quiz definition:single source of truth for screens, copy, options
     --------------------------------------------------------------------- */
  const QUESTIONS = [
    {
      key: 'service_interest',
      question: 'What are you most interested in right now?',
      options: [
        { key: 'A', label: 'Google Ads' },
        { key: 'B', label: 'SEO' },
        { key: 'C', label: 'Meta / Facebook & Instagram Ads' },
        { key: 'D', label: 'Website Design' },
        { key: 'E', label: 'Not sure yet' }
      ]
    },
    {
      key: 'business_goal',
      question: "What's your #1 goal over the next 6 months?",
      options: [
        { key: 'A', label: 'Get more leads consistently' },
        { key: 'B', label: 'Lower my cost per lead' },
        { key: 'C', label: 'Build my online presence from scratch' },
        { key: 'D', label: 'Scale what’s already working' },
        { key: 'E', label: 'Other', custom: true }
      ]
    },
    {
      key: 'monthly_budget',
      question: "What's your monthly marketing budget?",
      options: [
        { key: 'A', label: 'Under $1,000/month' },
        { key: 'B', label: '$1,000 – $3,000/month' },
        { key: 'C', label: '$3,000 – $5,000/month' },
        { key: 'D', label: '$5,000+/month' }
      ]
    },
    {
      key: 'current_client_source',
      question: 'How are you currently getting most of your clients?',
      options: [
        { key: 'A', label: 'Word of mouth / referrals' },
        { key: 'B', label: 'Running ads (Google or Meta)' },
        { key: 'C', label: 'Organic / social media' },
        { key: 'D', label: "I'm not getting clients consistently" },
        { key: 'E', label: 'Other', custom: true }
      ]
    },
    {
      key: 'industry',
      question: 'What industry are you in?',
      input: { placeholder: 'e.g. Plumbing, Real Estate, Gym, Law...' }
    }
  ];

  // Total screens: intro (1) + questions (5) + contact (1) + thanks (1) = 8 (0..7)
  const TOTAL_SCREENS = 1 + QUESTIONS.length + 2;

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const state = {
    current: 0,
    answers: {},
    submitting: false,
    submitted: false,
    lastFocus: null
  };

  /* ---------------------------------------------------------------------
     DOM refs (populated after build)
     --------------------------------------------------------------------- */
  let modal, stage, progressFill, screens, errorEl, submitBtn;

  /* ---------------------------------------------------------------------
     Build the modal markup once on first open
     --------------------------------------------------------------------- */
  function buildModal() {
    if (document.getElementById('intake-modal')) return;

    modal = document.createElement('div');
    modal.id = 'intake-modal';
    modal.className = 'intake-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'intake-headline');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="intake-progress" aria-hidden="true">
        <div class="intake-progress-fill" data-progress-fill></div>
      </div>
      <button type="button" class="intake-close" aria-label="Close intake" data-intake-close>&times;</button>
      <div class="intake-stage" data-intake-stage></div>
    `;

    document.body.appendChild(modal);

    stage = modal.querySelector('[data-intake-stage]');
    progressFill = modal.querySelector('[data-progress-fill]');

    renderScreens();

    screens = modal.querySelectorAll('.intake-screen');

    // Close handlers
    modal.querySelector('[data-intake-close]').addEventListener('click', closeModal);
  }

  function renderScreens() {
    const parts = [];

    // Screen 0:intro
    parts.push(`
      <div class="intake-screen" data-screen="0">
        <span class="intake-eyebrow">Free Growth Session · 30 Min</span>
        <h2 class="intake-headline" id="intake-headline">Let's Book Your Free Growth Session.</h2>
        <p class="intake-sub">Five quick questions so we walk into the call ready to talk about your business, not a generic pitch. Takes about 60 seconds.</p>
        <button type="button" class="intake-btn" data-intake-next>
          Let's Go <span class="arrow" aria-hidden="true">→</span>
        </button>
        <span class="intake-cta-note">⏱ 60 seconds · No obligation · Real strategy, not a sales call</span>
      </div>
    `);

    // Screens 1..N:questions
    QUESTIONS.forEach((q, idx) => {
      const screenIndex = idx + 1;
      if (q.options) {
        const optionsHtml = q.options.map((opt) => `
          <button type="button" class="intake-option${opt.custom ? ' intake-option--custom' : ''}" data-option-key="${opt.key}" data-option-label="${escapeAttr(opt.label)}"${opt.custom ? ' data-option-custom="true"' : ''}>
            <span class="intake-option-key">${opt.key}</span>
            <span class="intake-option-label">${escapeHtml(opt.label)}</span>
          </button>
        `).join('');

        const hasCustom = q.options.some((o) => o.custom);
        const customHtml = hasCustom ? `
            <div class="intake-custom" data-custom-input hidden>
              <input type="text" data-custom-text placeholder="Tell us more..." autocomplete="off" />
              <button type="button" class="intake-btn intake-btn--inline" data-custom-next>
                Next <span class="arrow" aria-hidden="true">→</span>
              </button>
            </div>` : '';

        parts.push(`
          <div class="intake-screen" data-screen="${screenIndex}" data-question-key="${q.key}">
            <span class="intake-eyebrow">Question ${screenIndex} of ${QUESTIONS.length}</span>
            <h2 class="intake-question">${escapeHtml(q.question)}</h2>
            <div class="intake-options" data-options-container>${optionsHtml}</div>${customHtml}
          </div>
        `);
      } else if (q.input) {
        parts.push(`
          <div class="intake-screen" data-screen="${screenIndex}" data-question-key="${q.key}">
            <span class="intake-eyebrow">Question ${screenIndex} of ${QUESTIONS.length}</span>
            <h2 class="intake-question">${escapeHtml(q.question)}</h2>
            <div class="intake-field-single">
              <input type="text" data-text-input placeholder="${escapeAttr(q.input.placeholder)}" autocomplete="off" />
            </div>
            <button type="button" class="intake-btn" data-text-next>
              Next <span class="arrow" aria-hidden="true">→</span>
            </button>
          </div>
        `);
      }
    });

    // Contact screen (TOTAL_SCREENS - 2)
    const contactIndex = TOTAL_SCREENS - 2;
    parts.push(`
      <div class="intake-screen" data-screen="${contactIndex}">
        <span class="intake-eyebrow">Last Step</span>
        <h2 class="intake-question">Where should we book your free growth session?</h2>
        <form class="intake-fields" data-contact-form novalidate>
          <div class="intake-field">
            <label for="intake-first-name">First Name *</label>
            <input id="intake-first-name" type="text" name="name" required autocomplete="given-name" />
          </div>
          <div class="intake-field">
            <label for="intake-email">Email *</label>
            <input id="intake-email" type="email" name="email" required autocomplete="email" />
          </div>
          <div class="intake-field">
            <label for="intake-phone">Phone *</label>
            <input id="intake-phone" type="tel" name="phone" required autocomplete="tel" />
          </div>
          <div class="intake-field">
            <label for="intake-website">Website URL (optional)</label>
            <input id="intake-website" type="text" name="website" placeholder="yourwebsite.com.au" autocomplete="url" />
          </div>
        </form>
        <button type="button" class="intake-btn" data-submit-btn>
          Book My Free Growth Session <span class="arrow" aria-hidden="true">→</span>
        </button>
        <span class="intake-cta-note">No spam. We'll reach out within 1 business day to lock in a time.</span>
        <div class="intake-error" data-error role="alert"></div>
      </div>
    `);

    // Thank you screen
    const thanksIndex = TOTAL_SCREENS - 1;
    parts.push(`
      <div class="intake-screen" data-screen="${thanksIndex}">
        <div class="intake-thanks-emoji" aria-hidden="true">🎯</div>
        <h2 class="intake-headline">You're in!</h2>
        <p class="intake-sub">We've got your details and we're prepping for your free growth session. Expect to hear from us within 1 business day to lock in a time.</p>
        <p class="intake-sub">In the meantime, <a class="intake-thanks-link" href="https://instagram.com/" target="_blank" rel="noopener">check us out on Instagram →</a></p>
        <button type="button" class="intake-btn" data-intake-close>Close</button>
      </div>
    `);

    stage.innerHTML = parts.join('');

    // Wire option clicks
    stage.querySelectorAll('.intake-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const screen = btn.closest('.intake-screen');
        const qKey = screen.dataset.questionKey;
        // Visual selected state, brief delay so user sees their click registered
        screen.querySelectorAll('.intake-option').forEach((o) => o.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        const isCustom = btn.dataset.optionCustom === 'true';
        const customPanel = screen.querySelector('[data-custom-input]');

        if (isCustom) {
          // Reveal the text input; user types and clicks Next (or hits Enter)
          if (customPanel) {
            customPanel.hidden = false;
            const input = customPanel.querySelector('[data-custom-text]');
            if (input) setTimeout(() => input.focus({ preventScroll: true }), 180);
          }
          return;
        }

        // Non-custom selected:collapse the custom panel if it was open
        if (customPanel) customPanel.hidden = true;

        const value = `${btn.dataset.optionKey} - ${btn.dataset.optionLabel}`;
        state.answers[qKey] = value;
        setTimeout(() => advance(), 220);
      });
    });

    // Wire "Other" custom-input Next button
    stage.querySelectorAll('[data-custom-next]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const screen = btn.closest('.intake-screen');
        const qKey = screen.dataset.questionKey;
        const input = screen.querySelector('[data-custom-text]');
        const text = (input.value || '').trim();
        if (!text) { input.focus(); return; }
        const otherBtn = screen.querySelector('.intake-option[data-option-custom="true"]');
        const key = otherBtn ? otherBtn.dataset.optionKey : 'X';
        const label = otherBtn ? otherBtn.dataset.optionLabel : 'Other';
        state.answers[qKey] = `${key} - ${label}: ${text}`;
        advance();
      });
    });

    // Enter on the custom-input field also advances
    stage.querySelectorAll('[data-custom-text]').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.closest('.intake-screen').querySelector('[data-custom-next]').click();
        }
      });
    });

    // Wire text input "Next"
    stage.querySelectorAll('[data-text-next]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const screen = btn.closest('.intake-screen');
        const input = screen.querySelector('[data-text-input]');
        const value = (input.value || '').trim();
        if (!value) {
          input.focus();
          return;
        }
        state.answers[screen.dataset.questionKey] = value;
        advance();
      });
    });

    // Enter key on the text input also advances
    stage.querySelectorAll('[data-text-input]').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.closest('.intake-screen').querySelector('[data-text-next]').click();
        }
      });
    });

    // Wire intro "Let's Go"
    stage.querySelectorAll('[data-intake-next]').forEach((btn) => {
      btn.addEventListener('click', () => advance());
    });

    // Wire close inside thank-you screen
    stage.querySelectorAll('[data-intake-close]').forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });

    // Wire submit
    submitBtn = stage.querySelector('[data-submit-btn]');
    errorEl = stage.querySelector('[data-error]');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }

    // Enter on any contact field submits
    const contactForm = stage.querySelector('[data-contact-form]');
    if (contactForm) {
      contactForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Screen navigation
     --------------------------------------------------------------------- */
  function goTo(index) {
    state.current = index;
    screens.forEach((s) => s.classList.remove('is-active'));
    const target = modal.querySelector(`[data-screen="${index}"]`);
    if (target) target.classList.add('is-active');

    // Progress bar (intro is 0%, contact is ~85%, thank you is 100%)
    const pct = Math.round((index / (TOTAL_SCREENS - 1)) * 100);
    progressFill.style.width = pct + '%';

    // Focus management
    setTimeout(() => {
      if (!target) return;
      const focusable = target.querySelector('input, button');
      if (focusable) focusable.focus({ preventScroll: true });
    }, 80);
  }

  function advance() {
    if (state.current < TOTAL_SCREENS - 1) {
      goTo(state.current + 1);
    }
  }

  /* ---------------------------------------------------------------------
     Open / close
     --------------------------------------------------------------------- */
  function openModal(prefillEmail) {
    buildModal();

    // Reset on each open unless already submitted
    if (!state.submitted) {
      state.current = 0;
      state.answers = {};
      screens.forEach((s) => s.classList.remove('is-active'));
      modal.querySelector('[data-screen="0"]').classList.add('is-active');
      progressFill.style.width = '0%';
      // Clear contact fields except prefilled email
      modal.querySelectorAll('[data-contact-form] input').forEach((i) => { i.value = ''; });
      modal.querySelectorAll('[data-text-input]').forEach((i) => { i.value = ''; });
      modal.querySelectorAll('.intake-option.is-selected').forEach((o) => o.classList.remove('is-selected'));
      if (errorEl) errorEl.classList.remove('is-visible');
      if (submitBtn) submitBtn.disabled = false;
    }

    if (prefillEmail) {
      const emailField = modal.querySelector('#intake-email');
      if (emailField) emailField.value = prefillEmail;
    }

    state.lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('intake-open');
    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intake-open');
    document.removeEventListener('keydown', handleKeydown);
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus({ preventScroll: true });
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  /* ---------------------------------------------------------------------
     Submit to Formspree
     --------------------------------------------------------------------- */
  async function handleSubmit() {
    if (state.submitting) return;
    if (errorEl) errorEl.classList.remove('is-visible');

    const contactScreen = modal.querySelector(`[data-screen="${TOTAL_SCREENS - 2}"]`);
    const name = contactScreen.querySelector('#intake-first-name').value.trim();
    const email = contactScreen.querySelector('#intake-email').value.trim();
    const phone = contactScreen.querySelector('#intake-phone').value.trim();
    const website = contactScreen.querySelector('#intake-website').value.trim();

    if (!name || !email || !phone) {
      showError('Please fill in your name, email, and phone so we can reach you.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('That email address doesn’t look quite right. Please double-check it.');
      return;
    }

    const payload = {
      name,
      email,
      phone,
      website,
      service_interest: state.answers.service_interest || '',
      business_goal: state.answers.business_goal || '',
      monthly_budget: state.answers.monthly_budget || '',
      current_client_source: state.answers.current_client_source || '',
      industry: state.answers.industry || '',
      _subject: 'New Lead - Free Growth Session Request'
    };

    state.submitting = true;
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending…';

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Submission failed (' + res.status + ')');

      state.submitted = true;
      advance(); // → thank you
    } catch (err) {
      state.submitting = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      showError(`Something went wrong. Please try again or email us directly at ${FALLBACK_EMAIL}.`);
    }
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.add('is-visible');
  }

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  /* ---------------------------------------------------------------------
     Wire up triggers:anything with [data-intake-open] or matching CTA
     --------------------------------------------------------------------- */
  function wireTriggers() {
    // Explicit opt-in attribute
    document.querySelectorAll('[data-intake-open]').forEach((el) => {
      el.addEventListener('click', (e) => {
        // For anchors / form submits, suppress default navigation
        e.preventDefault();
        const prefill = el.dataset.intakeEmail || '';
        openModal(prefill);
      });
    });

    // Hero email teaser form
    const heroForm = document.querySelector('[data-hero-email-form]');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = heroForm.querySelector('input[type="email"]');
        const email = emailInput ? emailInput.value.trim() : '';
        openModal(email);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireTriggers);
  } else {
    wireTriggers();
  }

  // Expose for any inline triggers / debugging
  window.LovelockIntake = { open: openModal, close: closeModal };
})();
