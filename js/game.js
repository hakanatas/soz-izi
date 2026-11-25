/* Söz İzi – Oyun akışı, dilbilimsel modüller, Akıllı Yazım Koçu ve araştırma veri kaydı.
 * Çekirdek kurallar js/logic.js, dilbilimsel veri katmanı js/soz-izi-data.js içindedir.
 */
(function () {
  'use strict';

  var L = window.LingoLogic;
  var S = window.SozIziData;
  var WORDS = window.LINGO_WORDS;   // Sunucu varsa api/words ile değiştirilir.
  var serverAvailable = false;
  var serverConfig = { dictionary: true, bonusLetter: false };
  var dictionaries = {};
  var dictionaryLoading = {};
  var $ = function (id) { return document.getElementById(id); };

  var MAX_ATTEMPTS = 5;
  var DRAWS_PER_WORD = 2;
  var TEAM_COLORS = ['#b5432c', '#2e6f8e', '#3f7d6d', '#c2963a', '#7a3fd6', '#d1495b', '#1f7a8c', '#8c6d1f', '#4b6f44', '#a23b72', '#5c7cfa', '#e07a5f'];
  var TOUR_KEY = 'sozizi.tournament';
  var USED_KEY = 'sozizi.usedWords';
  var SETTINGS_KEY = 'sozizi.settings';
  var STATS_KEY = 'sozizi.stats';
  var DAILY_KEY = 'sozizi.daily';
  var RESEARCH_KEY = 'sozizi.researchLog';
  var SESSION_KEY = 'sozizi.sessionId';

  var KEY_ROWS = [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'SİL']
  ];
  var ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

  var DEFAULT_SETTINGS = {
    length: 5,
    timer: 25,
    wordsPerGame: 5,
    theme: 'tv',
    module: 'all',
    showClue: true,
    orthoCoach: true
  };
  var DEFAULT_STATS = {
    gamesPlayed: 0, wordsPlayed: 0, wordsSolved: 0,
    attempts: [0, 0, 0, 0, 0], lingos: 0, bestScore: 0,
    dailyPlayed: 0, dailySolved: 0, dailyStreak: 0, lastDaily: null,
    orthoCaught: 0
  };

  var settings = load(SETTINGS_KEY, DEFAULT_SETTINGS);
  var stats = load(STATS_KEY, DEFAULT_STATS);
  var state = null;
  var toastTimer = null;

  /* ---------- Depolama ve Anonim Oturum ---------- */
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return JSON.parse(JSON.stringify(fallback));
      var obj = JSON.parse(raw);
      if (Array.isArray(fallback)) return Array.isArray(obj) ? obj : fallback.slice();
      return Object.assign(JSON.parse(JSON.stringify(fallback)), obj);
    } catch (e) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* özel pencere vb. */ }
  }

  function getSessionId() {
    try {
      var sid = sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = 'OTURUM-' + Math.random().toString(36).slice(2, 6).toUpperCase();
        sessionStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch (e) {
      return 'OTURUM-YEREL';
    }
  }

  function todayKey() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* ---------- Modül ve Havuz Yardımcıları ---------- */
  function getPoolFor(moduleId, length) {
    if (S && typeof S.getWordsForModule === 'function') {
      var list = S.getWordsForModule(moduleId, length, WORDS);
      if (list && list.length) return list;
    }
    return (WORDS && WORDS[length]) ? WORDS[length] : [];
  }

  function activeModule() {
    if (!state) return settings.module || 'all';
    if (state.mode === 'daily') return 'all';
    if (state.mode === 'tournament' && state.tour) return state.tour.module || 'all';
    return state.module || settings.module || 'all';
  }

  function isClueActive() {
    if (!state) return settings.showClue !== false;
    if (state.mode === 'daily') return true;
    if (state.mode === 'tournament' && state.tour) return state.tour.showClue !== false;
    return state.showClue !== false;
  }

  function isCoachActive() {
    if (!state) return settings.orthoCoach !== false;
    return state.orthoCoach !== false;
  }

  /* ---------- Başlangıç ekranı ---------- */
  function renderModuleSelector() {
    var box = $('opt-module');
    if (!box || !S) return;
    var order = ['all', 'karsilik', 'deyim', 'miras', 'genel'];
    box.innerHTML = '';
    order.forEach(function (id) {
      var mod = S.MODULES[id];
      if (!mod) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'module-pill' + (settings.module === id ? ' active' : '');
      btn.dataset.mod = id;
      btn.innerHTML = '<span class="module-pill-name">' + escapeHtml(mod.shortName) + '</span>' +
        '<span class="module-pill-desc">' + escapeHtml(mod.desc) + '</span>';
      btn.addEventListener('click', function () {
        settings.module = id;
        save(SETTINGS_KEY, settings);
        renderModuleSelector();
        updateModuleCountInfo();
      });
      box.appendChild(btn);
    });
    updateModuleCountInfo();
  }

  function updateModuleCountInfo() {
    var info = $('module-count-info');
    if (!info || !S) return;
    var mod = S.MODULES[settings.module] || S.MODULES.all;
    var count = getPoolFor(settings.module, settings.length).length;
    info.textContent = mod.name + ' · ' + settings.length + ' harfli ' + count + ' sözcük hazır';
  }

  function initStartScreen() {
    document.body.setAttribute('data-theme', settings.theme);

    var lenSeg = $('opt-length');
    Array.prototype.forEach.call(lenSeg.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', Number(b.dataset.len) === settings.length);
      b.addEventListener('click', function () {
        settings.length = Number(b.dataset.len);
        save(SETTINGS_KEY, settings);
        Array.prototype.forEach.call(lenSeg.querySelectorAll('button'), function (x) { x.classList.toggle('active', x === b); });
        updateModuleCountInfo();
      });
    });

    var timerInput = $('opt-timer');
    timerInput.value = settings.timer;
    updateTimerLabel();
    timerInput.addEventListener('input', function () {
      settings.timer = Number(timerInput.value);
      save(SETTINGS_KEY, settings);
      updateTimerLabel();
    });

    var wordsSeg = $('opt-words');
    Array.prototype.forEach.call(wordsSeg.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', Number(b.dataset.words) === settings.wordsPerGame);
      b.addEventListener('click', function () {
        settings.wordsPerGame = Number(b.dataset.words);
        save(SETTINGS_KEY, settings);
        Array.prototype.forEach.call(wordsSeg.querySelectorAll('button'), function (x) { x.classList.toggle('active', x === b); });
      });
    });

    var clueChk = $('opt-clue');
    if (clueChk) {
      clueChk.checked = settings.showClue !== false;
      clueChk.addEventListener('change', function () {
        settings.showClue = clueChk.checked;
        save(SETTINGS_KEY, settings);
      });
    }

    var coachChk = $('opt-coach');
    if (coachChk) {
      coachChk.checked = settings.orthoCoach !== false;
      coachChk.addEventListener('change', function () {
        settings.orthoCoach = coachChk.checked;
        save(SETTINGS_KEY, settings);
      });
    }

    renderModuleSelector();

    Array.prototype.forEach.call(document.querySelectorAll('.mode-card'), function (card) {
      card.addEventListener('mouseenter', function () {
        $('opt-names').classList.toggle('hidden', card.dataset.mode !== 'duo');
      });
      card.addEventListener('focus', function () {
        $('opt-names').classList.toggle('hidden', card.dataset.mode !== 'duo');
      });
      card.addEventListener('click', function () {
        if (card.dataset.mode === 'tournament') { showTourSetup(); return; }
        if (card.dataset.mode === 'duo' && $('opt-names').classList.contains('hidden')) {
          $('opt-names').classList.remove('hidden');
          toast('Takım adlarını yazıp tekrar dokunun');
          return;
        }
        startGame(card.dataset.mode);
      });
    });
  }

  function updateTimerLabel() {
    $('opt-timer-val').textContent = settings.timer === 0 ? 'Süresiz' : settings.timer + ' sn';
  }

  /* ---------- Oyun kurulumu ---------- */
  function startGame(mode) {
    var length = mode === 'daily' ? 5 : settings.length;
    var teams;

    if (mode === 'duo') {
      teams = [
        makeTeam($('team-a').value.trim() || 'Kırmızı Takım', 'even'),
        makeTeam($('team-b').value.trim() || 'Mavi Takım', 'odd')
      ];
    } else {
      teams = [makeTeam('Oyuncu', 'even')];
    }

    state = {
      mode: mode,
      module: mode === 'daily' ? 'all' : (settings.module || 'all'),
      showClue: mode === 'daily' ? true : (settings.showClue !== false),
      orthoCoach: settings.orthoCoach !== false,
      length: length,
      totalWords: mode === 'daily' ? 1 : settings.wordsPerGame,
      wordIndex: -1,
      teams: teams,
      current: 0,
      starter: 0,
      phase: 'between',
      timerHandle: null,
      timerRemaining: 0,
      timerTotal: 0,
      usedWords: [],
      wordStartedAt: Date.now(),
      orthoErrors: []
    };

    if (mode === 'daily') {
      var saved = load(DAILY_KEY, {});
      if (saved.date === todayKey() && saved.done) {
        $('screen-start').classList.add('hidden');
        $('screen-game').classList.remove('hidden');
        state.wordIndex = 0;
        restoreDaily(saved);
        return;
      }
    }

    $('screen-start').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    loadDictionary(length);

    if (mode === 'daily' && serverAvailable) {
      var started = state;
      fetch('api/daily').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (state !== started) return;
        if (d && d.word && d.date === todayKey()) state.dailyWord = d.word;
        nextWord();
      }).catch(function () { if (state === started) nextWord(); });
      return;
    }
    nextWord();
  }

  function makeTeam(name, parity) {
    var card = L.createCard(parity);
    return { name: name, score: 0, lingos: 0, card: card, hopper: L.createHopper(card), solved: 0 };
  }

  function chooseWord() {
    var mod = activeModule();
    var list = getPoolFor(mod, state.length);
    if (state.mode === 'daily') {
      if (state.dailyWord) return state.dailyWord;
      var dailyList = getPoolFor('all', 5);
      var rng = L.seededRandom(L.dateSeed(todayKey()));
      return L.pickWord(dailyList, rng);
    }
    if (state.mode === 'tournament') return chooseUnusedWord(state.length, mod);
    var w;
    var guard = 0;
    do {
      w = L.pickWord(list);
      guard++;
    } while (state.usedWords.indexOf(w) !== -1 && guard < 80);
    state.usedWords.push(w);
    return w;
  }

  /** Cihazda ilgili modül ve uzunlukta daha önce çıkmamış bir sözcük seçer. */
  function chooseUnusedWord(length, mod) {
    var used = load(USED_KEY, {});
    var bucketKey = (mod || 'all') + '_' + length;
    var list = getPoolFor(mod || 'all', length);
    var usedList = Array.isArray(used[bucketKey]) ? used[bucketKey] : [];
    var fresh = list.filter(function (w) { return usedList.indexOf(w) === -1; });
    if (!fresh.length) { usedList = []; fresh = list.slice(); }
    var w = L.pickWord(fresh);
    usedList.push(w);
    used[bucketKey] = usedList;
    save(USED_KEY, used);
    return w;
  }

  function nextWord() {
    state.wordIndex += 1;
    if (state.wordIndex >= state.totalWords) { endGame(); return; }

    loadDictionary(state.length);
    state.target = L.toUpperTr(chooseWord());
    state.rows = [];
    state.attempt = 0;
    state.known = L.knownLetters(state.target, []);
    state.input = [];
    state.firstTyped = false;
    state.keyStates = {};
    state.phase = 'guess';
    state.drawsLeft = 0;
    state.drawn = [];
    state.solvedBy = null;
    state.wordStartedAt = Date.now();
    state.orthoErrors = [];

    if (state.mode === 'duo') {
      state.starter = state.wordIndex % 2;
      state.current = state.starter;
      flashTurn(state.teams[state.current].name, TEAM_COLORS[state.current], (state.wordIndex + 1) + '. sözcüğe başlıyor');
    }

    hideOrthoCoach();
    clearWordInsightPanel();
    $('draw-panel').classList.add('hidden');
    renderAll();
    startTimer();
  }

  /* ---------- Bağlam İpucu, Yazım Koçu ve Sözlük Kartı ---------- */
  function renderClueBanner() {
    var el = $('clue-banner');
    if (!el) return;
    if (!state || !state.target || !isClueActive() || activeModule() === 'genel') {
      el.classList.add('hidden');
      return;
    }
    var entry = S ? S.getEntry(state.target) : null;
    if (!entry || !entry.clue) {
      el.classList.add('hidden');
      return;
    }
    var modInfo = (S.MODULES && S.MODULES[entry.module]) || { badge: 'Bağlam İpucu' };
    var foreignHtml = entry.foreign ? '<span class="clue-foreign">Yabancı biçim: ' + escapeHtml(entry.foreign) + '</span>' : '';
    el.innerHTML = '<div class="clue-head"><span class="clue-badge">' + escapeHtml(modInfo.badge) + '</span>' + foreignHtml + '</div>' +
      '<p class="clue-text">' + escapeHtml(entry.clue) + '</p>';
    el.classList.remove('hidden');
  }

  function showOrthoCoach(diag) {
    var el = $('ortho-coach');
    if (!el) return;
    el.innerHTML = '<div class="ortho-head">' +
      '<span class="ortho-tag">✎ Akıllı Yazım Koçu · ' + escapeHtml(diag.category) + '</span>' +
      '<span class="ortho-pair"><del>' + escapeHtml(diag.typed) + '</del> → <ins>' + escapeHtml(diag.suggested) + '</ins></span>' +
      '</div>' +
      '<p class="ortho-rule">' + escapeHtml(diag.rule) + ' <b>(Tahmin hakkınız yanmadı.)</b></p>';
    el.classList.remove('hidden');
  }

  function hideOrthoCoach() {
    var el = $('ortho-coach');
    if (el) el.classList.add('hidden');
  }

  function buildWordInsightHtml(word) {
    var entry = S ? S.getEntry(word) : null;
    var upper = L.toUpperTr(word);
    if (!entry) {
      return '<div class="word-insight">' +
        '<div class="word-insight-head"><span class="word-insight-word">' + escapeHtml(upper) + '</span><span class="word-insight-badge">Türkçe Sözlük</span></div>' +
        '<div class="word-insight-row"><strong>Yapı:</strong>' + L.chars(upper).length + ' harfli Türkçe söz varlığı ögesi.</div>' +
        '</div>';
    }
    var modInfo = (S.MODULES && S.MODULES[entry.module]) || { badge: 'Söz Varlığı' };
    return '<div class="word-insight">' +
      '<div class="word-insight-head"><span class="word-insight-word">' + escapeHtml(upper) + '</span><span class="word-insight-badge">' + escapeHtml(modInfo.badge) + '</span></div>' +
      (entry.foreign ? '<div class="word-insight-row"><strong>Karşıladığı Yabancı Sözcük:</strong>' + escapeHtml(entry.foreign) + '</div>' : '') +
      '<div class="word-insight-row"><strong>TDK Anlamı:</strong>' + escapeHtml(entry.meaning) + '</div>' +
      '<div class="word-insight-row"><strong>Köken ve Yapı:</strong>' + escapeHtml(entry.origin) + '</div>' +
      '<div class="word-insight-example">“' + escapeHtml(entry.example) + '”</div>' +
      '</div>';
  }

  function showWordInsightPanel(word) {
    var panel = $('word-insight-panel');
    if (panel) panel.innerHTML = buildWordInsightHtml(word);
  }

  function clearWordInsightPanel() {
    var panel = $('word-insight-panel');
    if (panel) panel.innerHTML = '';
  }

  /* ---------- Araştırma Verisi Kaydı ve Dışa Aktarma ---------- */
  function recordResearchTrial(solved) {
    if (!state || !state.target) return;
    var durationSec = Math.max(0.5, Math.round((Date.now() - (state.wordStartedAt || Date.now())) / 100) / 10);
    var entry = S ? S.getEntry(state.target) : null;
    var resolvedMod = entry ? entry.module : activeModule();
    var logs = load(RESEARCH_KEY, []);
    logs.push({
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      mode: state.mode,
      module: resolvedMod,
      clueShown: isClueActive() && !!entry,
      orthoCoachOn: isCoachActive(),
      length: state.length,
      word: state.target,
      solved: !!solved,
      attempts: state.attempt,
      durationSec: durationSec,
      orthoErrorCount: (state.orthoErrors || []).length,
      orthoCategories: (state.orthoErrors || []).map(function (e) { return e.category; }).join('; '),
      orthoPairs: (state.orthoErrors || []).map(function (e) { return e.typed + '->' + e.suggested; }).join('; ')
    });
    save(RESEARCH_KEY, logs);
  }

  function showResearchModal() {
    var logs = load(RESEARCH_KEY, []);
    var total = logs.length;
    var solvedLogs = logs.filter(function (x) { return x.solved; });
    var solvedRate = total ? Math.round(1000 * solvedLogs.length / total) / 10 : 0;
    var avgAttempts = solvedLogs.length
      ? (Math.round(100 * solvedLogs.reduce(function (a, x) { return a + x.attempts; }, 0) / solvedLogs.length) / 100)
      : 0;
    var avgDuration = solvedLogs.length
      ? (Math.round(10 * solvedLogs.reduce(function (a, x) { return a + x.durationSec; }, 0) / solvedLogs.length) / 10)
      : 0;
    var totalOrtho = logs.reduce(function (a, x) { return a + (x.orthoErrorCount || 0); }, 0);

    // Modüllere göre kırılım
    var modKeys = ['karsilik', 'deyim', 'miras', 'genel'];
    var modRows = modKeys.map(function (mk) {
      var sub = logs.filter(function (x) { return x.module === mk; });
      if (!sub.length) return '';
      var subSolved = sub.filter(function (x) { return x.solved; });
      var rate = Math.round(100 * subSolved.length / sub.length);
      var mAtt = subSolved.length ? (Math.round(100 * subSolved.reduce(function (a, x) { return a + x.attempts; }, 0) / subSolved.length) / 100) : '-';
      var mDur = subSolved.length ? (Math.round(10 * subSolved.reduce(function (a, x) { return a + x.durationSec; }, 0) / subSolved.length) / 10) + ' sn' : '-';
      var label = (S && S.MODULES[mk]) ? S.MODULES[mk].name : mk;
      return '<tr><td>' + escapeHtml(label) + '</td><td class="num">' + sub.length + '</td><td class="num">%' + rate + '</td><td class="num">' + mAtt + '</td><td class="num">' + mDur + '</td></tr>';
    }).join('');

    // Yazım yanlışı kategorileri kırılımı
    var catCounts = {};
    logs.forEach(function (x) {
      if (!x.orthoCategories) return;
      x.orthoCategories.split('; ').forEach(function (c) {
        if (c) catCounts[c] = (catCounts[c] || 0) + 1;
      });
    });
    var catKeys = Object.keys(catCounts).sort(function (a, b) { return catCounts[b] - catCounts[a]; });
    var catRows = catKeys.map(function (ck) {
      return '<tr><td>' + escapeHtml(ck) + '</td><td class="num">' + catCounts[ck] + '</td></tr>';
    }).join('');

    var html = '<h2>Araştırma Veri Günlüğü</h2>' +
      '<div class="research-note">Bu panel, sınıf içi uygulamalarda toplanan anonim sözcük çözme, süre ve yazım yanlışı verilerini <b>TÜBİTAK 2204-A</b> raporunun <i>Bulgular</i> bölümü için özetler ve dışa aktarır. Kişisel veri tutulmaz (Oturum Kodu: <code>' + escapeHtml(getSessionId()) + '</code>).</div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><b>' + total + '</b><span>sözcük uygulaması</span></div>' +
      '<div class="stat"><b>%' + solvedRate + '</b><span>çözüm başarısı</span></div>' +
      '<div class="stat"><b>' + avgAttempts + '</b><span>ort. tahmin</span></div>' +
      '<div class="stat"><b>' + avgDuration + ' sn</b><span>ort. süre</span></div>' +
      '<div class="stat"><b>' + totalOrtho + '</b><span>yazım uyarısı</span></div>' +
      '</div>';

    if (modRows) {
      html += '<h3>Modüllere Göre Başarım Dağılımı</h3>' +
        '<table class="tour-table"><thead><tr><th>Dil Modülü</th><th style="text-align:right">N</th><th style="text-align:right">Başarı</th><th style="text-align:right">Ort. Deneme</th><th style="text-align:right">Ort. Süre</th></tr></thead><tbody>' + modRows + '</tbody></table>';
    } else {
      html += '<p>Henüz tamamlanmış sözcük kaydı bulunmuyor. Birkaç sözcük çözdüğünüzde tablolar otomatik oluşur.</p>';
    }

    if (catRows) {
      html += '<h3>Yakalanan Yazım Yanlışlarının Dilbilimsel Dağılımı</h3>' +
        '<table class="tour-table"><thead><tr><th>Hata Kategorisi</th><th style="text-align:right">Frekans</th></tr></thead><tbody>' + catRows + '</tbody></table>';
    }

    html += '<div class="btn-row" style="margin-top:1rem">' +
      '<button class="btn" id="btn-dl-csv"' + (!total ? ' disabled' : '') + '>CSV İndir (Excel / İstatistik)</button>' +
      '<button class="btn secondary" id="btn-dl-json"' + (!total ? ' disabled' : '') + '>JSON İndir</button>' +
      '<button class="btn ghost" id="btn-clear-research"' + (!total ? ' disabled' : '') + '>Kayıtları Temizle</button>' +
      '</div>';

    showModal(html);

    var csvBtn = $('btn-dl-csv');
    if (csvBtn) csvBtn.addEventListener('click', function () { exportResearchCsv(logs); });
    var jsonBtn = $('btn-dl-json');
    if (jsonBtn) jsonBtn.addEventListener('click', function () {
      downloadBlob('\uFEFF' + JSON.stringify(logs, null, 2), 'soz-izi-arastirma-verisi.json', 'application/json;charset=utf-8');
    });
    var clrBtn = $('btn-clear-research');
    if (clrBtn) clrBtn.addEventListener('click', function () {
      if (!confirm('Toplanan tüm anonim araştırma kayıtları silinsin mi?')) return;
      save(RESEARCH_KEY, []);
      showResearchModal();
    });
  }

  function exportResearchCsv(logs) {
    var headers = ['oturum_kodu', 'tarih_saat', 'oyun_modu', 'dil_modulu', 'baglam_ipucu', 'yazim_kocu', 'harf_sayisi', 'hedef_sozcuk', 'cozuldu_mu', 'deneme_sayisi', 'sure_sn', 'yazim_hatasi_sayisi', 'yazim_hata_kategorileri', 'yazim_hata_ornekleri'];
    var escCsv = function (val) {
      var s = String(val == null ? '' : val);
      if (/[",;\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    var lines = [headers.join(';')];
    logs.forEach(function (r) {
      lines.push([
        r.sessionId, r.timestamp, r.mode, r.module,
        r.clueShown ? 'acik' : 'kapali',
        r.orthoCoachOn ? 'acik' : 'kapali',
        r.length, r.word, r.solved ? 1 : 0, r.attempts, r.durationSec,
        r.orthoErrorCount, r.orthoCategories, r.orthoPairs
      ].map(escCsv).join(';'));
    });
    downloadBlob('\uFEFF' + lines.join('\r\n'), 'soz-izi-arastirma-verisi.csv', 'text/csv;charset=utf-8');
  }

  function downloadBlob(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /* ---------- Süre ---------- */
  function timerEnabled() {
    if (state.mode === 'tournament') return true;
    return state.mode !== 'daily' && settings.timer > 0;
  }

  function startTimer() {
    stopTimer();
    var timerEl = $('timer');
    if (!timerEnabled()) { timerEl.style.visibility = 'hidden'; return; }
    timerEl.style.visibility = 'visible';
    state.timerTotal = (state.mode === 'tournament' ? state.tour.timePerTeam : settings.timer) * 1000;
    state.timerRemaining = state.timerTotal;
    var last = Date.now();
    renderTimer();
    state.timerHandle = setInterval(function () {
      var now = Date.now();
      state.timerRemaining -= now - last;
      last = now;
      if (state.timerRemaining <= 0) {
        state.timerRemaining = 0;
        renderTimer();
        stopTimer();
        onTimeout();
        return;
      }
      renderTimer();
    }, 100);
  }

  function stopTimer() {
    if (state && state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  }

  function renderTimer() {
    var timerEl = $('timer');
    var pct = state.timerTotal ? (state.timerRemaining / state.timerTotal) * 100 : 100;
    var seconds = Math.ceil(state.timerRemaining / 1000);
    $('timer-bar').style.width = pct + '%';
    var danger = seconds <= 5 || pct < 25;
    timerEl.classList.toggle('danger', danger);
    timerEl.classList.toggle('warn', !danger && pct < 50);
    $('timer-text').textContent = seconds;
  }

  function onTimeout() {
    if (state.mode === 'tournament') {
      if (state.phase === 'reveal') { state.timeoutPending = true; return; }
      if (state.phase !== 'guess') return;
      toast('Süre doldu!');
      tourWordEnd(false);
      return;
    }
    if (state.phase !== 'guess') return;
    toast('Süre doldu!');
    consumeRow('timeout');
  }

  /* ---------- Giriş ---------- */
  function handleKey(key) {
    if (!state || state.phase !== 'guess') return;
    if (key === 'ENTER') { submitGuess(); return; }
    if (key === 'SİL' || key === 'BACKSPACE') {
      if (state.input.length) { state.input.pop(); renderBoard(); }
      else if (state.firstTyped) { state.firstTyped = false; renderBoard(); }
      return;
    }
    if (ALPHABET.indexOf(key) === -1) return;
    if (!state.input.length && !state.firstTyped && key === state.target[0]) {
      state.firstTyped = true;
      renderBoard(true);
      return;
    }
    if (state.input.length >= state.length - 1) return;
    state.input.push(key);
    renderBoard(true);
  }

  function currentGuessLetters() {
    var letters = [state.target[0]];
    for (var i = 1; i < state.length; i++) {
      var typed = state.input[i - 1];
      letters.push(typed || state.known[i] || null);
    }
    return letters;
  }

  function submitGuess() {
    var letters = currentGuessLetters();
    if (letters.some(function (c) { return !c; })) {
      toast('Eksik harf');
      shakeRow();
      return;
    }
    var guess = letters.join('');
    var lowerGuess = L.toLowerTr(guess);
    var lowerTarget = L.toLowerTr(state.target);

    // Sözlük açık olmasa bile (ör. yerel file:// kipinde) bilinen yazım yanlışlarını yakala
    var explicitMisspelling = (S && S.COMMON_MISSPELLINGS && lowerGuess !== lowerTarget) ? S.COMMON_MISSPELLINGS[lowerGuess] : null;
    var check = L.validateGuess(guess, state.target, currentDictionary(), { checkDictionary: dictionaryActive() });

    if (!check.ok || explicitMisspelling) {
      if ((check.reason === 'dictionary' || explicitMisspelling) && isCoachActive() && S) {
        var diag = S.diagnoseOrthography(guess, currentDictionary());
        if (diag && diag.found) {
          showOrthoCoach(diag);
          state.orthoErrors.push(diag);
          stats.orthoCaught = (stats.orthoCaught || 0) + 1;
          save(STATS_KEY, stats);
          toast('Yazım Koçu uyarısına göz atın');
          shakeRow();
          return;
        }
      }
      toast(check.reason === 'dictionary' ? 'Sözlükte bulunamadı: ' + guess : 'Geçersiz tahmin');
      shakeRow();
      return;
    }

    hideOrthoCoach();
    if (state.mode !== 'tournament') stopTimer();
    var evaluation = L.evaluateGuess(guess, state.target);
    state.rows.push({ letters: letters, eval: evaluation, status: 'ok', team: state.current });
    state.attempt += 1;
    L.mergeKeyStates(state.keyStates, guess, evaluation);
    state.known = L.knownLetters(state.target, state.rows.filter(function (r) { return r.status === 'ok'; }).map(function (r) { return r.letters.join(''); }));
    state.input = [];
    state.firstTyped = false;
    state.phase = 'reveal';
    renderBoard();
    renderKeyboard();
    renderStatus();

    var solved = evaluation.every(function (s) { return s === 'correct'; });
    var delay = state.length * 120 + 350;
    setTimeout(function () {
      if (solved) onWordSolved();
      else afterFailedAttempt();
    }, delay);
  }

  /** Süre dolması bir hakkı yakar. */
  function consumeRow(status, letters) {
    stopTimer();
    state.rows.push({ letters: letters || null, eval: null, status: status, team: state.current });
    state.attempt += 1;
    state.input = [];
    state.firstTyped = false;
    state.phase = 'reveal';
    renderBoard();
    setTimeout(afterFailedAttempt, 500);
  }

  function afterFailedAttempt() {
    if (state.mode === 'tournament' && state.timeoutPending) { state.timeoutPending = false; tourWordEnd(false); return; }
    if (state.attempt >= MAX_ATTEMPTS) { onWordFailed(); return; }
    if (state.mode === 'duo') passTurn();
    state.phase = 'guess';
    renderAll();
    if (state.mode !== 'tournament') startTimer();
  }

  function flashTurn(name, color, sub) {
    var el = $('turn-flash');
    el.innerHTML = '<span class="turn-flash-kicker">Sıra</span><span class="turn-flash-name">' + escapeHtml(name) + '</span>' + (sub ? '<span class="turn-flash-sub">' + escapeHtml(sub) + '</span>' : '');
    el.style.setProperty('--team-color', color);
    el.classList.remove('hidden');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(flashTurn.timer);
    flashTurn.timer = setTimeout(function () { el.classList.add('hidden'); }, 1500);
  }

  function passTurn() {
    state.current = 1 - state.current;
    var name = state.teams[state.current].name;
    flashTurn(name, TEAM_COLORS[state.current], 'Sıra rakibe geçti');
    if (serverConfig.bonusLetter) {
      var unknown = [];
      for (var i = 1; i < state.length; i++) if (!state.known[i]) unknown.push(i);
      if (unknown.length > 1) {
        var pos = unknown[Math.floor(Math.random() * unknown.length)];
        state.known[pos] = state.target[pos];
        toast('Sıra: ' + name + ' · ipucu harfi: ' + state.target[pos]);
        return;
      }
    }
    toast('Sıra: ' + name);
  }

  /* ---------- Sözcük sonucu ---------- */
  function onWordSolved() {
    if (state.mode === 'tournament') { tourWordEnd(true); return; }
    var team = state.teams[state.current];
    var points = L.wordScore(state.length, state.attempt);
    team.score += points;
    team.solved += 1;
    state.solvedBy = state.current;
    state.lastPoints = points;

    stats.wordsPlayed += 1;
    stats.wordsSolved += 1;
    stats.attempts[state.attempt - 1] += 1;
    save(STATS_KEY, stats);
    recordResearchTrial(true);

    bounceRow(state.rows.length - 1);
    renderScoreboard();
    showWordInsightPanel(state.target);

    if (state.mode === 'daily') {
      finishDaily(true);
      return;
    }
    toast(state.target + ' · +' + points + ' puan');
    setTimeout(startDraw, 700);
  }

  function onWordFailed() {
    if (state.mode === 'tournament') { tourWordEnd(false); return; }
    stats.wordsPlayed += 1;
    save(STATS_KEY, stats);
    recordResearchTrial(false);
    state.phase = 'between';
    renderAll();
    if (state.mode === 'daily') { finishDaily(false); return; }
    showModal(
      '<h2>Sözcük Bulunamadı</h2>' +
      '<p>Aranan sözcük ve dilbilimsel kartı:</p>' +
      buildWordInsightHtml(state.target) +
      '<p>Bu turdan puan alınamadı.</p>' +
      '<div class="btn-row"><button class="btn" id="modal-next">' + (state.wordIndex + 1 >= state.totalWords ? 'Sonucu gör' : 'Sonraki sözcük') + '</button></div>'
    );
    $('modal-next').addEventListener('click', function () { closeModal(); nextWord(); });
  }

  /* ---------- İz Kartı ve top çekme ---------- */
  function startDraw() {
    state.phase = 'draw';
    state.drawsLeft = DRAWS_PER_WORD;
    state.drawn = [];
    renderDrawPanel();
    renderCards();
  }

  function drawOne() {
    if (state.phase !== 'draw' || state.drawsLeft <= 0) return;
    var team = state.teams[state.solvedBy];
    if (!team.hopper.length) { team.hopper = L.createHopper(team.card); }
    var ball = L.drawBall(team.hopper);
    state.drawsLeft -= 1;
    state.drawn.push(ball);
    state.lastMarked = null;

    if (ball.type === 'number') {
      L.markNumber(team.card, ball.n);
      state.lastMarked = ball.n;
      checkSiraBonus(team);
    } else if (ball.type === 'green') {
      state.drawsLeft += 1;
      toast('Yeşil top! Bir çekiliş hakkı daha');
    } else if (ball.type === 'red') {
      state.drawsLeft = 0;
      toast('Kırmızı top! Çekiliş tamamlandı');
    } else if (ball.type === 'wild') {
      state.phase = 'wild';
      toast('Joker! İz Kartından bir sayı seçin');
    }
    renderDrawPanel();
    renderCards();
  }

  function pickWild(index) {
    if (state.phase !== 'wild') return;
    var team = state.teams[state.solvedBy];
    var cell = team.card.cells[index];
    if (cell.marked) return;
    cell.marked = true;
    state.lastMarked = cell.n;
    state.phase = 'draw';
    checkSiraBonus(team);
    renderDrawPanel();
    renderCards();
  }

  function checkSiraBonus(team) {
    var line = L.findLingo(team.card);
    if (!line) return;
    team.score += L.LINGO_BONUS;
    team.lingos += 1;
    stats.lingos += 1;
    save(STATS_KEY, stats);
    state.lingoLine = line;
    state.drawsLeft = 0;
    state.lingoJustNow = true;
    toast('SÖZ İZİ! +' + L.LINGO_BONUS + ' puan');
    renderScoreboard();
  }

  function endDraw() {
    var team = state.teams[state.solvedBy];
    if (state.lingoJustNow) {
      team.card = L.createCard(team.card.parity);
      team.hopper = L.createHopper(team.card);
      state.lingoJustNow = false;
      state.lingoLine = null;
    }
    state.phase = 'between';
    $('draw-panel').classList.add('hidden');
    clearWordInsightPanel();
    nextWord();
  }

  /* ---------- Günün sözcüğü ---------- */
  function finishDaily(solved) {
    state.phase = 'between';
    var record = {
      date: todayKey(), done: true, solved: solved, attempt: solved ? state.attempt : null,
      rows: state.rows, target: state.target
    };
    save(DAILY_KEY, record);

    stats.dailyPlayed += 1;
    if (solved) stats.dailySolved += 1;
    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yKey = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
    stats.dailyStreak = solved ? ((stats.lastDaily === yKey) ? stats.dailyStreak + 1 : 1) : 0;
    stats.lastDaily = todayKey();
    save(STATS_KEY, stats);

    setTimeout(function () { showDailyResult(record); }, 600);
  }

  function restoreDaily(saved) {
    state.target = saved.target;
    state.rows = saved.rows;
    state.attempt = saved.rows.length;
    state.known = L.knownLetters(state.target, []);
    state.input = [];
    state.keyStates = {};
    saved.rows.forEach(function (r) { if (r.status === 'ok') L.mergeKeyStates(state.keyStates, r.letters.join(''), r.eval); });
    state.phase = 'between';
    renderAll();
    $('timer').style.visibility = 'hidden';
    showDailyResult(saved);
  }

  function shareText(record) {
    var lines = record.rows.map(function (r) {
      if (r.status !== 'ok') return '⬛'.repeat(state.length);
      return r.eval.map(function (s) { return s === 'correct' ? '🟥' : s === 'present' ? '🟡' : '⬜'; }).join('');
    });
    var head = 'Söz İzi ' + record.date + ' · ' + (record.solved ? record.attempt + '/' + MAX_ATTEMPTS : 'X/' + MAX_ATTEMPTS);
    return head + '\n' + lines.join('\n');
  }

  function showDailyResult(record) {
    var text = shareText(record);
    showModal(
      '<h2>' + (record.solved ? 'Tebrikler!' : 'Günün Sözcüğü Tamamlandı') + '</h2>' +
      buildWordInsightHtml(record.target) +
      '<p>' + (record.solved ? record.attempt + '. denemede buldunuz.' : 'Yarın yeni bir sözcükle tekrar deneyin.') + ' Günlük seri: <b>' + stats.dailyStreak + '</b></p>' +
      '<div class="share-box">' + text + '</div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn" id="btn-share">Sonucu kopyala</button><button class="btn secondary" id="btn-menu">Ana menü</button></div>'
    );
    $('btn-share').addEventListener('click', function () {
      copyText(text).then(function () { toast('Panoya kopyalandı'); });
    });
    $('btn-menu').addEventListener('click', function () { closeModal(); goHome(); });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* yok say */ }
      document.body.removeChild(ta); resolve();
    });
  }

  /* ---------- Oyun sonu ---------- */
  function endGame() {
    stopTimer();
    state.phase = 'over';
    stats.gamesPlayed += 1;
    var best = Math.max.apply(null, state.teams.map(function (t) { return t.score; }));
    if (state.mode === 'solo' && best > stats.bestScore) stats.bestScore = best;
    save(STATS_KEY, stats);

    var html = '<h2>Çalışma Tamamlandı</h2>';
    if (state.mode === 'duo') {
      var a = state.teams[0], b = state.teams[1];
      var title = a.score === b.score ? 'Berabere!' : (a.score > b.score ? a.name : b.name) + ' kazandı!';
      html += '<p class="winner" style="font-size:20px;font-weight:800">' + escapeHtml(title) + '</p>';
    }
    html += '<div class="stat-grid">';
    state.teams.forEach(function (t) {
      html += '<div class="stat"><b>' + t.score + '</b><span>' + escapeHtml(t.name) + '</span></div>';
      html += '<div class="stat"><b>' + t.solved + '/' + state.totalWords + '</b><span>sözcük</span></div>';
      html += '<div class="stat"><b>' + t.lingos + '</b><span>SÖZ İZİ</span></div>';
    });
    html += '</div>';
    if (state.mode === 'solo') html += '<p>En iyi skorunuz: <b>' + stats.bestScore + '</b></p>';
    html += '<div class="btn-row"><button class="btn" id="btn-again">Yeniden Başlat</button><button class="btn secondary" id="btn-open-res">Araştırma Verisi</button><button class="btn ghost" id="btn-menu">Ana menü</button></div>';
    showModal(html);
    var mode = state.mode;
    $('btn-again').addEventListener('click', function () { closeModal(); startGame(mode); });
    $('btn-open-res').addEventListener('click', function () { closeModal(); goHome(); showResearchModal(); });
    $('btn-menu').addEventListener('click', function () { closeModal(); goHome(); });
  }

  function goHome() {
    stopTimer();
    state = null;
    hideOrthoCoach();
    clearWordInsightPanel();
    $('screen-game').classList.add('hidden');
    $('screen-tour').classList.add('hidden');
    $('screen-start').classList.remove('hidden');
    renderTourResume();
    updateModuleCountInfo();
  }

  /* ---------- Çizim ---------- */
  function renderAll() {
    renderStatus();
    renderClueBanner();
    renderBoard();
    renderKeyboard();
    renderScoreboard();
    renderCards();
  }

  function renderStatus() {
    var turn = $('turn-label');
    var banner = $('turn-banner');
    var column = $('play-column');
    var modObj = (S && S.MODULES[activeModule()]) || { shortName: 'Söz İzi' };
    if (state.mode === 'duo' || state.mode === 'tournament') {
      var t = state.teams[state.current];
      var color = TEAM_COLORS[state.current % TEAM_COLORS.length];
      turn.innerHTML = '<span class="team-dot" style="background:' + color + '"></span>' + escapeHtml(t.name) + (state.mode === 'tournament' ? ' · ' + state.length + ' harfli sözcük' : ' tahmin ediyor');
      banner.innerHTML = '<span class="turn-banner-kicker">' + (state.mode === 'tournament' ? tourStageLabel() : 'Sıra') + '</span><span class="turn-banner-name">' + escapeHtml(t.name) + '</span><span class="turn-banner-hint">' + (state.attempt + 1) + '. tahmin · ' + (MAX_ATTEMPTS - state.attempt) + ' hak kaldı</span>';
      banner.style.setProperty('--team-color', color);
      banner.classList.remove('hidden');
      column.style.setProperty('--team-color', color);
      column.classList.add('team-turn');
    } else {
      banner.classList.add('hidden');
      column.classList.remove('team-turn');
      column.style.removeProperty('--team-color');
      if (state.mode === 'daily') {
        turn.textContent = 'Günün Sözcüğü · ' + todayKey();
      } else {
        turn.textContent = modObj.shortName + ' · ' + state.length + ' harfli sözcük';
      }
    }
    if (state.mode === 'tournament') {
      $('round-label').textContent = tourStageLabel() + ' · ' + tourProgressLabel();
    } else {
      $('round-label').textContent = state.mode === 'daily' ? '' : 'Sözcük ' + (state.wordIndex + 1) + ' / ' + state.totalWords;
    }
  }

  function renderBoard(popLast) {
    var board = $('board');
    board.innerHTML = '';
    board.style.setProperty('--cols', state.length);
    var n = state.length;

    for (var r = 0; r < MAX_ATTEMPTS; r++) {
      var row = document.createElement('div');
      row.className = 'row';
      row.style.setProperty('--cols', n);
      var rec = state.rows[r];
      var isActive = (r === state.rows.length) && state.phase === 'guess';
      if (isActive) row.classList.add('active');
      var justRevealed = rec && r === state.rows.length - 1 && state.phase === 'reveal';

      for (var c = 0; c < n; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        if (rec) {
          if (rec.status === 'ok') {
            cell.textContent = rec.letters[c];
            if (justRevealed) {
              cell.classList.add('flip');
              cell.style.animationDelay = (c * 120) + 'ms';
              (function (cellEl, stateName, idx) {
                setTimeout(function () { cellEl.classList.add(stateName); }, idx * 120 + 250);
              })(cell, rec.eval[c], c);
            } else {
              cell.classList.add(rec.eval[c]);
            }
          } else {
            cell.textContent = rec.letters ? rec.letters[c] : (c === 0 ? state.target[0] : '·');
            cell.classList.add('timeout');
            cell.title = 'Süre doldu';
          }
        } else if (isActive) {
          if (c === 0) {
            cell.textContent = state.target[0];
            cell.classList.add('locked');
            if (state.firstTyped) cell.classList.add('typed');
            if (popLast && state.firstTyped && !state.input.length) cell.classList.add('pop');
          } else {
            var typed = state.input[c - 1];
            if (typed) {
              cell.textContent = typed;
              cell.classList.add('typed');
              if (popLast && c - 1 === state.input.length - 1) cell.classList.add('pop');
            } else if (state.known[c]) {
              cell.textContent = state.known[c];
              cell.classList.add('hint');
            }
            if (c - 1 === state.input.length) cell.classList.add('cursor');
          }
        }
        row.appendChild(cell);
      }
      board.appendChild(row);
    }
  }

  function shakeRow() {
    var rows = $('board').querySelectorAll('.row');
    var row = rows[state.rows.length];
    if (!row) return;
    row.classList.remove('shake');
    void row.offsetWidth;
    row.classList.add('shake');
  }

  function bounceRow(index) {
    var rows = $('board').querySelectorAll('.row');
    var row = rows[index];
    if (!row) return;
    Array.prototype.forEach.call(row.querySelectorAll('.cell'), function (cell, i) {
      cell.classList.remove('flip');
      cell.style.animationDelay = (i * 80) + 'ms';
      cell.classList.add('bounce');
    });
  }

  function renderKeyboard() {
    var kb = $('keyboard');
    kb.innerHTML = '';
    KEY_ROWS.forEach(function (keys) {
      var rowEl = document.createElement('div');
      rowEl.className = 'key-row';
      keys.forEach(function (k) {
        var btn = document.createElement('button');
        btn.className = 'key';
        btn.textContent = k;
        btn.dataset.key = k;
        if (k === 'ENTER' || k === 'SİL') btn.classList.add('wide');
        else if (state.keyStates[k]) btn.classList.add(state.keyStates[k]);
        btn.addEventListener('click', function () { handleKey(k); });
        rowEl.appendChild(btn);
      });
      kb.appendChild(rowEl);
    });
  }

  function renderScoreboard() {
    var sb = $('scoreboard');
    if (state.mode === 'daily') { sb.innerHTML = ''; return; }
    if (state.mode === 'tournament') { renderStandings(sb); return; }
    sb.innerHTML = state.teams.map(function (t, i) {
      var active = state.mode === 'duo' ? i === state.current : true;
      var duo = state.mode === 'duo';
      return '<div class="team' + (active ? ' active' : '') + (duo ? ' duo' : '') + '" style="--team-color:' + TEAM_COLORS[i] + '">' +
        '<span class="team-name"><span class="team-dot" style="background:' + TEAM_COLORS[i] + '"></span>' + escapeHtml(t.name) +
        (duo && active ? '<span class="team-turn-tag">Sırada</span>' : '') +
        '<span class="team-lingos">' + t.lingos + ' SÖZ İZİ</span></span>' +
        '<span class="team-score">' + t.score + '</span></div>';
    }).join('');
  }

  function renderCards() {
    var panel = $('card-panel');
    if (state.mode === 'daily' || state.mode === 'tournament') { panel.innerHTML = ''; return; }
    panel.innerHTML = '';
    state.teams.forEach(function (t, ti) {
      var box = document.createElement('div');
      box.className = 'lingo-card';
      var pickable = state.phase === 'wild' && ti === state.solvedBy;
      var title = state.mode === 'duo' ? escapeHtml(t.name) : 'İz Kartı';
      box.innerHTML = '<h3><span>' + title + '</span><span>' + (t.card.parity === 'even' ? 'çift' : 'tek') + ' sayılar</span></h3>';
      var grid = document.createElement('div');
      grid.className = 'card-grid';
      t.card.cells.forEach(function (cell, idx) {
        var el = document.createElement('div');
        el.className = 'card-cell';
        el.textContent = cell.n;
        if (cell.marked) el.classList.add('marked');
        if (state.lingoLine && ti === state.solvedBy && state.lingoLine.indexOf(idx) !== -1) el.classList.add('lingo');
        if (ti === state.solvedBy && state.lastMarked === cell.n) el.classList.add('just');
        if (pickable && !cell.marked) {
          el.classList.add('pickable');
          el.addEventListener('click', function () { pickWild(idx); });
        }
        grid.appendChild(el);
      });
      box.appendChild(grid);
      panel.appendChild(box);
    });
  }

  function renderDrawPanel() {
    var panel = $('draw-panel');
    panel.classList.remove('hidden');
    var team = state.teams[state.solvedBy];
    var html = '<h3>' + (state.mode === 'duo' ? escapeHtml(team.name) + ' top çekiyor' : 'İz Kartı Çekilişi') + '</h3>';
    if (state.phase === 'wild') {
      html += '<p>Joker top! Karttan işaretlenecek bir sayı seçin.</p>';
    } else if (state.drawsLeft > 0) {
      html += '<p>Kalan çekiliş: <b>' + state.drawsLeft + '</b>. Numaralı top kartı işaretler, yeşil top ek hak verir, kırmızı top çekilişi bitirir.</p>';
    } else if (state.lingoJustNow) {
      html += '<p><b>SÖZ İZİ!</b> Beşli diziyi tamamladınız; yeni kart verilecek.</p>';
    } else {
      html += '<p>Çekiliş tamamlandı. Sözlük kartını inceleyip sonraki sözcüğe geçebilirsiniz.</p>';
    }
    html += '<div class="balls">' + state.drawn.map(function (b) {
      var cls = 'ball ' + b.type;
      var label = b.type === 'number' ? b.n : b.type === 'wild' ? '?' : b.type === 'green' ? '+1' : '✕';
      return '<span class="' + cls + '">' + label + '</span>';
    }).join('') + '</div>';
    html += '<div class="btn-row">';
    if (state.phase === 'draw' && state.drawsLeft > 0) {
      html += '<button class="btn" id="btn-draw">Top çek</button>';
    } else if (state.phase === 'draw') {
      html += '<button class="btn" id="btn-continue">' + (state.wordIndex + 1 >= state.totalWords ? 'Sonucu gör' : 'Sonraki sözcük') + '</button>';
    }
    html += '</div>';
    panel.innerHTML = html;
    var d = $('btn-draw'); if (d) d.addEventListener('click', drawOne);
    var c = $('btn-continue'); if (c) c.addEventListener('click', endDraw);
  }

  /* ---------- Modal ---------- */
  function showModal(html) {
    $('modal-content').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function closeModal() { $('modal').classList.add('hidden'); }
  function modalOpen() { return !$('modal').classList.contains('hidden'); }

  function showHelp() {
    showModal(
      '<h2>Söz İzi Nasıl Çalışır?</h2>' +
      '<p>Aranan Türkçe sözcüğün <b>ilk harfi</b> ve seçilen modüle göre <b>bağlam ipucu</b> verilir. Aynı uzunlukta, aynı harfle başlayan geçerli bir Türkçe sözcük yazıp ENTER\'a basın. Toplam <b>5 tahmin</b> hakkınız vardır.</p>' +
      '<div class="legend">' +
      '<div class="legend-row"><div class="cell correct">K</div><span>Harf doğru ve <b>doğru yerde</b> (kırmızı kare). Sonraki satıra taşınır.</span></div>' +
      '<div class="legend-row"><div class="cell present">A</div><span>Harf sözcükte var ama <b>yanlış yerde</b> (sarı daire).</span></div>' +
      '<div class="legend-row"><div class="cell absent">Z</div><span>Harf sözcükte bulunmuyor.</span></div>' +
      '</div>' +
      '<h3>Üç Dilbilimsel Katman</h3>' +
      '<ul>' +
      '<li><b>1. Tematik Söz Varlığı Modülleri:</b> <i>Türkçenin Karşılıkları</i> (yabancı sözcüklere TDK karşılıkları), <i>Deyim ve Atasözleri</i> (boşluk tamamlama) ve <i>Kültürel/Edebi Miras</i> sözcükleri.</li>' +
      '<li><b>2. Akıllı Yazım Koçu:</b> Tahmin sırasında sık yapılan bir yazım yanlışı (ör. <i>yanlız, herşey, kiprik, şöför</i>) girildiğinde tahmin hakkı yanmaz; ilgili TDK yazım kuralı anında açıklanır.</li>' +
      '<li><b>3. Sözlük ve Köken Kartı:</b> Sözcük bulunduğunda TDK anlamı, köken/yapı bilgisi ve örnek cümlesi ekranda açılır.</li>' +
      '</ul>' +
      '<h3>Puanlama ve İz Kartı</h3>' +
      '<ul><li>Puan = harf sayısı × 20 × (6 − deneme sırası). 5 harfli sözcüğü ilk denemede bulmak 500 puan kazandırır.</li>' +
      '<li>Sözcüğü bulunca torbadan <b>2 top</b> çekilir; İz Kartında yatay, dikey veya çapraz 5 sayı tamamlanınca <b>SÖZ İZİ!</b> (+' + L.LINGO_BONUS + ' puan) kazanılır.</li></ul>' +
      '<h3>Sınıf Turnuvası ve Araştırma Verisi</h3>' +
      '<ul><li>2–12 takımla akıllı tahtada lig ve eleme usulü turnuva yürütülebilir.</li>' +
      '<li>Üst menüdeki <b>📊 Araştırma</b> düğmesinden anonim başarı ve yazım yanlışı verileri <code>CSV</code> / <code>JSON</code> olarak indirilebilir.</li></ul>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" id="btn-help-intro">▶ Adım adım tanıtımı izle</button></div>'
    );
    $('btn-help-intro').addEventListener('click', function () {
      closeModal();
      if (window.LingoIntro) window.LingoIntro.show(0);
    });
  }

  function showStats() {
    var solvedPct = stats.wordsPlayed ? Math.round(100 * stats.wordsSolved / stats.wordsPlayed) : 0;
    var max = Math.max.apply(null, stats.attempts.concat([1]));
    var dist = stats.attempts.map(function (n, i) {
      var w = Math.max(8, Math.round(100 * n / max));
      return '<div class="dist-row"><span>' + (i + 1) + '</span><div class="dist-bar' + (n === max && n > 0 ? ' best' : '') + '" style="width:' + w + '%">' + n + '</div></div>';
    }).join('');
    showModal(
      '<h2>Bireysel İstatistikler</h2>' +
      '<div class="stat-grid">' +
      '<div class="stat"><b>' + stats.gamesPlayed + '</b><span>oturum</span></div>' +
      '<div class="stat"><b>' + stats.wordsPlayed + '</b><span>sözcük</span></div>' +
      '<div class="stat"><b>%' + solvedPct + '</b><span>başarı</span></div>' +
      '<div class="stat"><b>' + stats.bestScore + '</b><span>en iyi skor</span></div>' +
      '<div class="stat"><b>' + stats.lingos + '</b><span>SÖZ İZİ</span></div>' +
      '<div class="stat"><b>' + (stats.orthoCaught || 0) + '</b><span>yazım ipucu</span></div>' +
      '</div>' +
      '<h3>Deneme Dağılımı</h3><div class="dist">' + dist + '</div>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn secondary" id="btn-stats-res">📊 Araştırma Verilerini Aç</button><button class="btn ghost" id="btn-reset-stats">İstatistikleri sıfırla</button></div>'
    );
    $('btn-stats-res').addEventListener('click', function () {
      closeModal();
      showResearchModal();
    });
    $('btn-reset-stats').addEventListener('click', function () {
      if (!confirm('Tüm istatistikler silinsin mi?')) return;
      stats = JSON.parse(JSON.stringify(DEFAULT_STATS));
      save(STATS_KEY, stats);
      showStats();
    });
  }

  function showSettings() {
    showModal(
      '<h2>Görünüm ve Uygulama Ayarları</h2>' +
      '<div class="setting"><label>Renk teması<small>Klasik Levha: kırmızı kare / sarı daire · Yüksek Kontrast: yeşil / sarı</small></label>' +
      '<select id="set-theme"><option value="tv"' + (settings.theme === 'tv' ? ' selected' : '') + '>Klasik Levha</option><option value="wordle"' + (settings.theme === 'wordle' ? ' selected' : '') + '>Yüksek Kontrast</option></select></div>' +
      '<p style="margin-top:14px;color:var(--muted);font-size:13px">Dil modülü, harf sayısı, süre ve araştırma seçenekleri ana ekrandan belirlenir.</p>'
    );
    $('set-theme').addEventListener('change', function (e) {
      settings.theme = e.target.value; save(SETTINGS_KEY, settings);
      document.body.setAttribute('data-theme', settings.theme);
    });
  }

  /* ---------- Yardımcılar ---------- */
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ==================== Sınıf Turnuvası ==================== */

  var tourConfig = load('sozizi.tourConfig', {
    module: 'all', showClue: true, count: 4, names: [], time: 90, lengths: [4, 5, 6, 7], rounds: 2, playoff: true
  });

  function tourStageLabel() {
    var st = state.tour;
    if (st.stage === 'league') return 'Lig · ' + (st.round + 1) + '. tur';
    if (st.stage === 'semi') return 'Yarı final';
    if (st.stage === 'final') return 'Final';
    return 'Turnuva';
  }

  function tourProgressLabel() {
    var st = state.tour;
    if (st.stage === 'league') return (st.turnInRound + 1) + ' / ' + state.teams.length + '. takım';
    return (st.matchIndex + 1) + '. maç';
  }

  function showTourSetup() {
    $('screen-start').classList.add('hidden');
    $('screen-tour').classList.remove('hidden');
    var countSel = $('tour-count');
    var modSel = $('tour-module');
    if (!countSel.options.length) {
      if (modSel && S) {
        ['all', 'karsilik', 'deyim', 'miras', 'genel'].forEach(function (m) {
          if (S.MODULES[m]) modSel.appendChild(new Option(S.MODULES[m].name, m));
        });
        modSel.addEventListener('change', function () { tourConfig.module = modSel.value; tourEstimate(); });
      }
      for (var i = 2; i <= 12; i++) countSel.appendChild(new Option(i + ' takım', i));
      for (var r = 1; r <= 8; r++) $('tour-rounds').appendChild(new Option(r + ' tur', r));
      countSel.addEventListener('change', function () { tourConfig.count = Number(countSel.value); renderTourNames(); tourEstimate(); });
      $('tour-rounds').addEventListener('change', function () { tourConfig.rounds = Number($('tour-rounds').value); tourEstimate(); });
      $('tour-time').addEventListener('input', function () { tourConfig.time = Number($('tour-time').value); tourTimeLabel(); tourEstimate(); });
      Array.prototype.forEach.call(document.querySelectorAll('.tour-time-presets button'), function (b) {
        b.addEventListener('click', function () { tourConfig.time = Number(b.dataset.sec); $('tour-time').value = tourConfig.time; tourTimeLabel(); tourEstimate(); });
      });
      Array.prototype.forEach.call($('tour-lengths').querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          var n = Number(b.dataset.len);
          var idx = tourConfig.lengths.indexOf(n);
          if (idx === -1) tourConfig.lengths.push(n); else if (tourConfig.lengths.length > 1) tourConfig.lengths.splice(idx, 1);
          tourConfig.lengths.sort();
          renderTourLengths(); tourEstimate();
        });
      });
      if ($('tour-clue')) {
        $('tour-clue').addEventListener('change', function () { tourConfig.showClue = $('tour-clue').checked; tourEstimate(); });
      }
      $('tour-playoff').addEventListener('change', function () { tourConfig.playoff = $('tour-playoff').checked; tourEstimate(); });
      $('tour-start').addEventListener('click', tourStart);
      $('tour-back').addEventListener('click', goHome);
      $('tour-reset-used').addEventListener('click', function () {
        if (!confirm('Daha önce çıkan sözcüklerin kaydı silinsin mi?')) return;
        save(USED_KEY, {}); tourEstimate(); toast('Sözcük kaydı sıfırlandı');
      });
    }
    if (modSel) modSel.value = tourConfig.module || 'all';
    countSel.value = tourConfig.count;
    $('tour-rounds').value = tourConfig.rounds;
    $('tour-time').value = tourConfig.time;
    if ($('tour-clue')) $('tour-clue').checked = tourConfig.showClue !== false;
    $('tour-playoff').checked = tourConfig.playoff !== false;
    tourTimeLabel(); renderTourLengths(); renderTourNames(); tourEstimate();
  }

  function tourTimeLabel() {
    var t = tourConfig.time;
    $('tour-time-val').textContent = t >= 60 ? (t / 60).toLocaleString('tr-TR') + ' dk' : t + ' sn';
    Array.prototype.forEach.call(document.querySelectorAll('.tour-time-presets button'), function (b) { b.classList.toggle('active', Number(b.dataset.sec) === t); });
  }

  function renderTourLengths() {
    Array.prototype.forEach.call($('tour-lengths').querySelectorAll('button'), function (b) {
      b.classList.toggle('active', tourConfig.lengths.indexOf(Number(b.dataset.len)) !== -1);
    });
  }

  function renderTourNames() {
    var box = $('tour-names');
    box.innerHTML = '';
    for (var i = 0; i < tourConfig.count; i++) {
      var label = document.createElement('label');
      label.innerHTML = '<span class="team-dot" style="background:' + TEAM_COLORS[i % TEAM_COLORS.length] + '"></span>';
      var input = document.createElement('input');
      input.type = 'text'; input.maxLength = 18;
      input.value = (tourConfig.names[i] || '').trim() || (i + 1) + '. Takım';
      input.setAttribute('aria-label', (i + 1) + '. takım adı');
      (function (i, input) { input.addEventListener('input', function () { tourConfig.names[i] = input.value; }); })(i, input);
      label.appendChild(input);
      box.appendChild(label);
    }
  }

  function tourEstimate() {
    var c = tourConfig;
    var mod = c.module || 'all';
    var leagueWords = c.count * c.rounds;
    var playoffWords = c.playoff ? (c.count >= 4 ? 6 : 2) : 0;
    var perWord = c.time + 25;
    var minutes = Math.round((leagueWords + playoffWords) * perWord / 60);
    var modName = (S && S.MODULES[mod]) ? S.MODULES[mod].name : 'Karma';
    $('tour-estimate').innerHTML = 'Modül: <b>' + escapeHtml(modName) + '</b><br>Toplam <b>' + (leagueWords + playoffWords) + '</b> sözcük · tahmini <b>' + minutes + ' dk</b>' +
      '<br><span style="font-size:0.95rem">Lig: ' + c.rounds + ' tur × ' + c.count + ' takım = ' + leagueWords + ' sözcük' + (c.playoff ? ' · Eleme: ' + (c.count >= 4 ? 'yarı final (4) + final (2)' : 'final (2)') : '') + '. Turlar ' + c.lengths.join(' → ') + ' harf sırasıyla döner.</span>';
    var used = load(USED_KEY, {});
    $('tour-pool').innerHTML = 'Modül havuzu: ' + [4, 5, 6, 7].map(function (n) {
      var total = getPoolFor(mod, n).length;
      var u = Array.isArray(used[mod + '_' + n]) ? used[mod + '_' + n].length : 0;
      return n + ' harf ' + Math.max(0, total - u) + '/' + total + ' hazır';
    }).join(' · ');
    save('sozizi.tourConfig', tourConfig);
  }

  function tourStart() {
    var c = tourConfig;
    save('sozizi.tourConfig', c);
    var teams = [];
    for (var i = 0; i < c.count; i++) {
      teams.push({ name: (c.names[i] || '').trim() || (i + 1) + '. Takım', score: 0, solved: 0, played: 0, lingos: 0, rank: i + 1 });
    }
    state = {
      mode: 'tournament', orthoCoach: settings.orthoCoach !== false, length: c.lengths[0], teams: teams, current: 0, phase: 'between',
      timerHandle: null, timerRemaining: 0, timerTotal: 0, usedWords: [], wordIndex: 0, totalWords: c.count * c.rounds,
      wordStartedAt: Date.now(), orthoErrors: [],
      tour: {
        module: c.module || 'all', showClue: c.showClue !== false,
        timePerTeam: c.time, lengths: c.lengths.slice(), rounds: c.rounds, playoff: c.playoff !== false && c.count >= 2,
        stage: 'league', round: 0, turnInRound: 0, matchIndex: 0, matches: [], log: [], turn: null
      }
    };
    $('screen-tour').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    c.lengths.forEach(loadDictionary);
    tourSave();
    tourNextTurn();
  }

  function tourSave() {
    if (!state || state.mode !== 'tournament') return;
    save(TOUR_KEY, { teams: state.teams, tour: state.tour, current: state.current, length: state.length, savedAt: Date.now() });
  }

  function tourClearSaved() { try { localStorage.removeItem(TOUR_KEY); } catch (e) { /* yok say */ } }

  function renderTourResume() {
    var saved = load(TOUR_KEY, {});
    var row = $('tour-resume-row');
    if (!saved || !saved.tour || saved.tour.stage === 'done') { row.classList.add('hidden'); return; }
    row.classList.remove('hidden');
    var st = saved.tour;
    var label = st.stage === 'league' ? 'Lig ' + (st.round + 1) + '. tur' : st.stage === 'semi' ? 'Yarı final' : 'Final';
    $('tour-resume-info').textContent = 'Sınıf turnuvası · ' + saved.teams.length + ' takım · ' + label;
  }

  function tourResume() {
    var saved = load(TOUR_KEY, {});
    if (!saved.tour || !saved.teams) return;
    state = {
      mode: 'tournament', orthoCoach: settings.orthoCoach !== false, length: saved.length, teams: saved.teams, current: saved.current || 0, phase: 'between',
      timerHandle: null, timerRemaining: 0, timerTotal: 0, usedWords: [], wordIndex: 0, totalWords: saved.teams.length * saved.tour.rounds,
      wordStartedAt: Date.now(), orthoErrors: [],
      tour: saved.tour
    };
    state.tour.turn = null;
    $('screen-start').classList.add('hidden');
    $('screen-game').classList.remove('hidden');
    tourNextTurn();
  }

  function tourStandings(teams) {
    return (teams || state.teams).slice().sort(function (a, b) { return b.score - a.score || b.solved - a.solved || a.rank - b.rank; });
  }

  function tourNextTurn() {
    var st = state.tour;
    if (st.stage === 'league') {
      if (st.round >= st.rounds) { tourLeagueDone(); return; }
      var length = st.lengths[st.round % st.lengths.length];
      tourShowReady(st.turnInRound, length);
      return;
    }
    if (st.stage === 'semi' || st.stage === 'final') {
      var m = st.matches[st.matchIndex];
      if (!m) { tourStageDone(); return; }
      var side = m.playedA === m.playedB ? 'a' : 'b';
      if (m.playedA > m.playedB) side = 'b';
      tourShowReady(side === 'a' ? m.a : m.b, m.length, m);
      return;
    }
    tourEnd();
  }

  function tourShowReady(teamIndex, length, match) {
    state.current = teamIndex;
    state.length = length;
    loadDictionary(length);
    state.phase = 'ready';
    state.tour.turn = { team: teamIndex, length: length, match: match ? state.tour.matches.indexOf(match) : -1 };
    state.rows = []; state.attempt = 0; state.input = []; state.firstTyped = false; state.keyStates = {}; state.known = null;
    state.target = null;
    hideOrthoCoach();
    clearWordInsightPanel();
    $('clue-banner').classList.add('hidden');
    $('timer').style.visibility = 'hidden';
    renderStatus(); renderScoreboard(); renderCards(); renderKeyboard();
    $('board').innerHTML = '';
    var team = state.teams[teamIndex];
    var color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
    var matchInfo = match ? '<div class="ready-meta">Rakip: <b>' + escapeHtml(state.teams[match.a === teamIndex ? match.b : match.a].name) + '</b>' + (match.scoreA || match.scoreB ? ' · Maç durumu ' + match.scoreA + ' – ' + match.scoreB : '') + '</div>' : '';
    showModal(
      '<div class="ready-box" style="--team-color:' + color + '">' +
      '<div class="ready-kicker">' + tourStageLabel() + ' · Sıra</div>' +
      '<div class="ready-name">' + escapeHtml(team.name) + '</div>' +
      '<div class="ready-meta"><b>' + length + ' harfli</b> sözcük · <b>' + state.tour.timePerTeam + ' sn</b> · en fazla 5 tahmin</div>' + matchInfo +
      '<div class="btn-row" style="justify-content:center;margin-top:1.2rem"><button class="btn" id="btn-tour-go" style="font-size:1.25rem;padding:0.8rem 2rem">Başla</button></div>' +
      '<p class="status" style="margin-top:0.8rem">Enter tuşu da başlatır. Süre "Başla" ile akmaya başlar.</p>' +
      '</div>'
    );
    $('btn-tour-go').addEventListener('click', function () { closeModal(); tourStartWord(); });
    $('btn-tour-go').dataset.primary = '1';
    tourSave();
  }

  function tourStartWord() {
    if (!state || state.mode !== 'tournament' || state.phase !== 'ready') return;
    state.target = L.toUpperTr(chooseWord());
    state.rows = [];
    state.attempt = 0;
    state.known = L.knownLetters(state.target, []);
    state.input = [];
    state.firstTyped = false;
    state.keyStates = {};
    state.timeoutPending = false;
    state.wordStartedAt = Date.now();
    state.orthoErrors = [];
    state.phase = 'guess';
    hideOrthoCoach();
    flashTurn(state.teams[state.current].name, TEAM_COLORS[state.current % TEAM_COLORS.length], state.length + ' harfli sözcük · ' + state.tour.timePerTeam + ' sn');
    renderAll();
    startTimer();
  }

  function tourWordEnd(solved) {
    stopTimer();
    state.phase = 'between';
    var team = state.teams[state.current];
    var remaining = Math.max(0, Math.ceil(state.timerRemaining / 1000));
    var base = solved ? L.wordScore(state.length, state.attempt) : 0;
    var bonus = solved ? remaining : 0;
    var points = base + bonus;
    var st = state.tour;
    var turn = st.turn || {};
    var match = turn.match >= 0 ? st.matches[turn.match] : null;

    if (match) {
      if (match.a === state.current) { match.scoreA += points; match.playedA += 1; } else { match.scoreB += points; match.playedB += 1; }
    } else {
      team.score += points;
    }
    team.played += 1;
    if (solved) team.solved += 1;
    st.log.push({ stage: st.stage, round: st.round, team: state.current, target: state.target, solved: solved, attempt: state.attempt, points: points, remaining: remaining });

    stats.wordsPlayed += 1;
    if (solved) { stats.wordsSolved += 1; stats.attempts[state.attempt - 1] += 1; }
    save(STATS_KEY, stats);
    recordResearchTrial(solved);

    if (st.stage === 'league') {
      st.turnInRound += 1;
      if (st.turnInRound >= state.teams.length) { st.turnInRound = 0; st.round += 1; }
    } else if (match) {
      if (match.playedA === match.playedB) {
        if (match.scoreA !== match.scoreB) { match.winner = match.scoreA > match.scoreB ? match.a : match.b; st.matchIndex += 1; }
        else { match.overtime = (match.overtime || 0) + 1; }
      }
    }
    st.turn = null;
    tourSave();

    renderAll();
    if (solved) bounceRow(state.rows.length - 1);
    var color = TEAM_COLORS[state.current % TEAM_COLORS.length];
    var roundOver = st.stage === 'league' && st.turnInRound === 0;
    var nextLabel = roundOver ? 'Puan tablosu' : (match && match.winner !== undefined ? 'Maç sonucu' : 'Sıradaki takım');
    setTimeout(function () {
      showModal(
        '<div class="ready-box" style="--team-color:' + color + '">' +
        '<div class="ready-kicker">' + escapeHtml(team.name) + '</div>' +
        '<h2 style="margin:0.3rem 0">' + (solved ? 'Sözcük Bulundu!' : 'Süre / Hak Tamamlandı') + '</h2>' +
        buildWordInsightHtml(state.target) +
        (solved
          ? '<div class="result-line"><b>+' + points + '</b> puan <span style="font-size:0.95rem">(' + state.attempt + '. denemede ' + base + (bonus ? ' + kalan ' + remaining + ' sn için ' + bonus : '') + ')</span></div>'
          : '<div class="result-line">Bu sözcük için puan alınamadı.</div>') +
        (match ? '<div class="result-line">Maç durumu: ' + escapeHtml(state.teams[match.a].name) + ' <b>' + match.scoreA + '</b> – <b>' + match.scoreB + '</b> ' + escapeHtml(state.teams[match.b].name) + (match.overtime && match.winner === undefined && match.playedA === match.playedB ? ' · Berabere, uzatma!' : '') + '</div>' : '') +
        '<div class="btn-row" style="justify-content:center;margin-top:0.8rem"><button class="btn" id="btn-tour-next">' + nextLabel + ' →</button></div>' +
        '</div>'
      );
      var b = $('btn-tour-next');
      b.addEventListener('click', function () { closeModal(); tourAfterResult(roundOver, match); });
      b.dataset.primary = '1';
    }, solved ? 900 : 400);
  }

  function tourAfterResult(roundOver, match) {
    var st = state.tour;
    if (roundOver) { tourShowStandings(st.round >= st.rounds ? 'Lig tamamlandı' : (st.round) + '. tur sonu puan durumu', function () { tourNextTurn(); }); return; }
    if (match && match.winner !== undefined) { tourShowBracket(function () { tourNextTurn(); }); return; }
    tourNextTurn();
  }

  function tourStandingsTable(highlightTop) {
    var rows = tourStandings();
    return '<table class="tour-table"><thead><tr><th>#</th><th>Takım</th><th style="text-align:right">Sözcük</th><th style="text-align:right">Puan</th></tr></thead><tbody>' +
      rows.map(function (t, i) {
        var idx = state.teams.indexOf(t);
        return '<tr class="' + (highlightTop && i < highlightTop ? 'qualify' : '') + '"><td>' + (i + 1) + '</td><td><span class="team-dot" style="background:' + TEAM_COLORS[idx % TEAM_COLORS.length] + '"></span>' + escapeHtml(t.name) + '</td><td class="num">' + t.solved + '/' + t.played + '</td><td class="num">' + t.score + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function tourShowStandings(title, onNext) {
    var st = state.tour;
    var leagueDone = st.stage === 'league' && st.round >= st.rounds;
    var qualify = leagueDone && st.playoff ? Math.min(4, state.teams.length) : 0;
    var note = leagueDone ? (st.playoff ? (state.teams.length >= 4 ? 'İlk 4 takım yarı finale çıkıyor: 1 – 4 ve 2 – 3 eşleşir.' : 'İlk 2 takım finalde karşılaşıyor.') : 'Turnuva tamamlandı.') : 'Sıradaki tur: ' + st.lengths[st.round % st.lengths.length] + ' harfli sözcükler.';
    showModal('<h2>' + escapeHtml(title) + '</h2>' + tourStandingsTable(qualify) + '<p>' + note + '</p>' +
      '<div class="btn-row"><button class="btn" id="btn-tour-next">Devam →</button></div>');
    var b = $('btn-tour-next');
    b.addEventListener('click', function () { closeModal(); onNext(); });
    b.dataset.primary = '1';
  }

  function tourLeagueDone() {
    var st = state.tour;
    var order = tourStandings();
    order.forEach(function (t, i) { t.rank = i + 1; });
    if (!st.playoff) { st.stage = 'done'; tourSave(); tourEnd(); return; }
    var idx = function (t) { return state.teams.indexOf(t); };
    var len = st.lengths[st.lengths.length - 1];
    if (state.teams.length >= 4) {
      st.stage = 'semi';
      st.matches = [
        { stage: 'semi', a: idx(order[0]), b: idx(order[3]), scoreA: 0, scoreB: 0, playedA: 0, playedB: 0, length: len },
        { stage: 'semi', a: idx(order[1]), b: idx(order[2]), scoreA: 0, scoreB: 0, playedA: 0, playedB: 0, length: len }
      ];
    } else {
      st.stage = 'final';
      st.matches = [{ stage: 'final', a: idx(order[0]), b: idx(order[1]), scoreA: 0, scoreB: 0, playedA: 0, playedB: 0, length: len }];
    }
    st.matchIndex = 0;
    tourSave();
    tourShowBracket(function () { tourNextTurn(); });
  }

  function tourStageDone() {
    var st = state.tour;
    if (st.stage === 'semi') {
      var w1 = st.matches[0].winner, w2 = st.matches[1].winner;
      st.stage = 'final';
      st.matches.push({ stage: 'final', a: w1, b: w2, scoreA: 0, scoreB: 0, playedA: 0, playedB: 0, length: st.lengths[st.lengths.length - 1] });
      st.matchIndex = st.matches.length - 1;
      tourSave();
      tourShowBracket(function () { tourNextTurn(); });
      return;
    }
    st.stage = 'done';
    tourSave();
    tourEnd();
  }

  function tourMatchHtml(m) {
    var side = function (i, score, isWinner, right) {
      return '<div class="side' + (right ? ' right' : '') + (isWinner ? ' winner' : '') + '"><span class="team-dot" style="background:' + TEAM_COLORS[i % TEAM_COLORS.length] + '"></span><span class="name">' + escapeHtml(state.teams[i].name) + '</span><span class="pts">' + score + '</span></div>';
    };
    return '<div class="match">' + side(m.a, m.scoreA, m.winner === m.a, false) + '<span class="vs">' + (m.stage === 'final' ? 'FİNAL' : 'YARI FİNAL') + '</span>' + side(m.b, m.scoreB, m.winner === m.b, true) + '</div>';
  }

  function tourShowBracket(onNext) {
    var st = state.tour;
    var html = '<h2>' + (st.stage === 'final' ? 'Final' : 'Yarı final') + ' eşleşmeleri</h2><div class="match-list">' + st.matches.map(tourMatchHtml).join('') + '</div>' +
      '<p>Her maçta iki takım da aynı uzunlukta (' + st.lengths[st.lengths.length - 1] + ' harf) birer sözcük çözer; yüksek puan kazanır. Beraberlikte birer sözcük daha oynanır.</p>' +
      '<div class="btn-row"><button class="btn" id="btn-tour-next">Devam →</button></div>';
    showModal(html);
    var b = $('btn-tour-next');
    b.addEventListener('click', function () { closeModal(); onNext(); });
    b.dataset.primary = '1';
  }

  function tourEnd() {
    stopTimer();
    state.phase = 'over';
    var st = state.tour;
    st.stage = 'done';
    stats.gamesPlayed += 1;
    save(STATS_KEY, stats);
    tourClearSaved();
    var champion = null;
    var finals = st.matches.filter(function (m) { return m.stage === 'final' && m.winner !== undefined; });
    if (finals.length) champion = state.teams[finals[finals.length - 1].winner];
    else champion = tourStandings()[0];
    var html = '<h2>Turnuva Tamamlandı</h2>' +
      '<p class="winner" style="font-family:var(--serif);font-size:1.6rem;font-weight:700;margin:0 0 0.6rem">🏆 ' + escapeHtml(champion.name) + ' birinci oldu!</p>' +
      (st.matches.length ? '<div class="match-list">' + st.matches.map(tourMatchHtml).join('') + '</div>' : '') +
      '<h3>Lig Puan Durumu</h3>' + tourStandingsTable(0) +
      '<div class="btn-row"><button class="btn" id="btn-tour-again">Yeni turnuva</button><button class="btn secondary" id="btn-tour-res">Araştırma Verisi</button><button class="btn ghost" id="btn-menu">Ana menü</button></div>';
    showModal(html);
    $('btn-tour-again').addEventListener('click', function () { closeModal(); state = null; $('screen-game').classList.add('hidden'); showTourSetup(); });
    $('btn-tour-res').addEventListener('click', function () { closeModal(); goHome(); showResearchModal(); });
    $('btn-menu').addEventListener('click', function () { closeModal(); goHome(); });
  }

  function renderStandings(sb) {
    var st = state.tour;
    var rows = tourStandings();
    var inMatch = st.stage !== 'league' && st.matches[st.matchIndex];
    var html = '<div class="standings"><h3><span>' + tourStageLabel() + '</span><span>' + (st.stage === 'league' ? st.lengths[st.round % st.lengths.length] + ' harf' : 'eleme') + '</span></h3>';
    if (inMatch) {
      html += st.matches.slice(st.stage === 'final' ? -1 : 0).filter(function (m) { return m.stage === st.stage; }).map(tourMatchHtml).join('');
      html += '<h3 style="margin-top:0.6rem"><span>Lig sıralaması</span></h3>';
    }
    html += rows.map(function (t, i) {
      var idx = state.teams.indexOf(t);
      var active = idx === state.current && state.phase !== 'over';
      var out = st.stage !== 'league' && !st.matches.some(function (m) { return (m.a === idx || m.b === idx) && m.stage === st.stage; });
      return '<div class="standing' + (active ? ' active' : '') + (out ? ' out' : '') + '" style="--team-color:' + TEAM_COLORS[idx % TEAM_COLORS.length] + '">' +
        '<span class="rank">' + (i + 1) + '</span><span class="team-dot" style="background:' + TEAM_COLORS[idx % TEAM_COLORS.length] + '"></span>' +
        '<span class="name">' + escapeHtml(t.name) + (active ? '<span class="team-turn-tag">Sırada</span>' : '') + '<span class="meta">' + t.solved + '/' + t.played + ' sözcük</span></span>' +
        '<span class="pts">' + t.score + '</span></div>';
    }).join('');
    html += '</div>';
    sb.innerHTML = html;
  }

  $('btn-tour-resume').addEventListener('click', tourResume);
  renderTourResume();

  /* ---------- Olaylar ---------- */
  document.addEventListener('keydown', function (e) {
    if (window.LingoIntro && window.LingoIntro.isOpen()) return;
    if (modalOpen()) {
      if (e.key === 'Escape') $('modal-close').click();
      else if (e.key === 'Enter') { var primary = document.querySelector('#modal [data-primary]'); if (primary) { e.preventDefault(); primary.click(); } }
      return;
    }
    if (!state) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); handleKey('ENTER'); return; }
    if (e.key === 'Backspace') { e.preventDefault(); handleKey('BACKSPACE'); return; }
    if (e.key.length === 1) {
      var k = L.toUpperTr(e.key);
      if (ALPHABET.indexOf(k) !== -1) { e.preventDefault(); handleKey(k); }
    }
  });

  $('btn-help').addEventListener('click', showHelp);
  $('btn-stats').addEventListener('click', showStats);
  if ($('btn-research')) $('btn-research').addEventListener('click', showResearchModal);
  $('btn-settings').addEventListener('click', showSettings);
  $('btn-home').addEventListener('click', function () {
    if (state && state.phase !== 'over' && state.mode !== 'daily') {
      var msg = state.mode === 'tournament' ? 'Turnuvadan çıkılsın mı? Puanlar saklanır; ana menüden kaldığı yerden devam edebilirsiniz.' : 'Çalışmadan çıkılsın mı? Mevcut tur ilerlemesi kapanır.';
      if (!confirm(msg)) return;
    }
    closeModal();
    goHome();
  });
  $('modal-close').addEventListener('click', function () {
    var next = $('modal-next');
    var cont = $('btn-continue');
    var tourStartBtn = $('btn-tour-go');
    var tourNext = $('btn-tour-next');
    closeModal();
    if (tourStartBtn) { tourStartWord(); return; }
    if (tourNext) { tourNextTurn(); return; }
    if (next) nextWord();
    else if (state && state.phase === 'over') goHome();
    else if (cont) { /* çekiliş paneli görünür kalır */ }
  });
  $('modal').addEventListener('click', function (e) {
    if (e.target === $('modal')) $('modal-close').click();
  });

  initStartScreen();
  loadServerWords();
  loadServerConfig();

  function currentDictionary() {
    return (state && dictionaries[state.length]) || null;
  }

  function dictionaryActive() {
    return serverConfig.dictionary !== false && !!currentDictionary();
  }

  function loadDictionary(length) {
    if (!length || dictionaries[length] || dictionaryLoading[length]) return;
    if (location.protocol === 'file:' || typeof fetch !== 'function') return;
    dictionaryLoading[length] = true;
    fetch('sozluk/' + length + '.txt', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (text) {
        if (text) {
          var set = L.parseDictionaryText(text);
          (WORDS[length] || []).forEach(function (w) { set.add(w); });
          if (S && typeof S.getWordsForModule === 'function') {
            S.getWordsForModule('all', length, WORDS).forEach(function (w) { set.add(w); });
          }
          if (set.size) dictionaries[length] = set;
        }
      })
      .catch(function () { /* sözlük yoksa denetim yapılmaz */ })
      .then(function () { dictionaryLoading[length] = false; });
  }

  function loadServerConfig() {
    if (location.protocol === 'file:' || typeof fetch !== 'function') return;
    fetchFirst([
      { url: 'api/settings', parse: function (t) { return L.sanitizeSettings(JSON.parse(t)); } },
      { url: 'ayarlar.txt', parse: L.parseSettingsText }
    ]).then(function (cfg) {
      if (cfg) serverConfig = Object.assign({}, serverConfig, cfg);
    });
  }

  function loadServerWords() {
    if (location.protocol === 'file:' || typeof fetch !== 'function') return;
    fetchFirst([
      { url: 'api/words', parse: function (t) { var d = JSON.parse(t); return { store: L.sanitizeWordStore(d.words), server: true }; } },
      { url: 'kelimeler.txt', parse: function (t) { return { store: L.parseWordsText(t), server: false }; } }
    ]).then(function (data) {
      if (!data) return;
      var store = data.store;
      var ok = [4, 5, 6, 7].every(function (n) { return store[n].length > 0; });
      if (!ok) return;
      WORDS = store;
      serverAvailable = data.server;
      updateModuleCountInfo();
      var link = $('admin-link');
      if (link) {
        var total = [4, 5, 6, 7].reduce(function (a, n) { return a + store[n].length; }, 0);
        link.textContent = 'Sözcük havuzu yönetimi (' + total + ' sözcük)';
        link.classList.remove('hidden');
      }
    });
  }

  function fetchFirst(sources) {
    var i = 0;
    function next() {
      if (i >= sources.length) return Promise.resolve(null);
      var src = sources[i++];
      return fetch(src.url, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) return next();
        return r.text().then(function (t) {
          try { return src.parse(t); } catch (e) { return next(); }
        });
      }).catch(next);
    }
    return next();
  }

  if (/[?&]debug=1/.test(location.search)) {
    window.__sozIziDebug = {
      getState: function () { return state; },
      getSettings: function () { return settings; },
      getServerConfig: function () { return serverConfig; },
      getDictionary: function () { return currentDictionary(); },
      dictionaryActive: dictionaryActive
    };
  }
})();
