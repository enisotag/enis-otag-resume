/* ==========================================================================
   Süleyman Enis Otağ — Shared Portfolio UI Controller
   Theme persistence, bilingual TR/EN switching, navigation & project filters
   ========================================================================== */

(function () {
  'use strict';

  var THEME_STORAGE_KEY = 'enis_theme';
  var LANG_STORAGE_KEY = 'enis_lang';
  var VALID_THEMES = { light: true, dark: true };
  var VALID_LANGS = { tr: true, en: true };
  var CV_PATHS = {
    tr: 'assets/cv/enis_cv_tr.pdf',
    en: 'assets/cv/enis_cv_en.pdf'
  };

  function readStorage(key, fallback, validMap) {
    try {
      var value = window.localStorage.getItem(key);
      if (value && validMap[value]) {
        return value;
      }
    } catch (_) {
      // Ignore storage errors in restricted browsing contexts
    }
    return fallback;
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Ignore storage errors in restricted browsing contexts
    }
  }

  var currentTheme = readStorage(THEME_STORAGE_KEY, 'light', VALID_THEMES);
  var currentLang = readStorage(LANG_STORAGE_KEY, 'tr', VALID_LANGS);

  function updateThemeButton() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    var isDark = currentTheme === 'dark';
    var nextLabel = isDark
      ? (currentLang === 'tr' ? 'AÇIK' : 'LIGHT')
      : (currentLang === 'tr' ? 'KOYU' : 'DARK');
    var ariaText = isDark
      ? (currentLang === 'tr' ? 'Açık temaya geç' : 'Switch to light theme')
      : (currentLang === 'tr' ? 'Koyu temaya geç' : 'Switch to dark theme');

    btn.textContent = nextLabel;
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', ariaText);
    btn.setAttribute('title', ariaText);
  }

  function updateLangButton() {
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;

    // Shows 'EN' when 'tr' is active, 'TR' when 'en' is active
    btn.textContent = currentLang === 'tr' ? 'EN' : 'TR';
    var ariaText = currentLang === 'tr' ? 'Switch language to English' : 'Dili Türkçeye çevir';
    btn.setAttribute('aria-label', ariaText);
    btn.setAttribute('title', ariaText);
  }

  function applyTranslations(lang) {
    var i18nNodes = document.querySelectorAll('[data-tr][data-en]');
    for (var i = 0; i < i18nNodes.length; i++) {
      var el = i18nNodes[i];
      if (el.id === 'lang-toggle' || el.id === 'theme-toggle') continue;

      var translated = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-tr');
      if (translated === null) continue;

      if (el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }

    var blocks = document.querySelectorAll('[data-lang-block]');
    for (var j = 0; j < blocks.length; j++) {
      var block = blocks[j];
      var blockLang = block.getAttribute('data-lang-block');
      var shouldHide = blockLang !== lang;
      block.hidden = shouldHide;
      block.classList.toggle('hidden', shouldHide);
    }

    var cvLinks = document.querySelectorAll('a.cv-dynamic-link');
    var targetHref = CV_PATHS[lang] || CV_PATHS.tr;
    for (var k = 0; k < cvLinks.length; k++) {
      cvLinks[k].setAttribute('href', targetHref);
    }

    updateLangButton();
    updateThemeButton();
  }

  function setTheme(theme, persist) {
    var next = VALID_THEMES[theme] ? theme : 'light';
    currentTheme = next;
    document.documentElement.dataset.theme = next;

    if (persist !== false) {
      writeStorage(THEME_STORAGE_KEY, next);
    }

    updateThemeButton();
    return next;
  }

  function getTheme() {
    return currentTheme;
  }

  function setLang(lang, persist, dispatchEventFlag) {
    var next = VALID_LANGS[lang] ? lang : 'tr';
    currentLang = next;
    document.documentElement.lang = next;

    if (persist !== false) {
      writeStorage(LANG_STORAGE_KEY, next);
    }

    applyTranslations(next);

    if (dispatchEventFlag !== false) {
      var evt = new CustomEvent('portfolio:langchange', {
        detail: { lang: next },
        bubbles: true
      });
      document.dispatchEvent(evt);
    }

    return next;
  }

  function getLang() {
    return currentLang;
  }

  function extractPageFilename(path) {
    var clean = (path || '').split('#')[0].split('?')[0].replace(/\/+$/, '');
    var segment = clean.split('/').pop() || '';
    if (!segment || segment === '.' || segment.toLowerCase() === 'otag23') {
      return 'index.html';
    }
    return segment.toLowerCase();
  }

  function highlightActiveNav() {
    var currentPage = extractPageFilename(window.location.pathname);
    var links = document.querySelectorAll('.site-nav .nav-link');

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href') || '';
      var linkPage = extractPageFilename(href);
      var isMatch = linkPage === currentPage;

      link.classList.toggle('active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function initMobileNav() {
    var toggleBtn = document.getElementById('mobile-nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggleBtn || !nav) return;

    function closeNav() {
      nav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.setAttribute('aria-expanded', String(nav.classList.contains('is-open')));

    toggleBtn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', function (event) {
      if (event.target && event.target.closest('.nav-link')) {
        closeNav();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggleBtn.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(event.target) && !toggleBtn.contains(event.target)) {
        closeNav();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && nav.classList.contains('is-open')) {
        closeNav();
      }
    });
  }

  var REVEAL_SELECTOR = [
    '.section',
    '.meta-bar',
    '.card',
    '.index-row',
    '.timeline-item',
    '.cert-row',
    '.skill-group',
    '.project-card',
    '.callout',
    '.cv-hub'
  ].join(', ');
  var isNavigating = false;
  var revealObserver = null;

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function setRevealDelay(el, delayMs) {
    if (!el || !el.style) return;
    var value = delayMs + 'ms';
    if (typeof el.style.setProperty === 'function') {
      el.style.setProperty('--reveal-delay', value);
    } else {
      el.style.transitionDelay = value;
    }
  }

  function revealElementImmediately(el) {
    if (!el) return;
    el.classList.add('reveal-item', 'is-visible', 'is-revealed');
    setRevealDelay(el, 0);
    if (revealObserver) {
      revealObserver.unobserve(el);
    }
  }

  function revealAllItems() {
    var items = document.querySelectorAll(REVEAL_SELECTOR);
    for (var i = 0; i < items.length; i++) {
      revealElementImmediately(items[i]);
    }
  }

  function revealHashTarget() {
    var hash = window.location.hash || '';
    if (!hash || hash.length < 2) return;
    var id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (_) {
      // Keep raw hash id if malformed encoding
    }
    var target = document.getElementById(id);
    if (!target) return;

    if (target.matches && target.matches(REVEAL_SELECTOR)) {
      revealElementImmediately(target);
    }
    var ancestor = target.closest ? target.closest(REVEAL_SELECTOR) : null;
    if (ancestor) {
      revealElementImmediately(ancestor);
    }
    var nested = target.querySelectorAll ? target.querySelectorAll(REVEAL_SELECTOR) : [];
    for (var i = 0; i < nested.length; i++) {
      revealElementImmediately(nested[i]);
    }
  }

  function initScrollReveal() {
    var items = document.querySelectorAll(REVEAL_SELECTOR);
    if (!items.length) {
      document.documentElement.classList.add('reveal-ready');
      return;
    }

    var parentCounters = [];
    function nextSiblingIndex(parent) {
      if (!parent) return 0;
      for (var i = 0; i < parentCounters.length; i++) {
        if (parentCounters[i].parent === parent) {
          var idx = parentCounters[i].count;
          parentCounters[i].count = idx + 1;
          return idx;
        }
      }
      parentCounters.push({ parent: parent, count: 1 });
      return 0;
    }

    if (prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') {
      for (var i = 0; i < items.length; i++) {
        revealElementImmediately(items[i]);
      }
      document.documentElement.classList.add('reveal-ready');
      return;
    }

    var viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    var pending = [];

    for (var j = 0; j < items.length; j++) {
      var el = items[j];
      var isSection = el.classList && el.classList.contains('section');
      var siblingIdx = isSection ? 0 : nextSiblingIndex(el.parentElement || null);
      var delayMs = isSection ? 0 : Math.min(siblingIdx, 3) * 45;

      var rect = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
      var inOrAboveViewport = false;
      if (rect && viewportH > 0) {
        var hasBox = rect.height > 0 || rect.width > 0 || rect.top !== 0 || rect.bottom !== 0;
        if (hasBox && rect.top < viewportH) {
          inOrAboveViewport = true;
        }
      }

      if (inOrAboveViewport) {
        revealElementImmediately(el);
      } else {
        el.classList.add('reveal-item');
        setRevealDelay(el, delayMs);
        pending.push({ el: el, delay: delayMs });
      }
    }

    revealHashTarget();
    document.documentElement.classList.add('reveal-ready');

    if (!pending.length) return;

    revealObserver = new window.IntersectionObserver(
      function (entries, observer) {
        for (var k = 0; k < entries.length; k++) {
          var entry = entries[k];
          if (!entry.isIntersecting) continue;

          var target = entry.target;
          target.classList.add('is-visible');
          observer.unobserve(target);

          var parentSection = target.closest ? target.closest('.section.reveal-item') : null;
          if (parentSection && !parentSection.classList.contains('is-visible')) {
            revealElementImmediately(parentSection);
          }

          (function (node) {
            var rawDelay = 0;
            if (node.style && typeof node.style.getPropertyValue === 'function') {
              rawDelay = parseInt(node.style.getPropertyValue('--reveal-delay') || '0', 10);
            } else if (node.style && node.style.transitionDelay) {
              rawDelay = parseInt(node.style.transitionDelay, 10);
            }
            var delay = isNaN(rawDelay) ? 0 : rawDelay;
            window.setTimeout(function () {
              node.classList.add('is-revealed');
              setRevealDelay(node, 0);
            }, 360 + delay);
          })(target);
        }
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -24px 0px'
      }
    );

    for (var m = 0; m < pending.length; m++) {
      if (!pending[m].el.classList.contains('is-visible')) {
        revealObserver.observe(pending[m].el);
      }
    }

    window.addEventListener('hashchange', revealHashTarget);
    window.addEventListener('beforeprint', revealAllItems);
  }

  function clearLeavingState() {
    isNavigating = false;
    if (document.body) {
      document.body.classList.remove('is-leaving');
    }
  }

  function initPageTransitions() {
    clearLeavingState();
    window.addEventListener('pageshow', clearLeavingState);

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (prefersReducedMotion()) return;

      var target = event.target;
      var link = target && target.closest ? target.closest('a[href]') : null;
      if (!link) return;

      var linkTarget = link.getAttribute('target');
      if (linkTarget && linkTarget.toLowerCase() !== '_self') return;
      if (link.hasAttribute('download')) return;

      var rawHref = (link.getAttribute('href') || '').trim();
      if (!rawHref || rawHref.charAt(0) === '#') return;

      var lowerHref = rawHref.toLowerCase();
      if (
        lowerHref.indexOf('mailto:') === 0 ||
        lowerHref.indexOf('tel:') === 0 ||
        lowerHref.indexOf('javascript:') === 0
      ) {
        return;
      }

      var targetUrl;
      try {
        targetUrl = new URL(rawHref, window.location.href);
      } catch (_) {
        return;
      }

      if (
        targetUrl.protocol !== 'http:' &&
        targetUrl.protocol !== 'https:' &&
        targetUrl.protocol !== 'file:'
      ) {
        return;
      }

      if (targetUrl.protocol !== window.location.protocol) return;
      if (
        window.location.origin &&
        window.location.origin !== 'null' &&
        targetUrl.origin !== window.location.origin
      ) {
        return;
      }

      if (!/\.html$/i.test(targetUrl.pathname)) return;

      if (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash
      ) {
        return;
      }

      if (!document.body) return;

      event.preventDefault();
      if (isNavigating) return;
      isNavigating = true;
      document.body.classList.add('is-leaving');

      window.setTimeout(function () {
        window.location.href = targetUrl.href;
      }, 150);
    });
  }

  function initProjectFilters() {
    var filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    var projectCards = document.querySelectorAll('.project-card[data-category]');
    if (!filterButtons.length || !projectCards.length) return;

    for (var p = 0; p < projectCards.length; p++) {
      (function (card) {
        card.addEventListener('animationend', function () {
          card.classList.remove('is-filtering-in');
          if (card.style) {
            card.style.animationDelay = '';
          }
        });
      })(projectCards[p]);
    }

    function applyFilter(filter) {
      var target = (filter || 'all').toLowerCase();
      var visibleOrder = 0;

      for (var i = 0; i < filterButtons.length; i++) {
        var btn = filterButtons[i];
        var isSelected = (btn.getAttribute('data-filter') || '').toLowerCase() === target;
        btn.classList.toggle('active', isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      }

      for (var j = 0; j < projectCards.length; j++) {
        var card = projectCards[j];
        var rawCategory = (card.getAttribute('data-category') || '').toLowerCase().trim();
        var categories = rawCategory ? rawCategory.split(/\s+/) : [];
        var visible = target === 'all' || categories.indexOf(target) !== -1;

        card.classList.toggle('is-hidden', !visible);
        card.classList.remove('is-filtering-in');

        if (visible) {
          revealElementImmediately(card);
          if (!prefersReducedMotion()) {
            void card.offsetWidth;
            if (card.style) {
              card.style.animationDelay = Math.min(visibleOrder, 3) * 40 + 'ms';
            }
            card.classList.add('is-filtering-in');
          }
          visibleOrder++;
        } else if (card.style) {
          card.style.animationDelay = '';
        }
      }
    }

    for (var i = 0; i < filterButtons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          applyFilter(btn.getAttribute('data-filter') || 'all');
        });
      })(filterButtons[i]);
    }
  }

  function initControls() {
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
      });
    }

    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', function () {
        setLang(currentLang === 'tr' ? 'en' : 'tr');
      });
    }

    var printButtons = document.querySelectorAll('#print-cv-btn, [data-print]');
    for (var i = 0; i < printButtons.length; i++) {
      printButtons[i].addEventListener('click', function () {
        revealAllItems();
        if (typeof window.print === 'function') {
          window.print();
        }
      });
    }
  }

  function init() {
    setTheme(currentTheme, false);
    setLang(currentLang, false, false);
    highlightActiveNav();
    initControls();
    initMobileNav();
    initProjectFilters();
    initScrollReveal();
    initPageTransitions();
  }

  // Apply root attributes immediately and expose public API
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.lang = currentLang;

  window.PortfolioUI = {
    setLang: function (lang) {
      return setLang(lang, true, true);
    },
    getLang: getLang,
    setTheme: function (theme) {
      return setTheme(theme, true);
    },
    getTheme: getTheme
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
