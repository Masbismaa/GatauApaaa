/* ============================================================
   GAMES.JS — Domain Gacha · Ujian Penyihir · Binding Vow
   Semua state disimpan di localStorage.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const rnd = n => Math.floor(Math.random() * n);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- toast ---------- */
  const stack = $('#toastStack');
  function toast(msg, kind = '') {
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }
  window.jjkToast = toast;

  /* ---------- domain expansion overlay ---------- */
  const overlay = $('#domainOverlay');
  let overlayBusy = false;
  function domainExpansion(sub = '呪 領 地 展 開') {
    if (!overlay || overlayBusy) return;
    overlayBusy = true;
    $('#domainSub').textContent = sub;
    overlay.classList.add('on');
    setTimeout(() => { overlay.classList.remove('on'); overlayBusy = false; }, 1500);
  }
  window.jjkDomain = domainExpansion;

  /* ---------- copy helper ---------- */
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt)
        .then(() => toast('Disalin ke clipboard', 'good'))
        .catch(() => toast('Gagal menyalin', 'bad'));
    } else {
      toast('Copy butuh koneksi HTTPS', 'bad');
    }
  }
  window.jjkCopy = copyText;

  /* ============================================================
     TABS
     ============================================================ */
  $$('.game-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.game-tab').forEach(b => b.classList.remove('active'));
      $$('.game-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('#panel-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  /* ============================================================
     1. DOMAIN GACHA (slot machine)
     ============================================================ */
  const SYMBOLS = [
    { icon: '👁️', name: 'Mata Kutukan', pay: 22 },
    { icon: '🕸️', name: 'Jaring Laba', pay: 18 },
    { icon: '💀', name: 'Kematian',     pay: 18 },
    { icon: '🔥', name: 'Api',          pay: 20 },
    { icon: '⚡', name: 'Kilat',        pay: 20 },
    { icon: '🩸', name: 'Darah',        pay: 24 },
    { icon: '🎴', name: 'Talisman',     pay: 30 },
    { icon: '🐉', name: 'Naga Kutuk',   pay: 45 },
    { icon: '⛩️', name: 'Kuil',         pay: 50 },
    { icon: '🌑', name: 'Langit Gelap', pay: 70 }
  ];
  const WEIGHTS = [12, 14, 14, 13, 13, 12, 10, 8, 8, 6];
  const TOTAL_W = WEIGHTS.reduce((a, w) => a + w, 0);
  function rollSymbol() {
    let r = Math.random() * TOTAL_W;
    for (let i = 0; i < SYMBOLS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return SYMBOLS[i]; }
    return SYMBOLS[0];
  }

  const MAX_CE = 100;
  const SPIN_COST = 20;

  const G = {
    energy:  store.get('jjk_energy', MAX_CE),
    spins:   store.get('jjk_spins', 0),
    best:    store.get('jjk_best', 0),
    domains: store.get('jjk_domains', 0),
    busy:    false,
    auto:    false
  };

  const reels    = $$('#reels .reel');
  const elEnergy = $('#gEnergy'), elBar = $('#gEnergyBar');
  const elSpins  = $('#gSpins'), elBest = $('#gBest'), elDomains = $('#gDomains');
  const elResult = $('#gachaResult'), elLog = $('#gachaLog');
  const btnSpin  = $('#btnSpin'), btnAuto = $('#btnAuto');

  function saveG() {
    store.set('jjk_energy', G.energy);
    store.set('jjk_spins', G.spins);
    store.set('jjk_best', G.best);
    store.set('jjk_domains', G.domains);
  }
  function renderG() {
    if (elEnergy) elEnergy.textContent = Math.floor(G.energy);
    if (elBar) elBar.style.width = (G.energy / MAX_CE * 100) + '%';
    if (elSpins) elSpins.textContent = G.spins;
    if (elBest) elBest.textContent = G.best;
    if (elDomains) elDomains.textContent = G.domains;
    if (btnSpin) btnSpin.disabled = G.busy || G.energy < SPIN_COST;
    if (btnAuto) btnAuto.disabled = G.busy;
  }
  function logG(msg, val) {
    if (!elLog) return;
    const d = document.createElement('div');
    const span = document.createElement('span');
    const b = document.createElement('b');
    span.textContent = msg;
    b.textContent = (val > 0 ? '+' : '') + val + ' CE';
    d.append(span, b);
    elLog.prepend(d);
    while (elLog.children.length > 14) elLog.lastElementChild.remove();
  }
  function showResult(tier, cls, title, sub) {
    if (!elResult) return;
    elResult.innerHTML =
      '<div><span class="tier ' + cls + '">' + tier + '</span>' +
      '<p class="result-title">' + title + '</p>' +
      '<p class="result-sub">' + sub + '</p></div>';
  }

  async function spin() {
    if (G.busy) return;
    if (G.energy < SPIN_COST) { toast('Energi kutukan kurang. Tunggu dipulihkan.', 'bad'); return; }

    G.busy = true;
    G.energy -= SPIN_COST;
    G.spins++;
    renderG();

    const landed = [rollSymbol(), rollSymbol(), rollSymbol()];
    reels.forEach(r => r.classList.add('spinning'));

    const STOP_AT = [13, 17, 21];
    for (let t = 0; t < STOP_AT[2]; t++) {
      reels.forEach((r, i) => { if (t < STOP_AT[i]) r.textContent = rollSymbol().icon; });
      await wait(70);
    }
    reels.forEach((r, i) => {
      r.textContent = landed[i].icon;
      r.classList.remove('spinning');
    });
    const allSame = landed[0].name === landed[1].name && landed[1].name === landed[2].name;
    const pairIdx = [0, 1].find(i => landed[i].name === landed[i + 1].name);
    if (allSame) reels.forEach(r => r.classList.add('win'));
    else if (pairIdx !== undefined) reels[pairIdx].classList.add('win');

    let win = 0, tier = 'ZONK', cls = 'tier-common', sub = '';
    const strip = landed.map(l => l.icon).join(' ');

    if (allSame) {
      const s = landed[0];
      win = Math.round(s.pay * 6);
      if (s.pay >= 50) {
        tier = 'DOMAIN EXPANSION!'; cls = 'tier-domain';
        domainExpansion('特 級 · 特 級'); G.domains++;
      } else if (s.pay >= 30) {
        tier = 'SPECIAL GRADE'; cls = 'tier-special';
        domainExpansion('術 式 開 発');
      } else {
        tier = 'EPIC PULL'; cls = 'tier-special';
      }
      sub = 'Tiga <b>' + s.name + '</b> sejajar. Teknik kutukan aktif, energi melonjak.';
    } else if (pairIdx !== undefined) {
      const p = landed[pairIdx];
      win = Math.round(p.pay * 2.2);
      const rare = win >= 45;
      tier = rare ? 'RARE' : 'UNCOMMON';
      cls = rare ? 'tier-rare' : 'tier-common';
      sub = 'Dua <b>' + p.name + '</b> sejajar. Cukup untuk memperkuat teknik.';
    } else {
      sub = 'Tidak ada yang sejajar. Energi dikembalikan ke pool, coba lagi.';
    }

    if (win > 0) {
      G.energy = Math.min(MAX_CE, G.energy + win);
      if (win > G.best) G.best = win;
      logG(tier + ' — ' + strip, win);
      toast(tier + '! +' + win + ' CE', 'good');
    } else {
      logG('Miss — ' + strip, -SPIN_COST);
    }

    showResult(tier, cls, strip, sub);
    saveG();
    G.busy = false;
    renderG();
    if (G.auto) setTimeout(spin, 420);
  }

  if (btnSpin) btnSpin.addEventListener('click', () => {
    G.auto = false;
    if (btnAuto) btnAuto.querySelector('span').textContent = '⚡ AUTO ×10';
    spin();
  });
  if (btnAuto) btnAuto.addEventListener('click', () => {
    G.auto = !G.auto;
    btnAuto.querySelector('span').textContent = G.auto ? '⏹ STOP AUTO' : '⚡ AUTO ×10';
    if (G.auto && !G.busy) spin();
  });
  const btnResetG = $('#btnResetG');
  if (btnResetG) btnResetG.addEventListener('click', () => {
    G.energy = MAX_CE; G.spins = 0; G.best = 0; G.domains = 0; G.auto = false;
    if (btnAuto) btnAuto.querySelector('span').textContent = '⚡ AUTO ×10';
    if (elLog) elLog.innerHTML = '';
    reels.forEach(r => { r.classList.remove('win', 'spinning'); r.textContent = '❔'; });
    showResult('DI RESET', 'tier-common', 'Energi kutukan penuh', 'Semua rekor gacha dihapus. Mulai lagi dari awal.');
    saveG(); renderG(); toast('Gacha direset', 'good');
  });

  (function buildKey() {
    const key = $('#symbolKey');
    if (!key) return;
    key.innerHTML = SYMBOLS
      .map(s => '<span title="' + s.name + ' — hadiah ' + s.pay + ' CE">' + s.icon + '</span>')
      .join('');
  })();

  /* ============================================================
     2. UJIAN PENYIHIR (quiz)
     ============================================================ */
  const QUIZ = [
    { q: 'Gojo Satoru dipanggil apa di dunia penyihir?',
      o: ['Jujutsu Kaisar', 'Penyihir Bayangan', 'Raja Kutukan', 'Penyihir Super'], a: 0,
      e: 'Satoru Gojo adalah penyihir terkuat, dijuluki "Jujutsu Kaisar" — julukan yang diwariskan sejak era Sukuna.' },

    { q: 'Black Flash itu apa?',
      o: ['Serangan black hole', 'Manipulasi ruang waktu', 'Meletakkan energi 2,5 kali lipat dalam satu hantaman', 'Senjata kutukan'], a: 2,
      e: 'Teknik Yuji Itadori: memampatkan energi kutukan 2,5 kali base dalam satu hantaman. Hasilnya nyaris mustahil dan hanya segelintir orang yang bisa.' },

    { q: '"Malevolent Shrine" adalah Domain Expansion milik siapa?',
      o: ['Ryomen Sukuna', 'Megumi Fushiguro', 'Kento Nanami', 'Aoi Todo'], a: 0,
      e: 'Sukuna membuka Malevolent Shrine, domain tanpa barrier yang langsung memberi efek ke seluruh arena.' },

    { q: 'Teknik bawaan Megumi Fushiguro adalah?',
      o: ['Blue', 'Ten Shadows Technique', 'Straw Doll Technique', 'Cursed Reversal'], a: 1,
      e: '十種影法術 — Ten Shadows Technique: memanggil 10 shikigami lewat bayangan.' },

    { q: 'Nobara Kugisaki memakai teknik apa?',
      o: ['Straw Doll Technique', 'Clan Technique', 'Black Flash', 'Innate Domain'], a: 0,
      e: 'Teknik Boneka Jerami: menusuk boneka jerami dengan paku dan palu, sehingga korban ikut merasakan sakitnya dari jarak jauh.' },

    { q: 'Film "Jujutsu Kaisen 0" menceritakan siapa?',
      o: ['Gojo muda & Riko Amanai', 'Yuji melawan Sukuna', 'Geto melawan Gojo', 'Toji melawan klan Zenin'], a: 0,
      e: 'Film JJK 0 mengisahkan Gojo muda dan Riko Amanai, sekaligus penjelasan hubungan Yuji dengan Riko.' },

    { q: 'Toji Fushiguro dijuluki "Sorcerer Killer" karena...?',
      o: ['Energi kutukannya paling besar', 'Sama sekali tanpa energi kutukan, tapi brutal', 'Menyegel kutukan sekuat Gojo', 'Memakai armor kutukan'], a: 1,
      e: 'Toji tidak punya energi kutukan sama sekali, tapi kecepatan serta kelihaian fisiknyalah yang membuat ia bisa membunuh penyihir.' },

    { q: '"Unlimited Void" adalah Domain Expansion...?',
      o: ['Dari Yuji Itadori', 'Dari Gojo Satoru', 'Dari Megumi Fushiguro', 'Dari Sukuna'], a: 1,
      e: 'Unlimited Void membanjiri target dengan informasi tak hingga sehingga tubuh dan gerak target lumpuh total.' },

    { q: 'Teknik bawaan Toge Inumaki adalah...?',
      o: ['Cursed Speech', 'Ten Shadows', 'Ratio Technique', 'Straw Doll Technique'], a: 0,
      e: '術言術 — Cursed Speech: target yang mendengar kata-katanya bisa dipaksa menyeimbangkan diri atau dibunuh.' },

    { q: 'Kota tempat berlangsungnya film "Jujutsu Kaisen 0" adalah...?',
      o: ['Kyoto', 'Osaka', 'Tokyo', 'Nagoya'], a: 2,
      e: 'Cerita berlangsung di Tokyo tahun 2006, saat Gojo masih murid SMA dan kejadian Star Demon Incident tinggal beberapa tahun lagi.' },

    { q: 'Dalam Chainsaw Man, kekuatan Makima adalah...?',
      o: ['Kontrol', 'Kekuatan api', 'Penyembuhan', 'Kecepatan'], a: 0,
      e: 'Makima punya kekuatan "Control": memengaruhi pikiran orang supaya ia melihat dia sebagai kebenaran absolut.' },

    { q: 'Tanjiro Kamado memakai pernapasan apa?',
      o: ['Flame Breathing', 'Thunderclap and Flash', 'Hinokami Kagura', 'Water Surface Breathing'], a: 2,
      e: 'Hinokami Kagura, gaya pernapasan air yang diwariskan dari kakeknya, Tengen Hinokami, di Pegunungan Katsuraagi.' }
  ];

  const CIRC = 2 * Math.PI * 24;
  let qState = null;
  let qTimer = null;

  const elQStart = $('#quizStart'), elQPlay = $('#quizPlay'), elQEnd = $('#quizEnd');
  const elQText = $('#qText'), elQOpts = $('#qOptions'), elQNext = $('#btnNext');
  const elQIndex = $('#qIndex'), elQScore = $('#qScore'), elQStreak = $('#qStreak'), elQCorrect = $('#qCorrect');
  const elQBar = $('#qBar'), elQArc = $('#qArc'), elQTime = $('#qTime'), elQStreakTag = $('#qStreakTag');
  const btnStartQuiz = $('#btnStartQuiz');

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function setTimerUI() {
    const p = Math.max(0, qState.time / 20);
    elQArc.style.strokeDashoffset = String(CIRC * (1 - p));
    elQArc.style.stroke = qState.time <= 5 ? 'var(--crimson)' : 'var(--magenta)';
    elQTime.textContent = String(Math.max(0, qState.time));
  }
  function renderQ() {
    elQIndex.textContent = (qState.i + 1) + '/' + QUIZ.length;
    elQScore.textContent = String(qState.score);
    elQStreak.textContent = String(qState.streak);
    elQCorrect.textContent = String(qState.correct);
    elQBar.style.width = (qState.i / QUIZ.length * 100) + '%';
  }

  function startQuiz() {
    qState = {
      order: shuffle([...QUIZ]).map(q => {
        const correctText = q.o[q.a];
        const opts = shuffle([...q.o]);
        return { q: q.q, o: opts, a: opts.indexOf(correctText), e: q.e };
      }),
      i: 0, score: 0, streak: 0, best: 0, correct: 0, answers: [], time: 20
    };
    elQStart.style.display = 'none';
    elQEnd.style.display = 'none';
    elQEnd.innerHTML = '';
    elQPlay.style.display = 'block';
    renderQ();
    askQ();
  }

  function askQ() {
    qState.time = 20;
    const q = qState.order[qState.i];
    elQStreakTag.textContent = 'STREAK ' + qState.streak + (qState.streak >= 3 ? ' 🔥' : '');
    elQStreakTag.classList.toggle('hot', qState.streak >= 3);
    elQText.textContent = (qState.i + 1) + '. ' + q.q;
    elQOpts.innerHTML = q.o
      .map((o, i) => '<button class="q-option" data-i="' + i + '"><i>' + 'ABCD'[i] + '</i><span></span></button>')
      .join('');
    $$('.q-option', elQOpts).forEach(b => {
      b.querySelector('span').textContent = q.o[+b.dataset.i];
      b.addEventListener('click', () => answer(+b.dataset.i, q));
    });
    elQNext.disabled = true;
    elQNext.querySelector('span').textContent = qState.i === QUIZ.length - 1 ? 'Hasil →' : 'Next →';
    setTimerUI();
    clearInterval(qTimer);
    qTimer = setInterval(() => {
      qState.time--;
      setTimerUI();
      if (qState.time <= 0) { clearInterval(qTimer); answer(-1, q, true); }
    }, 1000);
  }

  function answer(pick, q, timeout = false) {
    clearInterval(qTimer);
    const ok = pick === q.a;
    $$('.q-option', elQOpts).forEach(b => {
      const i = +b.dataset.i;
      b.disabled = true;
      if (i === q.a) b.classList.add('correct');
      else if (i === pick) b.classList.add('wrong');
    });
    if (ok) {
      qState.correct++;
      qState.streak++;
      qState.best = Math.max(qState.best, qState.streak);
      const bonus = Math.min(15, (qState.streak - 1) * 5);
      qState.score += 10 + bonus;
      toast(bonus ? 'Benar! +' + (10 + bonus) + ' (bonus streak)' : 'Benar! +10', 'good');
    } else {
      qState.streak = 0;
      toast(timeout ? 'Waktu habis!' : 'Kurang tepat.', 'bad');
    }
    qState.answers.push({ ok, correct: q.a, e: q.e });
    elQNext.disabled = false;
    renderQ();
  }

  function finishQuiz() {
    clearInterval(qTimer);
    elQPlay.style.display = 'none';
    elQEnd.style.display = 'block';
    const total = QUIZ.length, s = qState.score, c = qState.correct;
    let grade = 'GRADE 4', desc = 'Belum sightung kutukan. Tapi energi kutukanmu sudah menyala.', cls = 'tier-common';
    if (c === total) { grade = 'SPECIAL GRADE'; desc = 'Tidak ada kutukan yang bisa menghentikamu. Hollow Purple!'; cls = 'tier-domain'; }
    else if (c >= 10) { grade = 'GRADE 1'; desc = 'Penyihir andalan. Energi kutukanmu sudah alexandria.'; cls = 'tier-special'; }
    else if (c >= 7)  { grade = 'GRADE 2'; desc = 'Domain parsial terbuka. Tinggal dilatih biar penuh.'; cls = 'tier-special'; }
    else if (c >= 4)  { grade = 'GRADE 3'; desc = 'Asisten penyihir. Fondasinya sudah benar.'; }
    if (c === total) domainExpansion('完 璧 · 特 級');

    const icon = c === total ? '🏆' : c >= 10 ? '⚡' : c >= 7 ? '🔮' : c >= 4 ? '🌙' : '💤';
    elQEnd.innerHTML =
      '<div style="text-align:center">' +
        '<span class="tier ' + cls + '">' + grade + '</span>' +
        '<p class="result-title">' + icon + ' ' + s + ' poin</p>' +
        '<p class="result-sub">' + c + '/' + total + ' benar · best streak ' + qState.best + ' · ' + desc + '</p>' +
        '<div class="slot-controls" style="margin-top:1.2rem">' +
          '<button class="btn btn-primary" id="btnRetryQuiz"><span>🔁 Ulangi</span></button>' +
          '<button class="btn btn-ghost" id="btnShareQuiz"><span>Share ke X ↗</span></button>' +
          '<button class="btn btn-ghost" id="btnCopyQuiz"><span>Copy Hasil</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="quiz-review">' + qState.answers.map((a, i) =>
        '<div class="' + (a.ok ? 'ok' : 'no') + '">' +
          '<b>' + (i + 1) + '. ' + (a.ok ? '✓ Benar' : '✗ Salah') + '</b> — ' + qState.order[i].q + '<br />' +
          'Jawaban: <b>' + 'ABCD'[a.correct] + '. ' + qState.order[i].o[a.correct] + '</b><br />' +
          '<span style="opacity:.85">' + a.e + '</span>' +
        '</div>').join('') + '</div>';

    $('#btnRetryQuiz').addEventListener('click', startQuiz);
    $('#btnShareQuiz').addEventListener('click', () => {
      const txt = 'Ujian Penyihir: ' + s + ' poin (' + c + '/' + total + ' benar) — ' + grade + ' ⚡ #JujutsuKaisen #CursedDeveloper';
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
    $('#btnCopyQuiz').addEventListener('click', () => copyText(
      'Ujian Penyihir ⚡\nSkor: ' + s + ' poin\nBenar: ' + c + '/' + total + '\nGrade: ' + grade + '\nBest streak: ' + qState.best
    ));
  }

  if (btnStartQuiz) btnStartQuiz.addEventListener('click', startQuiz);
  if (elQNext) elQNext.addEventListener('click', () => {
    if (!qState) return;
    if (qState.i >= QUIZ.length - 1) { finishQuiz(); return; }
    qState.i++;
    renderQ();
    askQ();
  });

  /* ---------- HUD awal quiz ---------- */
  if (elQIndex) elQIndex.textContent = '1/' + QUIZ.length;
  if (elQTime) elQTime.textContent = '20';

  /* ============================================================
     3. BINDING VOW
     ============================================================ */
  const V = {
    count: store.get('jjk_vow', 0),
    win:   store.get('jjk_vowWin', 0),
    lose:  store.get('jjk_vowLose', 0),
    busy:  false
  };
  const elVC = $('#vCount'), elVW = $('#vWin'), elVL = $('#vLose');
  const elVR = $('#vowResult'), btnVow = $('#btnVow');

  function renderV() {
    if (elVC) elVC.textContent = V.count;
    if (elVW) elVW.textContent = V.win;
    if (elVL) elVL.textContent = V.lose;
    if (btnVow) btnVow.disabled = V.busy || G.energy < 10;
  }
  function saveV() {
    store.set('jjk_vow', V.count);
    store.set('jjk_vowWin', V.win);
    store.set('jjk_vowLose', V.lose);
  }
  function showVow(won, gained) {
    if (!elVR) return;
    if (won) {
      elVR.innerHTML =
        '<div><span class="tier tier-domain">SUMPAH BERJALAN</span>' +
        '<p class="result-title">⛓ Rantai Mengikat</p>' +
        '<p class="result-sub">Energi kutukan jadi <b>' + gained + ' CE</b>. Yang membayar ongkos adalah lawan.</p></div>';
      toast('Sumpah berhasil! Energi ' + G.energy + ' CE', 'good');
      domainExpansion('契 結 · 強');
    } else {
      elVR.innerHTML =
        '<div><span class="tier tier-common">RANTAI PATAH</span>' +
        '<p class="result-title">💀 Sumpah Gagal</p>' +
        '<p class="result-sub">Semua energi kutukan lenyap. Sumpah ini berbalik menyerang.</p></div>';
      toast('Sumpah gagal, energi habis.', 'bad');
    }
  }
  async function bindVow() {
    if (V.busy) return;
    if (G.energy < 10) { toast('Butuh minimal 10 CE untuk mengikat sumpah.', 'bad'); return; }
    V.busy = true;
    renderV();
    if (elVR) elVR.innerHTML =
      '<div><span class="tier tier-special">MENGIKAT…</span>' +
      '<p class="result-sub">Rantai mengencang. Sumpah yang sudah diikat tidak bisa dibatalkan.</p></div>';
    await wait(900);
    const won = Math.random() < 0.5;
    V.count++;
    let gained = 0;
    if (won) { V.win++; gained = Math.floor(G.energy * 2); G.energy = Math.min(MAX_CE, gained); }
    else { V.lose++; G.energy = 0; }
    showVow(won, gained);
    saveV(); saveG(); renderG();
    V.busy = false;
    renderV();
  }

  if (btnVow) btnVow.addEventListener('click', bindVow);
  const btnResetV = $('#btnResetV');
  if (btnResetV) btnResetV.addEventListener('click', () => {
    V.count = 0; V.win = 0; V.lose = 0;
    saveV();
    if (elVR) elVR.innerHTML =
      '<div><span class="tier tier-common">BELUM TERIKAT</span>' +
      '<p class="result-sub">Rantai diputus. Semua rekor sumpah hilang.</p></div>';
    renderV();
    toast('Rantai diputus', 'good');
  });

  /* ---------- regenerasi energi kutukan ---------- */
  setInterval(() => {
    if (G.energy < MAX_CE) {
      G.energy = Math.min(MAX_CE, G.energy + 1);
      renderG();
      if (V && !V.busy) renderV();
    }
  }, 1200);

  renderG();
  renderV();
})();