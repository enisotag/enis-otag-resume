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

  function initProjectFilters() {
    var filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    var projectCards = document.querySelectorAll('.project-card[data-category]');
    if (!filterButtons.length || !projectCards.length) return;

    function applyFilter(filter) {
      var target = (filter || 'all').toLowerCase();

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
