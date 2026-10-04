/* ============================================================
   MAIN.JS — partikel, navigasi, reveal, typewriter, data GitHub, easter egg
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ico = id => '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>';

  /* ============================================================
     1. PARTIKEL ENERGI KUTUKAN
     ============================================================ */
  (function particles() {
    const cv = $('#fx-canvas');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, parts = [], raf = 0;
    const COLORS = ['139,108,255', '185,166,255', '120,110,190', '150,140,200'];
    const pointer = { x: -999, y: -999 };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(n) {
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + .45,
        vx: (Math.random() - .5) * .22,
        vy: -(Math.random() * .35 + .1),
        a: Math.random() * .4 + .12,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        p: Math.random() * 6.28
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.p += .011;
        p.x += p.vx; p.y += p.vy;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 10;
        if (p.x > w + 12) p.x = -10;

        const dx = pointer.x - p.x, dy = pointer.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 20000) {
          const f = (20000 - d2) / 20000;
          p.x -= dx * .0016 * f;
          p.y -= dy * .0016 * f;
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * (.55 + .45 * Math.sin(p.p))).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    function onResize() { size(); make(Math.min(70, Math.round(w * h / 22000))); start(); }

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', () => { document.hidden ? cancelAnimationFrame(raf) : start(); });

    onResize();
  })();

  /* ============================================================
     1b. SLOT GAMBAR: uptick kalau gambar ada, fallback kalau tidak
     ============================================================ */
  (function artSlots() {
    $$('.art img').forEach(img => {
      const wrap = img.closest('.art');
      const mark = () => wrap.classList.add('ok');
      if (img.complete && img.naturalWidth > 0) { mark(); return; }
      img.addEventListener('load', mark, { once: true });
      img.addEventListener('error', () => {
        wrap.classList.add('empty');
        const cap = wrap.querySelector('.art-label');
        if (cap) cap.textContent = 'slot kosong · taruh ' + (wrap.dataset.art || 'gambar') + ' di assets/img/';
      }, { once: true });
    });
  })();

  /* ============================================================
     2. NAVIGASI
     ============================================================ */
  (function nav() {
    const bar = $('#nav'), burger = $('#burger'), list = $('#navList');
    if (bar) {
      const onScroll = () => bar.classList.toggle('stuck', window.scrollY > 40);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (burger && list) {
      burger.addEventListener('click', () => {
        const open = list.classList.toggle('open');
        burger.innerHTML = ico(open ? 'i-close' : 'i-menu');
        burger.setAttribute('aria-expanded', String(open));
      });
      list.addEventListener('click', e => {
        if (e.target.closest('a')) {
          list.classList.remove('open');
          burger.innerHTML = ico('i-menu');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const sections = $$('main section[id]');
    const navAs = $$('.nav-list a[href^="#"]');
    if ('IntersectionObserver' in window && sections.length) {
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          navAs.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(s => spy.observe(s));
    }
  })();

  /* ============================================================
     3. TYPEWRITER
     ============================================================ */
  (function typed() {
    const el = $('#typed');
    if (!el) return;
    const LINES = [
      'Full stack developer · IT Developer @ Spindo',
      'Backend: Django, Flask, Laravel, CodeIgniter',
      'Mobile: Flutter, Dart, Firebase',
      'Database: PostgreSQL, MySQL, MongoDB',
      'Security: OWASP ZAP, RBAC, OTP, audit log',
      'S1 Informatika · terbuka untuk kerja remote'
    ];
    let li = 0, ci = 0, del = false;
    const TICK = 55, ERASE = 26;
    (function run() {
      const line = LINES[li];
      el.textContent = line.slice(0, ci);
      if (!del && ci < line.length) { ci++; setTimeout(run, TICK); }
      else if (!del && ci === line.length) { del = true; setTimeout(run, 1900); }
      else if (del && ci > 0) { ci--; setTimeout(run, ERASE); }
      else { del = false; li = (li + 1) % LINES.length; setTimeout(run, 320); }
    })();
  })();

  /* ============================================================
     4. REVEAL + BAR KEDALAMAN
     ============================================================ */
  (function reveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('in'));
      $$('.bar i[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en, i) => {
        if (!en.isIntersecting) return;
        setTimeout(() => en.target.classList.add('in'), i * 70);
        obs.unobserve(en.target);
      });
    }, { threshold: .14 });
    items.forEach(i => io.observe(i));

    const barIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.style.width = en.target.dataset.w + '%';
        barIO.unobserve(en.target);
      });
    }, { threshold: .5 });
    $$('.bar i[data-w]').forEach(b => barIO.observe(b));
  })();

  /* ============================================================
     5. COUNT-UP
     ============================================================ */
  function countUp(el, to) {
    const dur = 1100;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ============================================================
     6. DATA GITHUB
     ============================================================ */
  const USER = 'Masbismaa';
  const GRID = $('#projectGrid');
  const NOTE = $('#projectNote');
  const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c',
    Dart: '#00b4ab', PHP: '#4F5D95', Jupyter: '#DA5B0B'
  };
  const icoFor = lang => lang === 'Python' ? 'i-database' : lang === 'PHP' ? 'i-server'
    : lang === 'Dart' ? 'i-smartphone' : lang === 'Jupyter' ? 'i-terminal' : 'i-code';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function repoCard(r) {
    const color = r.language ? (LANG_COLORS[r.language] || '#8b6cff') : null;
    const lang = r.language
      ? '<span class="lang">' + ico(icoFor(r.language))
        + (color ? '<span class="dot" style="background:' + color + '"></span>' : '') + esc(r.language) + '</span>'
      : '<span class="lang">' + ico('i-layers') + 'repo</span>';
    const desc = r.description
      ? '<p>' + esc(r.description) + '</p>'
      : '<p style="opacity:.6">Repo publik, klik untuk melihat isinya.</p>';
    return '<a class="card proj" href="' + r.html_url + '" target="_blank" rel="noopener">' +
      lang +
      '<h3>' + esc(r.name) + '</h3>' + desc +
      '<div class="meta">' +
        '<span>stars <b>' + r.stargazers_count + '</b></span>' +
        '<span>forks <b>' + r.forks_count + '</b></span>' +
        '<span>push ' + new Date(r.pushed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + '</span>' +
      '</div></a>';
  }

  async function loadGitHub() {
    let repos;
    try {
      const res = await fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed', {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      repos = await res.json();
    } catch {
      if (NOTE) NOTE.textContent = 'GitHub API tidak bisa dihubungi. Kartu statis tetap tampil.';
      return;
    }
    if (!Array.isArray(repos)) return;

    const own = repos.filter(r => !r.fork && r.name !== USER && r.name !== USER + '.github.io');
    const pick = own
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
      .slice(0, 8);

    if (GRID) {
      const featured = $('.proj.featured', GRID);
      GRID.innerHTML = (featured ? featured.outerHTML : '') + pick.map(repoCard).join('');
    }
    if (NOTE) NOTE.textContent = 'Live dari GitHub API, ' + own.length + ' repo publik. Klik kartu untuk membuka repo.';

    const sRepo = $('#sRepo'), sStar = $('#sStar'), sFork = $('#sFork'), sFollow = $('#sFollow');
    if (sRepo) countUp(sRepo, own.length);
    if (sStar) countUp(sStar, own.reduce((a, r) => a + r.stargazers_count, 0));
    if (sFork) countUp(sFork, own.reduce((a, r) => a + r.forks_count, 0));

    try {
      const u = await fetch('https://api.github.com/users/' + USER, { headers: { Accept: 'application/vnd.github+json' } });
      if (u.ok) {
        const d = await u.json();
        if (sFollow) countUp(sFollow, d.followers || 0);
      }
    } catch {}
  }
  loadGitHub();

  /* ============================================================
     7. EASTER EGG
     ============================================================ */
  (function domainWord() {
    const KEY = 'domainexpansion';
    let buf = '';
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      buf = (buf + e.key.toLowerCase()).slice(-KEY.length);
      if (buf === KEY) {
        buf = '';
        window.jjkDomain && window.jjkDomain('呪 術 廻 戦');
        window.jjkToast && window.jjkToast('Easter egg aktif. Ketik "domain" lagi kapan saja.', 'ok');
      }
    });
  })();

  (function konami() {
    const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === SEQ[pos]) {
        pos++;
        if (pos === SEQ.length) {
          pos = 0;
          window.jjkDomain && window.jjkDomain('K O N A M I');
          window.jjkToast && window.jjkToast('Konami. Energi kutukan maksimal.', 'ok');
          const g = $('#games');
          if (g) g.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
          setTimeout(() => window.jjkTab && window.jjkTab('gacha'), 500);
        }
      } else {
        pos = (k === SEQ[0]) ? 1 : 0;
      }
    });
  })();

  /* ---------- klik email: copy, bukan buka mail client ---------- */
  const mailCard = $('#copyMail');
  if (mailCard) mailCard.addEventListener('click', e => {
    e.preventDefault();
    const mail = 'moch.bismap@gmail.com';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(mail)
        .then(() => window.jjkToast && window.jjkToast('Email disalin: ' + mail, 'ok'))
        .catch(() => { window.location.href = 'mailto:' + mail; });
    } else {
      window.location.href = 'mailto:' + mail;
    }
  });

  /* ============================================================
     8. FOOTER + DEEP LINK
     ============================================================ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (window.location.hash === '#games') {
    setTimeout(() => window.jjkTab && window.jjkTab('gacha'), 400);
  }
})();