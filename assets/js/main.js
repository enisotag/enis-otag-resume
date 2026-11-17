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

  function getCopyButtonLabel(btn, lang) {
    if (btn.getAttribute('data-copied') === 'true') {
      return lang === 'en'
        ? (btn.getAttribute('data-copied-en') || 'Copied ✓')
        : (btn.getAttribute('data-copied-tr') || 'Kopyalandı ✓');
    }
    return lang === 'en' ? btn.getAttribute('data-en') : btn.getAttribute('data-tr');
  }

  function applyTranslations(lang) {
    var i18nNodes = document.querySelectorAll('[data-tr][data-en]');
    for (var i = 0; i < i18nNodes.length; i++) {
      var el = i18nNodes[i];
      if (el.id === 'lang-toggle' || el.id === 'theme-toggle') continue;

      var translated = el.classList.contains('copy-email-btn')
        ? getCopyButtonLabel(el, lang)
        : (lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-tr'));
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
    if (typeof updateIstanbulClock === 'function') {
      updateIstanbulClock();
    }
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

  function resolveSameSiteHtmlUrl(rawHref) {
    var trimmed = (rawHref || '').trim();
    if (!trimmed || trimmed.charAt(0) === '#') return null;

    var lowerHref = trimmed.toLowerCase();
    if (
      lowerHref.indexOf('mailto:') === 0 ||
      lowerHref.indexOf('tel:') === 0 ||
      lowerHref.indexOf('javascript:') === 0
    ) {
      return null;
    }

    var targetUrl;
    try {
      targetUrl = new URL(trimmed, window.location.href);
    } catch (_) {
      return null;
    }

    if (
      targetUrl.protocol !== 'http:' &&
      targetUrl.protocol !== 'https:' &&
      targetUrl.protocol !== 'file:'
    ) {
      return null;
    }

    if (targetUrl.protocol !== window.location.protocol) return null;
    if (
      window.location.origin &&
      window.location.origin !== 'null' &&
      targetUrl.origin !== window.location.origin
    ) {
      return null;
    }

    if (!/\.html$/i.test(targetUrl.pathname)) return null;
    return targetUrl;
  }

  function navigateToUrl(rawHref) {
    var targetUrl = resolveSameSiteHtmlUrl(rawHref);
    if (!targetUrl) {
      window.location.href = rawHref;
      return;
    }

    if (
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search &&
      targetUrl.hash
    ) {
      window.location.href = targetUrl.href;
      return;
    }

    if (prefersReducedMotion() || !document.body) {
      window.location.href = targetUrl.href;
      return;
    }

    if (isNavigating) return;
    isNavigating = true;
    document.body.classList.add('is-leaving');

    window.setTimeout(function () {
      window.location.href = targetUrl.href;
    }, 150);
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
      var targetUrl = resolveSameSiteHtmlUrl(rawHref);
      if (!targetUrl) return;

      if (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash
      ) {
        return;
      }

      if (!document.body) return;
      event.preventDefault();
      navigateToUrl(targetUrl.href);
    });
  }

  function initLinkPrefetch() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /2g/i.test(conn.effectiveType || ''))) {
      return;
    }
    if (!document.head || typeof document.createElement !== 'function') return;

    var prefetched = {};
    function maybePrefetch(event) {
      var target = event.target;
      var link = target && target.closest ? target.closest('a[href]') : null;
      if (!link) return;

      var targetUrl = resolveSameSiteHtmlUrl(link.getAttribute('href'));
      if (!targetUrl) return;
      if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') return;

      var cacheKey = targetUrl.origin + targetUrl.pathname + targetUrl.search;
      if (
        cacheKey === window.location.origin + window.location.pathname + window.location.search ||
        prefetched[cacheKey]
      ) {
        return;
      }
      prefetched[cacheKey] = true;

      var hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.as = 'document';
      hint.href = cacheKey;
      document.head.appendChild(hint);
    }

    document.addEventListener('pointerenter', maybePrefetch, true);
    document.addEventListener('focusin', maybePrefetch);
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

      document.dispatchEvent(new CustomEvent('portfolio:filterchange', {
        detail: { filter: target }
      }));
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

  function copyTextFallback(text) {
    if (!document.body || typeof document.createElement !== 'function') {
      return Promise.reject(new Error('Clipboard unavailable'));
    }
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    var ok = false;
    try {
      ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok ? Promise.resolve() : Promise.reject(new Error('Copy command failed'));
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyTextFallback(text);
      });
    }
    return copyTextFallback(text);
  }

  function initCopyEmailButtons() {
    var copyButtons = document.querySelectorAll('.copy-email-btn[data-copy-email]');
    if (!copyButtons.length) return;

    for (var i = 0; i < copyButtons.length; i++) {
      (function (btn) {
        var resetTimer = 0;

        btn.addEventListener('click', function () {
          var email = btn.getAttribute('data-copy-email') || '';
          if (!email) return;

          copyTextToClipboard(email).then(function () {
            if (resetTimer) {
              window.clearTimeout(resetTimer);
            }
            btn.setAttribute('data-copied', 'true');
            btn.classList.add('is-copied');
            btn.textContent = getCopyButtonLabel(btn, currentLang);

            announceStatus(
              currentLang === 'en'
                ? email + ' copied to clipboard'
                : email + ' panoya kopyalandı'
            );

            resetTimer = window.setTimeout(function () {
              btn.removeAttribute('data-copied');
              btn.classList.remove('is-copied');
              btn.textContent = getCopyButtonLabel(btn, currentLang);
              resetTimer = 0;
            }, 2200);
          }).catch(function () {
            // Do not silently claim copied if both Clipboard API and fallback fail
          });
        });
      })(copyButtons[i]);
    }
  }

  function getIstanbulTimeParts(now) {
    var d = now || new Date();
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
        var fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Istanbul',
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'short',
          hour12: false
        });
        if (typeof fmt.formatToParts === 'function') {
          var parts = fmt.formatToParts(d);
          var map = {};
          for (var i = 0; i < parts.length; i++) {
            map[parts[i].type] = parts[i].value;
          }
          var h = parseInt(map.hour, 10);
          var m = parseInt(map.minute, 10);
          if (!isNaN(h) && !isNaN(m)) {
            if (h === 24) h = 0;
            var hh = (h < 10 ? '0' : '') + h;
            var mm = (m < 10 ? '0' : '') + m;
            var wk = map.weekday || '';
            return {
              hour: h,
              minute: m,
              formatted: hh + ':' + mm,
              isWeekend: wk === 'Sat' || wk === 'Sun'
            };
          }
        }
      }
    } catch (e) {
      // Fallback to deterministic UTC+3 arithmetic below
    }

    var trt = new Date(d.getTime() + 180 * 60000);
    var fh = trt.getUTCHours();
    var fm = trt.getUTCMinutes();
    var fday = trt.getUTCDay();
    return {
      hour: fh,
      minute: fm,
      formatted: (fh < 10 ? '0' : '') + fh + ':' + (fm < 10 ? '0' : '') + fm,
      isWeekend: fday === 0 || fday === 6
    };
  }

  function formatOffsetHint(now, lang) {
    var diffMinutes = 180 + now.getTimezoneOffset();
    if (diffMinutes === 0) return '';
    var sign = diffMinutes > 0 ? '+' : '-';
    var absMin = Math.abs(diffMinutes);
    var hrs = Math.floor(absMin / 60);
    var rem = absMin % 60;
    var val = rem ? (hrs + ':' + (rem < 10 ? '0' : '') + rem) : String(hrs);
    return lang === 'en'
      ? ' · ' + sign + val + 'h vs your time'
      : ' · Yerel saatinizle ' + sign + val + ' sa';
  }

  function updateIstanbulClock() {
    var clocks = document.querySelectorAll('[data-istanbul-clock]');
    var statuses = document.querySelectorAll('[data-istanbul-status]');
    var dots = document.querySelectorAll('[data-istanbul-dot]');
    if (!clocks.length && !statuses.length && !dots.length) return;

    var now = new Date();
    var parts = getIstanbulTimeParts(now);
    var isEn = currentLang === 'en';
    var timeLabel = parts.formatted + ' TRT (UTC+3)';

    for (var i = 0; i < clocks.length; i++) {
      var el = clocks[i];
      var mode = el.getAttribute('data-istanbul-clock');
      var nextText = mode === 'inline'
        ? '· ' + timeLabel
        : (mode === 'compact' ? timeLabel : 'İstanbul · ' + timeLabel);
      if (el.textContent !== nextText) {
        el.textContent = nextText;
      }
    }

    var stateClass = 'is-evening';
    var statusLabel = isEn
      ? 'Flexible hours · Replies when available'
      : 'Esnek saatler · İlk fırsatta dönüş yapılır';

    if (!parts.isWeekend && parts.hour >= 9 && parts.hour < 20) {
      stateClass = 'is-active';
      statusLabel = isEn
        ? 'Active hours · Quick response window'
        : 'Çalışma saatleri · Hızlı yanıt penceresi';
    } else if (parts.hour >= 23 || parts.hour < 9) {
      stateClass = 'is-quiet';
      statusLabel = isEn
        ? 'Night hours in Istanbul · Leave an email anytime'
        : 'Gece saatleri · Dilediğiniz zaman e-posta bırakabilirsiniz';
    }

    var fullStatus = statusLabel + formatOffsetHint(now, currentLang);
    for (var j = 0; j < statuses.length; j++) {
      if (statuses[j].textContent !== fullStatus) {
        statuses[j].textContent = fullStatus;
      }
    }

    for (var k = 0; k < dots.length; k++) {
      dots[k].classList.remove('is-active', 'is-evening', 'is-quiet');
      dots[k].classList.add(stateClass);
    }
  }

  function initIstanbulClock() {
    updateIstanbulClock();
    var clocks = document.querySelectorAll('[data-istanbul-clock], [data-istanbul-status]');
    if (!clocks.length) return;

    window.setInterval(updateIstanbulClock, 15000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        updateIstanbulClock();
      }
    });
  }

  function initSectionRail() {
    var links = document.querySelectorAll('.section-rail .rail-link[data-rail-target]');
    if (!links.length) return;

    var entries = [];
    for (var i = 0; i < links.length; i++) {
      var id = links[i].getAttribute('data-rail-target');
      var target = id ? document.getElementById(id) : null;
      if (target) {
        entries.push({ link: links[i], target: target });
      }
    }
    if (!entries.length) return;

    function syncSectionRail() {
      var visible = [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var hidden = entry.target.classList.contains('is-hidden');
        entry.link.classList.toggle('is-muted', hidden);
        if (hidden) {
          entry.link.setAttribute('tabindex', '-1');
          entry.link.classList.remove('is-active');
          entry.link.removeAttribute('aria-current');
        } else {
          entry.link.removeAttribute('tabindex');
          visible.push(entry);
        }
      }

      if (!visible.length) return;

      var activeEntry = visible[0];
      var docEl = document.documentElement;
      var winHeight = window.innerHeight || (docEl ? docEl.clientHeight : 800);
      var scrollY = window.scrollY !== undefined ? window.scrollY : (window.pageYOffset || 0);
      var docHeight = docEl ? docEl.scrollHeight : 0;

      if (docHeight > 0 && winHeight + scrollY >= docHeight - 8) {
        activeEntry = visible[visible.length - 1];
      } else {
        var line = Math.min(210, Math.round(winHeight * 0.28));
        for (var j = 0; j < visible.length; j++) {
          var rect = visible[j].target.getBoundingClientRect();
          if (rect.top <= line) {
            activeEntry = visible[j];
          } else {
            break;
          }
        }
      }

      for (var k = 0; k < visible.length; k++) {
        var isCurrent = visible[k] === activeEntry;
        visible[k].link.classList.toggle('is-active', isCurrent);
        if (isCurrent) {
          visible[k].link.setAttribute('aria-current', 'location');
        } else {
          visible[k].link.removeAttribute('aria-current');
        }
      }
    }

    var rafPending = false;
    function scheduleSync() {
      if (rafPending) return;
      rafPending = true;
      var run = function () {
        rafPending = false;
        syncSectionRail();
      };
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
      } else {
        run();
      }
    }

    syncSectionRail();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    document.addEventListener('portfolio:filterchange', syncSectionRail);
  }

  function isApplePlatform() {
    var ua = (navigator && (navigator.platform || navigator.userAgent)) || '';
    return /Mac|iPhone|iPad|iPod/i.test(ua);
  }

  function isGamePlayingOnJourneyPage() {
    if (extractPageFilename(window.location.pathname) !== 'journey.html') {
      return false;
    }
    var fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (fs) return true;

    var startUi = document.getElementById('game-start-ui');
    var overUi = document.getElementById('game-over-ui');
    var celUi = document.getElementById('level-celebration-ui');
    var hireUi = document.getElementById('hire-me-modal');
    if (
      startUi && overUi && celUi && hireUi &&
      startUi.classList.contains('hidden') &&
      overUi.classList.contains('hidden') &&
      celUi.classList.contains('hidden') &&
      hireUi.classList.contains('hidden')
    ) {
      return true;
    }
    return false;
  }

  function isTypingTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return Boolean(target.closest && target.closest('[contenteditable="true"]'));
  }

  function initCommandPalette() {
    var trigger = document.getElementById('cmd-palette-trigger');
    var shortcutBadge = trigger ? trigger.querySelector('.cmd-trigger-kbd') : null;
    if (shortcutBadge) {
      shortcutBadge.textContent = isApplePlatform() ? '⌘K' : 'Ctrl+K';
    }

    var backdrop = null;
    var inputEl = null;
    var listEl = null;
    var footerEl = null;
    var isOpen = false;
    var selectedIdx = 0;
    var filteredItems = [];
    var restoreFocusEl = null;

    function getCommands() {
      var isEn = currentLang === 'en';
      var mod = isApplePlatform() ? '⌘K' : 'Ctrl+K';
      return [
        {
          groupTr: 'Sayfalar',
          groupEn: 'Pages',
          titleTr: 'Ana Sayfa',
          titleEn: 'Home',
          subTr: 'Genel bakış, seçili çalışmalar ve iletişim',
          subEn: 'Overview, selected works, and contact',
          keywords: 'ana sayfa home index portfolyo portfolio 1',
          kbd: '1',
          run: function () { navigateToUrl('index.html'); }
        },
        {
          groupTr: 'Sayfalar',
          groupEn: 'Pages',
          titleTr: 'Hakkımda & Özgeçmiş',
          titleEn: 'About & Curriculum Vitae',
          subTr: 'Deneyim, İTÜ eğitim geçmişi, sertifikalar ve Harvard CV',
          subEn: 'Experience, ITU education, credentials, and Harvard CV',
          keywords: 'hakkımda hakkimda cv ozgecmis about resume intertech bidb 2',
          kbd: '2',
          run: function () { navigateToUrl('about.html'); }
        },
        {
          groupTr: 'Sayfalar',
          groupEn: 'Pages',
          titleTr: 'Projeler & Mimariler',
          titleEn: 'Projects & Architectures',
          subTr: 'Tüm 5 teknik vaka çalışması ve sistem diyagramları',
          subEn: 'All 5 engineering case studies and flow diagrams',
          keywords: 'projeler projects case study sistem 3',
          kbd: '3',
          run: function () { navigateToUrl('projects.html'); }
        },
        {
          groupTr: 'Sayfalar',
          groupEn: 'Pages',
          titleTr: "Enis's Career Journey · Oyun",
          titleEn: "Enis's Career Journey · Game",
          subTr: 'Etkileşimli 2D piksel platform oyunu ve Sonsuz Mod',
          subEn: 'Interactive 2D pixel platformer and Endless Mode',
          keywords: 'oyun game journey enis career 4',
          kbd: '4',
          run: function () { navigateToUrl('journey.html'); }
        },
        {
          groupTr: 'Vaka Çalışmaları',
          groupEn: 'Case Studies',
          titleTr: 'Borsa Ajanı (v2.0)',
          titleEn: 'Borsa Ajanı (v2.0)',
          subTr: 'BIST Yapay Zekâ Analisti · Python · Gemini + Groq',
          subEn: 'BIST AI Analyst · Python · Gemini + Groq fallback',
          keywords: 'borsa ajani bist telegram ocr gemini groq python',
          kbd: '↗',
          run: function () { navigateToUrl('projects.html#borsa-ajani'); }
        },
        {
          groupTr: 'Vaka Çalışmaları',
          groupEn: 'Case Studies',
          titleTr: 'VIRA Finance Agent',
          titleEn: 'VIRA Finance Agent',
          subTr: 'Çok ajanlı finansal asistan · LangGraph · RAG',
          subEn: 'Multi-agent financial assistant · LangGraph · RAG',
          keywords: 'vira finance agent langgraph langchain rag intertech',
          kbd: '↗',
          run: function () { navigateToUrl('projects.html#vira-agent'); }
        },
        {
          groupTr: 'Vaka Çalışmaları',
          groupEn: 'Case Studies',
          titleTr: 'Winsock HTTP/1.1 Server',
          titleEn: 'Winsock HTTP/1.1 Server',
          subTr: 'C ile çerçevesiz TCP/IP soket sunucusu',
          subEn: 'Framework-free TCP/IP HTTP/1.1 server in C',
          keywords: 'winsock http socket c tcp network server',
          kbd: '↗',
          run: function () { navigateToUrl('projects.html#winsock-server'); }
        },
        {
          groupTr: 'Vaka Çalışmaları',
          groupEn: 'Case Studies',
          titleTr: 'Advanced Native PHP & MySQL CMS',
          titleEn: 'Advanced Native PHP & MySQL CMS',
          subTr: 'PDO, bcrypt ve 1:N / N:M ilişkisel CMS mimarisi',
          subEn: 'PDO, bcrypt auth, and 1:N / N:M relational CMS',
          keywords: 'php mysql pdo bcrypt cms database',
          kbd: '↗',
          run: function () { navigateToUrl('projects.html#php-cms'); }
        },
        {
          groupTr: 'Eylemler',
          groupEn: 'Actions',
          titleTr: 'Harvard CV İndir (Türkçe PDF)',
          titleEn: 'Download Harvard CV (English PDF)',
          subTr: isEn ? 'enis_cv_en.pdf yeni sekmede açılır' : 'enis_cv_tr.pdf yeni sekmede açılır',
          subEn: 'Opens Harvard-format PDF resume in new tab',
          keywords: 'cv pdf download indir harvard resume ozgecmis',
          kbd: 'PDF',
          run: function () {
            window.open(CV_PATHS[currentLang] || CV_PATHS.tr, '_blank', 'noopener');
          }
        },
        {
          groupTr: 'Eylemler',
          groupEn: 'Actions',
          titleTr: 'E-postayı Kopyala',
          titleEn: 'Copy Email Address',
          subTr: 'enisotag56@gmail.com panoya kopyalanır',
          subEn: 'Copy enisotag56@gmail.com to clipboard',
          keywords: 'email eposta mail copy kopyala contact iletisim enisotag56',
          kbd: '@',
          run: function () {
            copyTextToClipboard('enisotag56@gmail.com').then(function () {
              announceStatus(isEn ? 'enisotag56@gmail.com copied to clipboard' : 'enisotag56@gmail.com panoya kopyalandı');
              var labelNode = trigger ? trigger.querySelector('.cmd-trigger-label') : null;
              if (labelNode) {
                labelNode.textContent = currentLang === 'en' ? 'Copied ✓' : 'Kopyalandı ✓';
                window.setTimeout(function () {
                  labelNode.textContent = currentLang === 'en'
                    ? (labelNode.getAttribute('data-en') || 'Search')
                    : (labelNode.getAttribute('data-tr') || 'Ara');
                }, 1800);
              }
            }).catch(function () {});
          }
        },
        {
          groupTr: 'Eylemler',
          groupEn: 'Actions',
          titleTr: 'Temayı Değiştir (Açık / Koyu)',
          titleEn: 'Toggle Theme (Light / Dark)',
          subTr: currentTheme === 'dark' ? (isEn ? 'Currently: Dark' : 'Şu an: Koyu') : (isEn ? 'Currently: Light' : 'Şu an: Açık'),
          subEn: currentTheme === 'dark' ? 'Currently: Dark matte anthracite' : 'Currently: Archival paper light',
          keywords: 'theme tema dark light koyu acik mode',
          kbd: 'T',
          run: function () { setTheme(currentTheme === 'light' ? 'dark' : 'light'); }
        },
        {
          groupTr: 'Eylemler',
          groupEn: 'Actions',
          titleTr: 'Dili Değiştir (TR / EN)',
          titleEn: 'Switch Language (TR / EN)',
          subTr: 'Türkçe ve İngilizce arasında geçiş yap',
          subEn: 'Switch interface between Turkish and English',
          keywords: 'lang dil turkish english tr en',
          kbd: 'L',
          run: function () { setLang(currentLang === 'tr' ? 'en' : 'tr'); }
        },
        {
          groupTr: 'Bağlantılar',
          groupEn: 'Links',
          titleTr: 'GitHub Profili',
          titleEn: 'GitHub Profile',
          subTr: 'github.com/enisotag',
          subEn: 'github.com/enisotag',
          keywords: 'github code repo enisotag',
          kbd: '↗',
          run: function () { window.open('https://github.com/enisotag', '_blank', 'noopener'); }
        },
        {
          groupTr: 'Bağlantılar',
          groupEn: 'Links',
          titleTr: 'LinkedIn Profili',
          titleEn: 'LinkedIn Profile',
          subTr: 'linkedin.com/in/suleyman-enis-otag',
          subEn: 'linkedin.com/in/suleyman-enis-otag',
          keywords: 'linkedin network profile profil',
          kbd: '↗',
          run: function () { window.open('https://www.linkedin.com/in/suleyman-enis-otag/', '_blank', 'noopener'); }
        }
      ].map(function (item) {
        item.mod = mod;
        return item;
      });
    }

    function ensurePaletteDom() {
      if (backdrop || !document.body || typeof document.createElement !== 'function') return;

      backdrop = document.createElement('div');
      backdrop.id = 'cmd-palette';
      backdrop.className = 'cmd-backdrop hidden';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      var dialog = document.createElement('div');
      dialog.className = 'cmd-dialog';

      var inputRow = document.createElement('div');
      inputRow.className = 'cmd-input-row';

      var prefix = document.createElement('span');
      prefix.className = 'cmd-prefix';
      prefix.setAttribute('aria-hidden', 'true');
      prefix.textContent = '>';

      inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'cmd-input';
      inputEl.setAttribute('autocomplete', 'off');
      inputEl.setAttribute('spellcheck', 'false');

      var escBtn = document.createElement('button');
      escBtn.type = 'button';
      escBtn.className = 'cmd-esc-hint';
      escBtn.textContent = 'ESC';
      escBtn.addEventListener('click', closePalette);

      inputRow.appendChild(prefix);
      inputRow.appendChild(inputEl);
      inputRow.appendChild(escBtn);

      listEl = document.createElement('div');
      listEl.className = 'cmd-list';
      listEl.setAttribute('role', 'listbox');

      footerEl = document.createElement('div');
      footerEl.className = 'cmd-footer';

      dialog.appendChild(inputRow);
      dialog.appendChild(listEl);
      dialog.appendChild(footerEl);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closePalette();
      });

      inputEl.addEventListener('input', function () {
        selectedIdx = 0;
        renderList();
      });

      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (filteredItems.length) {
            selectedIdx = (selectedIdx + 1) % filteredItems.length;
            updateSelectionHighlight();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (filteredItems.length) {
            selectedIdx = (selectedIdx - 1 + filteredItems.length) % filteredItems.length;
            updateSelectionHighlight();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIdx]) {
            executeItem(filteredItems[selectedIdx]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closePalette();
        }
      });
    }

    function executeItem(item) {
      closePalette();
      if (item && typeof item.run === 'function') {
        item.run();
      }
    }

    function updateSelectionHighlight() {
      if (!listEl) return;
      var buttons = listEl.querySelectorAll('.cmd-item');
      for (var i = 0; i < buttons.length; i++) {
        var isSel = i === selectedIdx;
        buttons[i].classList.toggle('is-selected', isSel);
        buttons[i].setAttribute('aria-selected', String(isSel));
        if (isSel && typeof buttons[i].scrollIntoView === 'function') {
          buttons[i].scrollIntoView({ block: 'nearest' });
        }
      }
    }

    function renderList() {
      if (!listEl || !inputEl) return;
      var isEn = currentLang === 'en';
      backdrop.setAttribute('aria-label', isEn ? 'Command Palette' : 'Komut Paleti');
      inputEl.placeholder = isEn
        ? 'Search pages, projects, or actions...'
        : 'Sayfa, proje veya eylem ara...';
      footerEl.textContent = isEn
        ? '↑↓ Navigate · Enter Open · Esc Close'
        : '↑↓ Seç · Enter Aç · Esc Kapat';

      var q = (inputEl.value || '').toLowerCase().trim();
      var all = getCommands();
      filteredItems = [];

      for (var i = 0; i < all.length; i++) {
        var item = all[i];
        var haystack = (
          item.titleTr + ' ' + item.titleEn + ' ' + item.subTr + ' ' + item.subEn + ' ' + item.keywords
        ).toLowerCase();
        if (!q || haystack.indexOf(q) !== -1) {
          filteredItems.push(item);
        }
      }

      if (selectedIdx >= filteredItems.length) {
        selectedIdx = Math.max(0, filteredItems.length - 1);
      }

      listEl.innerHTML = '';
      if (!filteredItems.length) {
        var emptyEl = document.createElement('div');
        emptyEl.className = 'cmd-empty';
        emptyEl.textContent = isEn ? 'No matching command found.' : 'Eşleşen sonuç bulunamadı.';
        listEl.appendChild(emptyEl);
        return;
      }

      var lastGroup = '';
      var flatIndex = 0;
      for (var j = 0; j < filteredItems.length; j++) {
        (function (entry, idx) {
          var groupLabel = isEn ? entry.groupEn : entry.groupTr;
          if (groupLabel !== lastGroup) {
            lastGroup = groupLabel;
            var groupEl = document.createElement('div');
            groupEl.className = 'cmd-group-title';
            groupEl.textContent = groupLabel;
            listEl.appendChild(groupEl);
          }

          var rowBtn = document.createElement('button');
          rowBtn.type = 'button';
          rowBtn.className = 'cmd-item' + (idx === selectedIdx ? ' is-selected' : '');
          rowBtn.setAttribute('role', 'option');
          rowBtn.setAttribute('aria-selected', String(idx === selectedIdx));

          var mainCol = document.createElement('span');
          mainCol.className = 'cmd-item-main';
          var titleSpan = document.createElement('span');
          titleSpan.className = 'cmd-item-title';
          titleSpan.textContent = isEn ? entry.titleEn : entry.titleTr;
          var subSpan = document.createElement('span');
          subSpan.className = 'cmd-item-sub';
          subSpan.textContent = isEn ? entry.subEn : entry.subTr;
          mainCol.appendChild(titleSpan);
          mainCol.appendChild(subSpan);

          var kbdSpan = document.createElement('span');
          kbdSpan.className = 'cmd-item-kbd';
          kbdSpan.textContent = entry.kbd;

          rowBtn.appendChild(mainCol);
          rowBtn.appendChild(kbdSpan);
          rowBtn.addEventListener('mouseenter', function () {
            selectedIdx = idx;
            updateSelectionHighlight();
          });
          rowBtn.addEventListener('click', function () {
            executeItem(entry);
          });

          listEl.appendChild(rowBtn);
        })(filteredItems[j], flatIndex++);
      }
    }

    function openPalette() {
      ensurePaletteDom();
      if (!backdrop || !inputEl) return;
      restoreFocusEl = document.activeElement;
      isOpen = true;
      selectedIdx = 0;
      inputEl.value = '';
      renderList();
      backdrop.classList.remove('hidden');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      inputEl.focus();
    }

    function closePalette() {
      if (!backdrop || !isOpen) return;
      isOpen = false;
      backdrop.classList.add('hidden');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocusEl && typeof restoreFocusEl.focus === 'function') {
        restoreFocusEl.focus();
      } else if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
      }
      restoreFocusEl = null;
    }

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function () {
        if (isOpen) closePalette(); else openPalette();
      });
    }

    document.addEventListener('portfolio:langchange', function () {
      if (isOpen) renderList();
    });

    document.addEventListener('keydown', function (event) {
      var key = (event.key || '').toLowerCase();
      var hasCmdModifier = (event.ctrlKey || event.metaKey) && !event.altKey;

      if (hasCmdModifier && key === 'k') {
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (fs) return;
        event.preventDefault();
        if (isOpen) closePalette(); else openPalette();
        return;
      }

      if (isOpen) {
        if (key === 'escape') {
          event.preventDefault();
          closePalette();
        }
        return;
      }

      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || isGamePlayingOnJourneyPage()) return;

      if (key === '/') {
        event.preventDefault();
        openPalette();
      } else if (key === 't') {
        event.preventDefault();
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
      } else if (key === 'l') {
        event.preventDefault();
        setLang(currentLang === 'tr' ? 'en' : 'tr');
      } else if (key === '1') {
        navigateToUrl('index.html');
      } else if (key === '2') {
        navigateToUrl('about.html');
      } else if (key === '3') {
        navigateToUrl('projects.html');
      } else if (key === '4') {
        navigateToUrl('journey.html');
      }
    });
  }

  var sharedLiveRegion = null;
  function announceStatus(message) {
    if (!document.body || typeof document.createElement !== 'function') return null;
    if (!sharedLiveRegion) {
      sharedLiveRegion = document.createElement('span');
      sharedLiveRegion.className = 'sr-only';
      sharedLiveRegion.setAttribute('aria-live', 'polite');
      sharedLiveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(sharedLiveRegion);
    }
    if (message) {
      sharedLiveRegion.textContent = message;
    }
    return sharedLiveRegion;
  }

  function init() {
    setTheme(currentTheme, false);
    setLang(currentLang, false, false);
    highlightActiveNav();
    initControls();
    initCopyEmailButtons();
    initIstanbulClock();
    initMobileNav();
    initProjectFilters();
    initSectionRail();
    initScrollReveal();
    initPageTransitions();
    initLinkPrefetch();
    initCommandPalette();
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
