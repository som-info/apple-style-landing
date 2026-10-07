/* Lumina landing page — vanilla JS, no dependencies */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------------------------------------------------------
     Global nav: background change on scroll + dark sections
     --------------------------------------------------------- */
  var gnav = $('#gnav');
  var darkSections = $$('.hero--dark, .gallery');
  var ticking = false;

  function updateNav() {
    ticking = false;
    gnav.classList.toggle('is-scrolled', window.scrollY > 4);
    var probe = gnav.offsetHeight / 2;
    var overDark = darkSections.some(function (s) {
      var r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    gnav.classList.toggle('is-dark', overDark);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateNav); }
  }, { passive: true });
  updateNav();

  /* ---------------------------------------------------------
     Mobile menu + search panel (share the scrim / scroll lock)
     --------------------------------------------------------- */
  var menuBtn = $('#menuToggle');
  var mobileMenu = $('#mobileMenu');
  var searchBtn = $('#searchToggle');
  var searchPanel = $('#searchPanel');
  var searchInput = $('#searchInput');
  var searchResults = $('#searchResults');
  var scrim = $('#scrim');

  function closeMenu(returnFocus) {
    if (mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    gnav.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (returnFocus) menuBtn.focus();
  }
  function openMenu() {
    closeSearch();
    mobileMenu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    gnav.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }
  menuBtn.addEventListener('click', function () {
    if (mobileMenu.hidden) openMenu(); else closeMenu();
  });
  mobileMenu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 833) closeMenu(); });

  var QUICK_LINKS = [
    { label: 'Halo 7', href: '#halo' },
    { label: 'Compare Halo models', href: '#compare' },
    { label: 'Arc Book 14', href: '#arcbook' },
    { label: 'Pulse 3', href: '#pulse' },
    { label: 'Slate', href: '#slate' },
    { label: 'Aura Studio', href: '#aura' },
    { label: 'Orbit', href: '#orbit' },
    { label: 'Lumina One', href: '#store' },
    { label: 'Lumina Trade In', href: '#tradein' },
    { label: 'Lumina Care', href: '#care' },
    { label: 'Captured on Halo 7', href: '#gallery' },
    { label: 'Why buy from Lumina', href: '#why' }
  ];
  function renderResults() {
    var q = searchInput.value.trim().toLowerCase();
    var list = QUICK_LINKS.filter(function (l) { return !q || l.label.toLowerCase().indexOf(q) !== -1; });
    if (!q) list = list.slice(0, 5);
    searchResults.innerHTML = '';
    if (!list.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No results for “' + searchInput.value.trim() + '”.';
      searchResults.appendChild(li);
      return;
    }
    list.forEach(function (l) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = l.href; a.textContent = l.label;
      li.appendChild(a); searchResults.appendChild(li);
    });
  }
  function openSearch() {
    closeMenu();
    searchPanel.hidden = false; scrim.hidden = false;
    searchBtn.setAttribute('aria-expanded', 'true');
    gnav.classList.add('is-open');
    renderResults();
    setTimeout(function () { searchInput.focus(); }, 30);
  }
  function closeSearch(returnFocus) {
    if (searchPanel.hidden) return;
    searchPanel.hidden = true; scrim.hidden = true;
    searchBtn.setAttribute('aria-expanded', 'false');
    gnav.classList.remove('is-open');
    if (returnFocus) searchBtn.focus();
  }
  searchBtn.addEventListener('click', function () { if (searchPanel.hidden) openSearch(); else closeSearch(); });
  searchInput.addEventListener('input', renderResults);
  $('#searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var first = $('a', searchResults);
    if (first) { closeSearch(); window.location.hash = first.getAttribute('href'); }
  });
  searchResults.addEventListener('click', function (e) { if (e.target.closest('a')) closeSearch(); });
  scrim.addEventListener('click', function () { closeSearch(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!searchPanel.hidden) closeSearch(true);
    if (!mobileMenu.hidden) closeMenu(true);
  });

  /* ---------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------- */
  var reveals = $$('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) {
      // items inside a horizontal scroller reveal together with their group
      if (!el.parentElement.classList.contains('reveal-group')) revealIO.observe(el);
    });
    $$('.reveal-group').forEach(function (group) {
      var groupIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        $$('.reveal', group).forEach(function (el) { el.classList.add('is-visible'); });
        groupIO.disconnect();
      }, { threshold: 0.1 });
      groupIO.observe(group);
    });
  }

  /* ---------------------------------------------------------
     Carousel
     --------------------------------------------------------- */
  var track = $('#carouselTrack');
  var slides = $$('.slide', track);
  var dotsWrap = $('#carouselDots');
  var playBtn = $('#carouselPlay');
  var current = 0;
  var timer = null;
  var paused = reduceMotion.matches;
  var hovering = false;
  var inView = false;
  var DELAY = 5000;

  slides.forEach(function (slide, i) {
    var dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
    dot.addEventListener('click', function () { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  var dots = $$('.carousel-dot', dotsWrap);

  function setActive(i) {
    current = i;
    slides.forEach(function (s, idx) {
      s.classList.toggle('is-active', idx === i);
      s.setAttribute('aria-hidden', idx === i ? 'false' : 'true');
    });
    dots.forEach(function (d, idx) { d.setAttribute('aria-selected', idx === i ? 'true' : 'false'); });
  }
  function goTo(i) {
    i = (i + slides.length) % slides.length;
    var s = slides[i];
    var left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
    track.scrollTo({ left: left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setActive(i);
  }
  function nearestSlide() {
    var center = track.scrollLeft + track.clientWidth / 2;
    var best = 0, bestDist = Infinity;
    slides.forEach(function (s, idx) {
      var d = Math.abs(s.offsetLeft + s.clientWidth / 2 - center);
      if (d < bestDist) { bestDist = d; best = idx; }
    });
    return best;
  }
  var scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var n = nearestSlide();
      if (n !== current) setActive(n);
    }, 80);
  }, { passive: true });

  function tick() { goTo(current + 1); }
  function start() { if (!timer && !paused && !hovering && inView && !document.hidden) timer = setInterval(tick, DELAY); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  function setPaused(p) {
    paused = p;
    playBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
    playBtn.setAttribute('aria-label', p ? 'Play automatic slideshow' : 'Pause automatic slideshow');
    if (p) stop(); else start();
  }
  playBtn.addEventListener('click', function () { setPaused(!paused); });
  $('#carouselNext').addEventListener('click', function () { goTo(current + 1); restart(); });
  $('#carouselPrev').addEventListener('click', function () { goTo(current - 1); restart(); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); restart(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); restart(); }
  });
  var carousel = $('.carousel');
  carousel.addEventListener('mouseenter', function () { hovering = true; stop(); });
  carousel.addEventListener('mouseleave', function () { hovering = false; start(); });
  carousel.addEventListener('focusin', function () { hovering = true; stop(); });
  carousel.addEventListener('focusout', function () { hovering = false; start(); });
  track.addEventListener('touchstart', function () { stop(); }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0.4 }).observe(carousel);
  } else { inView = true; }

  setActive(0);
  setPaused(paused);
  window.addEventListener('resize', function () {
    var s = slides[current];
    track.scrollLeft = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
  });

  /* ---------------------------------------------------------
     Compare: color swatches
     --------------------------------------------------------- */
  $$('.model').forEach(function (model) {
    var phone = $('.model-phone', model);
    var label = $('.color-name', model);
    $$('.swatch', model).forEach(function (sw) {
      sw.addEventListener('click', function () {
        $$('.swatch', model).forEach(function (o) {
          o.classList.remove('is-active'); o.setAttribute('aria-pressed', 'false');
        });
        sw.classList.add('is-active'); sw.setAttribute('aria-pressed', 'true');
        phone.style.setProperty('--phone', sw.getAttribute('data-color'));
        label.textContent = sw.getAttribute('data-name');
      });
    });
  });

  /* ---------------------------------------------------------
     Bag + toast
     --------------------------------------------------------- */
  var BAG_KEY = 'lumina-bag-v1';
  var bag = store.get(BAG_KEY, []);
  if (!Array.isArray(bag)) bag = [];
  var badge = $('#bagBadge');
  var bagLink = $('#bagLink');
  var toastEl = $('#toast');
  var toastTimer;

  function renderBag() {
    var n = bag.length;
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.hidden = n === 0;
    bagLink.setAttribute('aria-label', 'Shopping bag, ' + n + (n === 1 ? ' item' : ' items'));
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 300);
    }, 2400);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-buy]');
    if (!btn) return;
    var name = btn.getAttribute('data-buy');
    bag.push(name);
    store.set(BAG_KEY, bag);
    renderBag();
    toast(name + ' was added to your bag.');
  });
  bagLink.addEventListener('click', function (e) {
    e.preventDefault();
    toast(bag.length ? 'Your bag has ' + bag.length + (bag.length === 1 ? ' item.' : ' items.') + ' Checkout is disabled in this demo.' : 'Your bag is empty.');
  });
  window.addEventListener('storage', function (e) {
    if (e.key === BAG_KEY) { bag = store.get(BAG_KEY, []); renderBag(); }
  });
  renderBag();

  /* ---------------------------------------------------------
     Footer directory accordion (mobile)
     --------------------------------------------------------- */
  var dirToggles = $$('.dir-toggle');
  var dirMobile = null;
  function syncDirectory() {
    var mobile = window.innerWidth <= 733;
    if (mobile === dirMobile) return;
    dirMobile = mobile;
    dirToggles.forEach(function (btn) {
      // on desktop every column is visible, so report it as expanded
      btn.setAttribute('aria-expanded', mobile ? 'false' : 'true');
      btn.parentElement.nextElementSibling.classList.remove('is-open');
    });
  }
  dirToggles.forEach(function (btn) {
    var list = btn.parentElement.nextElementSibling;
    btn.addEventListener('click', function () {
      if (!dirMobile) return;
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      list.classList.toggle('is-open', open);
    });
  });
  syncDirectory();
  window.addEventListener('resize', syncDirectory);

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
