/* ============================================================
   MAIN.JS — cursed energy particles, nav, reveal, data, easter egg
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. CURSED ENERGY PARTICLES (canvas)
     ============================================================ */
  (function particles() {
    const cv = $('#ce-canvas');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, parts = [], raf = 0;
    const COLORS = ['232,121,249', '168,85,247', '244,114,182', '34,211,238', '192,132,252'];
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
        r: Math.random() * 1.9 + .5,
        vx: (Math.random() - .5) * .28,
        vy: -(Math.random() * .45 + .12),
        a: Math.random() * .55 + .15,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        p: Math.random() * 6.28
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.p += .012;
        p.x += p.vx; p.y += p.vy;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 10;
        if (p.x > w + 12) p.x = -10;

        // avoid the cursor
        const dx = pointer.x - p.x, dy = pointer.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 20000) {
          const f = (20000 - d2) / 20000;
          p.x -= dx * .0018 * f;
          p.y -= dy * .0018 * f;
        }

        const alpha = p.a * (.55 + .45 * Math.sin(p.p));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c + ',' + alpha.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    function onResize() { size(); make(Math.min(110, Math.round(w * h / 15000))); start(); }

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', e => {
      pointer.x = e.clientX; pointer.y = e.clientY;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf); else start();
    });

    onResize();
  })();

  /* ============================================================
     2. NAVBAR
     ============================================================ */
  (function nav() {
    const bar = $('#navbar'), toggle = $('#navToggle'), links = $('#navLinks');
    if (bar) {
      const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 40);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.textContent = open ? '✕' : '☰';
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
          links.classList.remove('open');
          toggle.textContent = '☰';
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // scrollspy
    const sections = $$('main section[id]');
    const navAs = $$('.nav-links a[href^="#"]');
    if ('IntersectionObserver' in window && sections.length) {
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
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
      'Full Stack Developer · IT @ Spindo',
      'Django · Flask · Laravel · CodeIgniter',
      'Flutter · Dart · Firebase',
      'PostgreSQL · MySQL · MongoDB',
      'Security: OWASP ZAP · RBAC · OTP',
      'S1 Informatika · 3-5 tahun ngoding'
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
     4. REVEAL ON SCROLL + SKILL BARS
     ============================================================ */
  (function reveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('in'));
      fillBars();
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

    function fillBars() { $$('.bar i[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; }); }
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
     5. COUNT-UP STATS
     ============================================================ */
  function countUp(el, to) {
    const dur = 1100;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ============================================================
     6. GITHUB DATA (projects + stats)
     ============================================================ */
  const USER = 'Masbismaa';
  const GRID = $('#projectsGrid');
  const NOTE = $('#projectsNote');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c',
    Dart: '#00b4ab', PHP: '#4F5D95', Jupyter: '#DA5B0B'
  };

  function repoCard(r) {
    const lang = r.language
      ? '<span class="lang" style="color:' + (LANG_COLORS[r.language] || '#67e8f9') + ';border-color:'
        + (LANG_COLORS[r.language] || '#22d3ee') + '55">' + esc(r.language) + '</span>'
      : '<span class="lang">repo</span>';
    const desc = r.description
      ? '<p>' + esc(r.description) + '</p>'
      : '<p style="opacity:.6">Repo publik — klik untuk melihat isinya.</p>';
    return '<a class="card project-card" href="' + r.html_url + '" target="_blank" rel="noopener">' +
      lang +
      '<h3>' + esc(r.name) + '</h3>' + desc +
      '<div class="project-meta">' +
        '<span>★ <b>' + r.stargazers_count + '</b></span>' +
        '<span>⑂ <b>' + r.forks_count + '</b></span>' +
        '<span>◷ ' + new Date(r.pushed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + '</span>' +
      '</div></a>';
  }

  async function loadGitHub() {
    let repos = null;
    try {
      const res = await fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed', {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      repos = await res.json();
    } catch (e) {
      if (NOTE) NOTE.textContent = 'GitHub API tidak bisa dihubungi (offline / rate limit). Kartu statis tetap tampil.';
      return;
    }
    if (!Array.isArray(repos)) return;

    const own = repos.filter(r => !r.fork && r.name !== USER && r.name !== USER + '.github.io');
    const pick = own
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
      .slice(0, 8);

    if (GRID) {
      const featured = $('.project-featured', GRID);
      const cards = pick.map(repoCard).join('');
      GRID.innerHTML = (featured ? featured.outerHTML : '') + cards;
    }
    if (NOTE) NOTE.textContent = 'Live dari GitHub API · ' + own.length + ' repo publik milik ' + USER + ' · klik card untuk membuka repo.';

    // stats
    const totalStars = own.reduce((a, r) => a + r.stargazers_count, 0);
    const totalForks = own.reduce((a, r) => a + r.forks_count, 0);
    const stRepos = $('#stRepos'), stStars = $('#stStars'), stForks = $('#stForks'), stFoll = $('#stFollowers');
    if (stRepos) countUp(stRepos, own.length);
    if (stStars) countUp(stStars, totalStars);
    if (stForks) countUp(stForks, totalForks);

    try {
      const u = await fetch('https://api.github.com/users/' + USER, { headers: { Accept: 'application/vnd.github+json' } });
      if (u.ok) {
        const d = await u.json();
        if (stFoll) countUp(stFoll, d.followers || 0);
      }
    } catch {}
  }
  loadGitHub();

  /* ============================================================
     7. EASTER EGGS
     ============================================================ */
  // a. tombol domain expansion di hero
  const btnExpand = $('#btnExpand');
  if (btnExpand) btnExpand.addEventListener('click', () => {
    window.jjkDomain && window.jjkDomain('領 地 展 開 · DOMAIN');
    const hero = $('.hero-bg');
    if (hero) {
      hero.style.transition = 'opacity .2s';
      hero.style.opacity = '1';
      setTimeout(() => { hero.style.transition = 'opacity 1.2s'; hero.style.opacity = '.5'; }, 220);
    }
    // scroll ke games
    setTimeout(() => {
      const g = $('#games');
      if (g) g.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }, 700);
  });

  // b. klik logo -> semboyan
  const logo = $('.nav-logo');
  if (logo) logo.addEventListener('click', e => {
    if ((e.metaKey || e.ctrlKey) || reduced) return;
    e.preventDefault();
    window.jjkDomain && window.jjkDomain('技 術 順 転');
    window.jjkToast && window.jjkToast('Jujutsu Kaisar butuh 1-win get gojo ✦', 'good');
  });

  // c. ketik "domain" untuk memicu domain expansion
  (function konami() {
    const KEY = 'domainexpansion';
    let buf = '';
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      buf = (buf + e.key.toLowerCase()).slice(-KEY.length);
      if (buf === KEY) {
        buf = '';
        window.jjkDomain && window.jjkDomain('呪 術 廻 戦 · 200');
        window.jjkToast && window.jjkToast('Easter egg aktif: ketik "domain" lagi kapan saja.', 'good');
      }
    });
  })();

  // d. konami code: ↑ ↑ ↓ ← → ← → B A
  (function konamiCode() {
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
          window.jjkToast && window.jjkToast('Konami! Cursed energy maksimal ⚡', 'good');
          if (!reduced) burst();
        }
      } else {
        pos = (k === SEQ[0]) ? 1 : 0;
      }
    });
    function burst() {
      const g = $('#games');
      if (g) g.scrollIntoView({ behavior: 'smooth' });
      const tab = $('.game-tab[data-tab="gacha"]');
      if (tab) setTimeout(() => tab.click(), 500);
    }
  })();

  // e. klik kartu email -> copy email
  const mailCard = $('#copyMail');
  if (mailCard) mailCard.addEventListener('click', e => {
    e.preventDefault();
    const mail = 'moch.bismap@gmail.com';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(mail)
        .then(() => window.jjkToast && window.jjkToast('Email disalin: ' + mail, 'good'))
        .catch(() => { window.location.href = 'mailto:' + mail; });
    } else {
      window.location.href = 'mailto:' + mail;
    }
  });

  /* ============================================================
     8. TAHUN FOOTER + DEEP LINK KE TAB GAME
     ============================================================ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (window.location.hash === '#games') {
    const tab = $('.game-tab[data-tab="gacha"]');
    if (tab) setTimeout(() => tab.click(), 400);
  }
})();