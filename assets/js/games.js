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
  const ico = id => '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>';

  /* ---------- toast ---------- */
  function toast(msg, kind = '') {
    const stack = $('#toasts');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = ico(kind === 'ok' ? 'i-check' : kind === 'no' ? 'i-alert' : 'i-info')
      + '<span></span>';
    el.querySelector('span').textContent = msg;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 2800);
    while (stack.children.length > 4) stack.firstElementChild.remove();
  }
  window.jjkToast = toast;

  /* ---------- domain expansion overlay ---------- */
  const overlay = $('#overlay');
  let overlayBusy = false;
  function domainExpansion(sub = '') {
    if (!overlay || overlayBusy) return;
    overlayBusy = true;
    const subEl = $('#overlaySub');
    if (subEl) subEl.textContent = sub;
    overlay.classList.add('on');
    setTimeout(() => { overlay.classList.remove('on'); overlayBusy = false; }, 1500);
  }
  window.jjkDomain = domainExpansion;

  /* ---------- copy ---------- */
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt)
        .then(() => toast('Disalin ke clipboard', 'ok'))
        .catch(() => toast('Gagal menyalin', 'no'));
    } else {
      toast('Copy butuh koneksi HTTPS', 'no');
    }
  }
  window.jjkCopy = copyText;

  /* ============================================================
     TABS
     ============================================================ */
  const tabs = $$('.arena-tabs [role="tab"]');
  function pickTab(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      const p = $('#' + t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
  }
  tabs.forEach(t => t.addEventListener('click', () => pickTab(t)));
  window.jjkTab = name => {
    const t = tabs.find(x => x.getAttribute('aria-controls') === 'p-' + name);
    if (t) pickTab(t);
  };

  /* ============================================================
     1. DOMAIN GACHA
     ============================================================ */
  const SYMBOLS = [
    { id: 'i-eye',     name: 'Mata Kutukan', pay: 22, w: 12 },
    { id: 'i-flame',   name: 'Api',         pay: 20, w: 13 },
    { id: 'i-bolt',    name: 'Kilat',       pay: 20, w: 13 },
    { id: 'i-droplet', name: 'Darah',       pay: 24, w: 12 },
    { id: 'i-skull',   name: 'Kematian',    pay: 18, w: 14 },
    { id: 'i-spark',   name: 'Tenacity',    pay: 18, w: 10 },
    { id: 'i-ticket',  name: 'Talisman',    pay: 30, w: 10 },
    { id: 'i-star',    name: 'Bintang Kutuk', pay: 45, w: 8 },
    { id: 'i-target',  name: 'Langit Gelap',  pay: 70, w: 8 }
  ];
  const TOTAL_W = SYMBOLS.reduce((a, s) => a + s.w, 0);
  function rollSymbol() {
    let r = Math.random() * TOTAL_W;
    for (const s of SYMBOLS) { r -= s.w; if (r <= 0) return s; }
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

  const elEnergy = $('#gEnergy'), elBar = $('#gEnergyBar');
  const elSpins  = $('#gSpins'),  elBest = $('#gBest'), elDomains = $('#gDomain');
  const elTag = $('#vTag'), elTitle = $('#vTitle'), elText = $('#vText');
  const elLog = $('#log');
  const btnSpin = $('#spin'), btnAuto = $('#auto'), btnResetG = $('#resetG');
  const reels = $$('#reels .reel');

  function setReel(r, sym) { r.innerHTML = ico(sym ? sym.id : 'i-spark'); }

  function paintReels(landed) {
    reels.forEach((r, i) => setReel(r, landed ? landed[i] : SYMBOLS[i]));
  }

  function autoLabel(on) {
    btnAuto.innerHTML = ico(on ? 'i-close' : 'i-play') + '<span></span>';
    btnAuto.querySelector('span').textContent = on ? 'Stop' : 'Auto';
  }

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
    if (btnAuto) btnAuto.disabled = G.busy && !G.auto;
  }
  function logG(msg, val) {
    if (!elLog) return;
    const d = document.createElement('div');
    const s = document.createElement('span');
    const b = document.createElement('b');
    s.textContent = msg;
    b.textContent = (val > 0 ? '+' : '') + val + ' CE';
    d.append(s, b);
    elLog.prepend(d);
    while (elLog.children.length > 12) elLog.lastElementChild.remove();
  }
  function verdict(tier, cls, iconId, title, text) {
    if (!elTag) return;
    elTag.className = 'tag' + (cls ? ' ' + cls : '');
    elTag.textContent = tier;
    elTitle.innerHTML = ico(iconId) + '<span></span>';
    elTitle.querySelector('span').textContent = title;
    elText.textContent = text;
  }

  async function spin() {
    if (G.busy) return;
    if (G.energy < SPIN_COST) { toast('Energi kutukan kurang, tunggu dipulihkan.', 'no'); return; }

    G.busy = true;
    G.energy -= SPIN_COST;
    G.spins++;
    renderG();

    const landed = [rollSymbol(), rollSymbol(), rollSymbol()];
    reels.forEach(r => r.classList.add('roll'));

    const stopAt = [13, 17, 21];
    for (let t = 0; t < stopAt[2]; t++) {
      reels.forEach((r, i) => { if (t < stopAt[i]) setReel(r, rollSymbol()); });
      await wait(70);
    }
    reels.forEach((r, i) => { setReel(r, landed[i]); r.classList.remove('roll'); });

    const allSame = landed[0].name === landed[1].name && landed[1].name === landed[2].name;
    const pairIdx = [0, 1].find(i => landed[i].name === landed[i + 1].name);
    if (allSame) reels.forEach(r => r.classList.add('hit'));
    else if (pairIdx !== undefined) reels[pairIdx].classList.add('hit');

    let win = 0, tier = 'Miss', cls = '', icon = 'i-info';

    if (allSame) {
      const s = landed[0];
      win = Math.round(s.pay * 6);
      if (s.pay >= 70)      { tier = 'Domain Expansion'; cls = 'win'; icon = 'i-target'; domainExpansion('特 級 · 特 級'); G.domains++; }
      else if (s.pay >= 45) { tier = 'Special Grade';    cls = 'win'; icon = 'i-star';  domainExpansion('術 式 開 発'); }
      else if (s.pay >= 30) { tier = 'Teknik Aktif';      cls = 'win'; icon = 'i-spark'; }
      else                  { tier = 'Pull Epik';         cls = 'win'; icon = 'i-flame'; }
    } else if (pairIdx !== undefined) {
      const p = landed[pairIdx];
      win = Math.round(p.pay * 2.2);
      const rare = win >= 45;
      tier = rare ? 'Rare' : 'Uncommon';
      cls = rare ? 'win' : '';
      icon = rare ? 'i-moon' : 'i-droplet';
    }

    if (win > 0) {
      G.energy = Math.min(MAX_CE, G.energy + win);
      if (win > G.best) G.best = win;
      const names = landed.map(l => l.name).join(' + ');
      logG(tier + ' — ' + names, win);
      toast(tier + ', +' + win + ' CE', 'ok');
    } else {
      logG('Miss — ' + landed.map(l => l.name).join(' + '), -SPIN_COST);
    }

    verdict(
      win > 0 ? tier : 'Miss', cls, icon,
      landed.map(l => l.name).join(' + '),
      win > 0 ? 'Energi kutukan +' + win + ' CE. Rekor terbaik ' + G.best + ' CE.'
              : 'Tidak ada simbol yang sejajar. Energi dikembalikan ke pool.'
    );
    saveG();
    G.busy = false;
    renderG();
    if (G.auto) setTimeout(spin, 420);
  }

  if (btnSpin) btnSpin.addEventListener('click', () => { G.auto = false; autoLabel(false); spin(); });
  if (btnAuto) btnAuto.addEventListener('click', () => {
    G.auto = !G.auto;
    autoLabel(G.auto);
    if (G.auto && !G.busy) spin();
  });
  if (btnResetG) btnResetG.addEventListener('click', () => {
    G.energy = MAX_CE; G.spins = 0; G.best = 0; G.domains = 0; G.auto = false;
    autoLabel(false);
    if (elLog) elLog.innerHTML = '';
    reels.forEach((r, i) => { r.classList.remove('hit', 'roll'); setReel(r, SYMBOLS[i]); });
    verdict('Reset', '', 'i-refresh', 'Energi kutukan penuh', 'Semua rekor gacha dihapus.');
    saveG(); renderG();
    toast('Rekor gacha dihapus', 'ok');
  });

  paintReels();
  autoLabel(false);
  (function buildLegend() {
    const key = $('#legend');
    if (!key) return;
    key.innerHTML = SYMBOLS
      .map(s => '<span tabindex="0" role="img" aria-label="' + s.name + ', hadiah ' + s.pay + ' CE" title="'
        + s.name + ' — ' + s.pay + ' CE">' + ico(s.id) + '</span>')
      .join('');
  })();
  verdict('Siap', '', 'i-play', 'Tekan spin untuk mulai', 'Energi pulih satu poin setiap 1,2 detik.');

  /* ============================================================
     2. UJIAN PENYIHIR
     ============================================================ */
  const QUIZ = [
    { q: 'Satoru Gojo dijuluki apa?',
      o: ['Jujutsu Kaisar', 'Penyihir Bayangan', 'Raja Kutukan', 'Penyihir Super'], a: 0,
      e: 'Julukan itu diwariskan sejak era Sukuna dan melekat pada Gojo sebagai penyihir terkuat.' },

    { q: 'Black Flash adalah...?',
      o: ['Serangan black hole', 'Manipulasi ruang waktu', 'Menekan energi 2,5 kali lipat dalam satu hantaman', 'Senjata kutukan'], a: 2,
      e: 'Teknik Yuji Itadori: energi kutukan dipadatkan 2,5 kali lipat dalam satu hantaman. Hasilnya nyaris mustahil, hanya segelintir penyihir yang bisa.' },

    { q: 'Malevolent Shrine adalah Domain Expansion milik...?',
      o: ['Ryomen Sukuna', 'Megumi Fushiguro', 'Kento Nanami', 'Aoi Todo'], a: 0,
      e: 'Sukuna membuka domain tanpa barrier, jadi efeknya langsung terasa di seluruh arena tanpa penutup.' },

    { q: 'Teknik bawaan Megumi Fushiguro adalah...?',
      o: ['Blue', 'Ten Shadows Technique', 'Straw Doll Technique', 'Cursed Reversal'], a: 1,
      e: '十種影法術, Ten Shadows Technique: memanggil sepuluh shikigami lewat bayangan.' },

    { q: 'Nobara Kugisaki memakai teknik...?',
      o: ['Straw Doll Technique', 'Clan Technique', 'Black Flash', 'Innate Domain'], a: 0,
      e: 'Boneka Jerami: menusuk boneka jerami dengan paku dan palu sehingga korban merasakan sakitnya dari jarak jauh.' },

    { q: 'Film "Jujutsu Kaisen 0" menceritakan...?',
      o: ['Gojo muda dan Riko Amanai', 'Yuji melawan Sukuna', 'Geto melawan Gojo', 'Toji melawan klan Zenin'], a: 0,
      e: 'Film ini mengisahkan Gojo muda dan Riko Amanai, sekaligus asal-usul hubungan Yuji dengan Riko.' },

    { q: 'Toji Fushiguro dijuluki "Sorcerer Killer" karena...?',
      o: ['Energi kutukannya paling besar', 'Tanpa energi kutukan sama sekali, tapi fisikanya superior', 'Menyegel kutukan sekuat Gojo', 'Memakai armor kutukan'], a: 1,
      e: 'Toji tidak punya energi kutukan, tetapi kecepatan dan kelihaian fisiknya membuat ia bisa mengalahkan penyihir.' },

    { q: 'Unlimited Void adalah Domain Expansion...?',
      o: ['Yuji Itadori', 'Gojo Satoru', 'Megumi Fushiguro', 'Ryomen Sukuna'], a: 1,
      e: 'Gojo membanjiri target dengan informasi tak hingga sehingga tubuh dan gerak target ikut lumpuh.' },

    { q: 'Teknik bawaan Toge Inumaki adalah...?',
      o: ['Cursed Speech', 'Ten Shadows Technique', 'Ratio Technique', 'Straw Doll Technique'], a: 0,
      e: '術言術, Cursed Speech: kalimat yang ia ucapkan bisa memaksa target menyeimbangkan energi kutukannya.' },

    { q: 'Kota tempat berlangsungnya film "Jujutsu Kaisen 0" adalah...?',
      o: ['Kyoto', 'Osaka', 'Tokyo', 'Nagoya'], a: 2,
      e: 'Cerita berlangsung di Tokyo tahun 2006, saat Gojo masih murid SMA.' },

    { q: 'Ryomen Sukuna dikenal sebagai...?',
      o: ['Raja Kutukan Pertama', 'Raja Kutukan Kedua', 'Raja Kutukan Ketiga', 'Raja Kutukan Keempat'], a: 3,
      e: 'Sukuna adalah Raja Kutukan Keempat, dikenal sebagai Raja Kutukan dari enam abad lalu.' },

    { q: 'Teknik yang dipakai Aoi Todo adalah...?',
      o: ['Black Flash', 'Boogie Woogie', 'Cursed Reversal', 'Ratio Technique'], a: 1,
      e: 'Boogie Woogie: memindahkan dua titik sekaligus lewat triage, jadi posisi korban ikut bergeser.' }
  ];

  const CIRC = 2 * Math.PI * 23;
  const Q_TIME = 20;
  let qState = null;
  let qTimer = null;

  const elIntro = $('#qIntro'), elPlay = $('#qPlay'), elEnd = $('#qEnd');
  const elQText = $('#qText'), elQOpts = $('#qOpts'), elNext = $('#next'), elNextLabel = $('#nextLabel');
  const elIndex = $('#qIndex'), elScore = $('#qScore'), elStreak = $('#qStreak'), elCorrect = $('#qCorrect');
  const elQBar = $('#qBar'), elArc = $('#qArc'), elTime = $('#qTime'), elStreakTag = $('#qStreakTag');
  const btnStart = $('#startQuiz');

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function setTimerUI() {
    const p = Math.max(0, qState.time / Q_TIME);
    elArc.style.strokeDashoffset = String(CIRC * (1 - p));
    elArc.style.stroke = qState.time <= 5 ? '#ef4444' : 'var(--accent)';
    elTime.textContent = String(Math.max(0, qState.time));
  }
  function renderQ() {
    elIndex.textContent = (qState.i + 1) + '/' + QUIZ.length;
    elScore.textContent = String(qState.score);
    elStreak.textContent = String(qState.streak);
    elCorrect.textContent = String(qState.correct);
    elQBar.style.width = (qState.i / QUIZ.length * 100) + '%';
  }

  function startQuiz() {
    qState = {
      order: shuffle([...QUIZ]).map(q => {
        const correctText = q.o[q.a];
        const opts = shuffle([...q.o]);
        return { q: q.q, o: opts, a: opts.indexOf(correctText), e: q.e };
      }),
      i: 0, score: 0, streak: 0, best: 0, correct: 0, answers: [], time: Q_TIME
    };
    elIntro.hidden = true;
    elEnd.hidden = true;
    elEnd.innerHTML = '';
    elPlay.hidden = false;
    renderQ();
    askQ();
  }

  function askQ() {
    qState.time = Q_TIME;
    const q = qState.order[qState.i];
    elStreakTag.textContent = 'streak ' + qState.streak;
    elStreakTag.classList.toggle('hot', qState.streak >= 3);
    elQText.textContent = (qState.i + 1) + '. ' + q.q;
    elQOpts.innerHTML = '';
    q.o.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'qopt';
      b.innerHTML = '<i>' + 'ABCD'[i] + '</i><span></span>';
      b.querySelector('span').textContent = opt;
      b.addEventListener('click', () => answer(i, q));
      elQOpts.appendChild(b);
    });
    elNext.disabled = true;
    elNextLabel.textContent = qState.i === QUIZ.length - 1 ? 'Hasil' : 'Berikutnya';
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
    $$('.qopt', elQOpts).forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add('ok');
      else if (i === pick) b.classList.add('no');
    });
    if (ok) {
      qState.correct++;
      qState.streak++;
      qState.best = Math.max(qState.best, qState.streak);
      const bonus = Math.min(15, (qState.streak - 1) * 5);
      qState.score += 10 + bonus;
      toast(bonus ? 'Benar, +' + (10 + bonus) + ' (bonus streak)' : 'Benar, +10', 'ok');
    } else {
      qState.streak = 0;
      toast(timeout ? 'Waktu habis.' : 'Kurang tepat.', 'no');
    }
    qState.answers.push({ ok, correct: q.a });
    elNext.disabled = false;
    renderQ();
  }

  function finishQuiz() {
    clearInterval(qTimer);
    elPlay.hidden = true;
    elEnd.hidden = false;
    const total = QUIZ.length, s = qState.score, c = qState.correct;
    let grade = 'Grade 4', desc = 'Fondasi baru mulai. Sempat lanjut.', icon = 'i-moon', cls = '';
    if (c === total)      { grade = 'Special Grade'; desc = 'Semua soal benar. Tidak ada yang bisa menghentikan.'; icon = 'i-trophy'; cls = 'win'; }
    else if (c >= 10)    { grade = 'Grade 1'; desc = 'Penyihir andalan, tekniknya sudah andal.'; icon = 'i-bolt'; cls = 'win'; }
    else if (c >= 7)     { grade = 'Grade 2'; desc = 'Domain terbuka parsial, tinggal dilatih sampai penuh.'; icon = 'i-spark'; cls = 'win'; }
    else if (c >= 4)     { grade = 'Grade 3'; desc = 'Fondasinya sudah benar, bagian teknis masih perlu deepen.'; icon = 'i-eye'; }
    if (c === total) domainExpansion('完 璧 · 特 級');

    elEnd.innerHTML =
      '<div class="verdict">' +
        '<span class="tag' + (cls ? ' ' + cls : '') + '">' + grade + '</span>' +
        '<h4>' + ico(icon) + '<span></span></h4>' +
        '<p><b>' + s + ' poin</b> dari ' + c + '/' + total + ' benar. Best streak ' + qState.best + '. ' + desc + '</p>' +
        '<div class="row" style="margin-top:1.1rem">' +
          '<button class="btn btn-primary btn-sm" id="qRetry">' + ico('i-refresh') + '<span>Ulangi</span></button>' +
          '<button class="btn btn-sm" id="qShare">' + ico('i-share') + '<span>Share</span></button>' +
          '<button class="btn btn-sm" id="qCopy">' + ico('i-copy') + '<span>Copy hasil</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="review">' + qState.answers.map((a, i) =>
        '<div class="' + (a.ok ? 'ok' : 'no') + '">' +
          '<b>' + (i + 1) + '. ' + (a.ok ? 'Benar' : 'Salah') + '</b> — ' + qState.order[i].q +
          '<br />Jawaban: <b>' + 'ABCD'[a.correct] + '. ' + qState.order[i].o[a.correct] + '</b>' +
          '<br />' + qState.order[i].e +
        '</div>').join('') + '</div>';

    $('#qRetry').addEventListener('click', startQuiz);
    $('#qShare').addEventListener('click', () => {
      const txt = 'Ujian Penyihir: ' + s + ' poin (' + c + '/' + total + ' benar), ' + grade + '. #JujutsuKaisen';
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
    $('#qCopy').addEventListener('click', () => copyText(
      'Ujian Penyihir\nSkor: ' + s + ' poin\nBenar: ' + c + '/' + total + '\nGrade: ' + grade + '\nBest streak: ' + qState.best
    ));
  }

  if (btnStart) btnStart.addEventListener('click', startQuiz);
  if (elNext) elNext.addEventListener('click', () => {
    if (!qState) return;
    if (qState.i >= QUIZ.length - 1) { finishQuiz(); return; }
    qState.i++;
    renderQ();
    askQ();
  });
  if (elIndex) elIndex.textContent = '1/' + QUIZ.length;
  if (elTime) elTime.textContent = String(Q_TIME);

  /* ============================================================
     3. BINDING VOW
     ============================================================ */
  const V = {
    count: store.get('jjk_vow', 0),
    win:   store.get('jjk_vowWin', 0),
    lose:  store.get('jjk_vowLose', 0),
    busy:  false
  };
  const elVT = $('#vTotal'), elVW = $('#vWin'), elVL = $('#vLose'), elVO = $('#vowOut');
  const btnBind = $('#bind'), btnResetV = $('#resetV');

  function renderV() {
    if (elVT) elVT.textContent = V.count;
    if (elVW) elVW.textContent = V.win;
    if (elVL) elVL.textContent = V.lose;
    if (btnBind) btnBind.disabled = V.busy || G.energy < 10;
  }
  function saveV() {
    store.set('jjk_vow', V.count);
    store.set('jjk_vowWin', V.win);
    store.set('jjk_vowLose', V.lose);
  }
  function vowOut(tier, cls, iconId, title, text) {
    if (!elVO) return;
    elVO.innerHTML = '<span class="tag' + (cls ? ' ' + cls : '') + '">' + tier + '</span>'
      + '<h4>' + ico(iconId) + '<span></span></h4><p></p>';
    elVO.querySelector('h4 span').textContent = title;
    elVO.querySelector('p').textContent = text;
  }

  async function bindVow() {
    if (V.busy) return;
    if (G.energy < 10) { toast('Butuh minimal 10 energi kutukan.', 'no'); return; }
    V.busy = true;
    renderV();
    vowOut('Mengikat', 'win', 'i-key', 'Rantai mengenceng', 'Sumpah yang sudah terikat tidak bisa dibatalkan.');
    await wait(900);
    const won = Math.random() < 0.5;
    V.count++;
    let gained = 0;
    if (won) { V.win++; gained = Math.floor(G.energy * 2); G.energy = Math.min(MAX_CE, gained); }
    else { V.lose++; G.energy = 0; }
    vowOut(
      won ? 'Sumpah berjalan' : 'Rantai patah', won ? 'win' : '', won ? 'i-lock' : 'i-skull',
      won ? 'Energi dikalikan dua' : 'Energi habis',
      won ? 'Energi kutukan jadi ' + gained + ' CE. Yang membayar ongkos adalah lawan.'
          : 'Semua energi kutukan lenyap. Sumpah ini berbalik menyerang.'
    );
    toast(won ? 'Sumpah berhasil, energi ' + G.energy + ' CE' : 'Sumpah gagal', won ? 'ok' : 'no');
    if (won) domainExpansion('契 結 · 強');
    saveV(); saveG(); renderG();
    V.busy = false;
    renderV();
  }

  if (btnBind) btnBind.addEventListener('click', bindVow);
  if (btnResetV) btnResetV.addEventListener('click', () => {
    V.count = 0; V.win = 0; V.lose = 0;
    saveV();
    vowOut('Belum terikat', '', 'i-lock', 'Belum ada vow', 'Ikat vow untuk mulai.');
    renderV();
    toast('Rantai diputus', 'ok');
  });
  vowOut('Belum terikat', '', 'i-lock', 'Belum ada vow', 'Ikat vow untuk mulai.');

  /* ---------- regenerasi energi kutukan ---------- */
  setInterval(() => {
    if (G.energy < MAX_CE) {
      G.energy = Math.min(MAX_CE, G.energy + 1);
      renderG();
      if (!V.busy) renderV();
    }
  }, 1200);

  renderG();
  renderV();
})();