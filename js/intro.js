/* Söz İzi etkileşimli tanıtım: canlı mini örneklerle çalışma adımları.
 * İlk ziyarette otomatik açılır; ana menüden ve kurallar penceresinden yeniden izlenebilir.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var SEEN_KEY = 'sozizi.introSeen';
  var timers = [];
  var step = 0;
  var open = false;

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function makeRow(letters, classes) {
    var row = el('div', 'row');
    row.style.setProperty('--cols', letters.length);
    letters.forEach(function (ch, i) {
      var c = el('div', 'cell' + (classes && classes[i] ? ' ' + classes[i] : ''), ch || '');
      row.appendChild(c);
    });
    return row;
  }

  function typeThenReveal(row, letters, states, startDelay, onDone) {
    var cells = row.querySelectorAll('.cell');
    var t = startDelay || 0;
    for (var i = 1; i < letters.length; i++) {
      (function (i) {
        later(function () {
          cells[i].textContent = letters[i];
          cells[i].classList.add('typed', 'pop');
        }, t);
      })(i);
      t += 260;
    }
    t += 500;
    later(function () { row.classList.remove('active'); }, t);
    for (var j = 0; j < letters.length; j++) {
      (function (j) {
        later(function () {
          cells[j].classList.remove('typed', 'locked');
          cells[j].classList.add('flip');
          later(function () { cells[j].classList.add(states[j]); }, 250);
        }, t + j * 140);
      })(j);
    }
    if (onDone) later(onDone, t + letters.length * 140 + 500);
  }

  function legend() {
    var box = el('div', 'intro-legend');
    [['correct', 'İ', 'Doğru harf, doğru yer'], ['present', 'L', 'Doğru harf, yanlış yer'], ['absent', 'K', 'Sözcükte yok']].forEach(function (x) {
      var item = el('div', 'intro-legend-item');
      item.appendChild(makeRow([x[1]], [x[0]]));
      item.appendChild(el('span', '', x[2]));
      box.appendChild(item);
    });
    return box;
  }

  var STEPS = [
    {
      title: 'Bağlam ipucunu ve ilk harfi incele',
      text: 'Her turda seçtiğiniz dil modülüne (Türkçenin Karşılıkları, Deyim ve Atasözleri veya Kültürel Miras) ait gizli bir sözcük vardır. Bağlam ipucu ve ilk harf verilir; sözcüğü bulmak için 5 tahmin hakkınız bulunur.',
      demo: function (box) {
        var clue = el('div', 'clue-banner');
        clue.innerHTML = '<div class="clue-head"><span class="clue-badge">Yabancı Sözcüğe Karşılık</span><span class="clue-foreign">Yabancı biçim: mesaj</span></div>' +
          '<p class="clue-text">Günlük dilde ve bilişimde "mesaj" yerine kullanılan Türkçe karşılık.</p>';
        box.appendChild(clue);
        var board = el('div', 'board');
        var row = makeRow(['İ', '', '', '', ''], ['locked', null, null, null, null]);
        row.classList.add('active');
        board.appendChild(row);
        box.appendChild(board);
        var cells = row.querySelectorAll('.cell');
        function blink() {
          cells[1].classList.toggle('cursor');
          later(blink, 600);
        }
        blink();
      }
    },
    {
      title: 'Tahmin et, renkli ipuçlarını oku',
      text: 'Aynı harfle başlayan geçerli bir Türkçe sözcük yazıp ENTER\'a basın. Kırmızı kare: harf doğru yerde. Sarı daire: harf sözcükte var ama başka yerde. Gri: sözcükte yok.',
      demo: function (box) {
        var board = el('div', 'board');
        var row = makeRow(['K', '', '', '', ''], ['locked', null, null, null, null]);
        row.classList.add('active');
        board.appendChild(row);
        box.appendChild(board);
        box.appendChild(legend());
        var cap = el('div', 'intro-caption', 'Hedef sözcük KURGU, tahmin KURAM');
        box.appendChild(cap);
        typeThenReveal(row, ['K', 'U', 'R', 'A', 'M'], ['correct', 'correct', 'correct', 'absent', 'absent'], 600);
      }
    },
    {
      title: 'Akıllı Yazım Koçu ile doğru yazımı öğren',
      text: 'Tahmin sırasında sık yapılan bir yazım yanlışı (örneğin YANLIZ, HERŞEY, KİPRİK, ŞÖFÖR) yazdığınızda tahmin hakkınız yanmaz; Yazım Koçu ilgili TDK kuralını anında açıklar.',
      demo: function (box) {
        var board = el('div', 'board');
        var r1 = makeRow(['Y', 'A', 'N', 'L', 'I', 'Z'], ['locked', 'typed', 'typed', 'typed', 'typed', 'typed']);
        r1.classList.add('active');
        board.appendChild(r1);
        var coach = el('div', 'ortho-coach');
        coach.innerHTML = '<div class="ortho-head"><span class="ortho-tag">✎ Akıllı Yazım Koçu · Ünlü Düşmesi Hatası</span>' +
          '<span class="ortho-pair"><del>YANLIZ</del> → <ins>YALNIZ</ins></span></div>' +
          '<p class="ortho-rule">"Yalın" kökünden "+ız" ekiyle türetilirken dar ünlü düşer ve "yalnız" biçiminde yazılır.</p>';
        box.appendChild(board);
        box.appendChild(coach);
      }
    },
    {
      title: 'Sözlük ve Köken Kartıyla anlamı pekiştir',
      text: 'Sözcük bulunduğunda (veya hak tamamlandığında) TDK anlamı, köken/ek yapısı ve örnek cümlesini içeren Sözlük Kartı açılır; böylece yalnızca harf değil anlam ve kültür bilgisi de kalıcılaşır.',
      demo: function (box) {
        var card = el('div', 'word-insight');
        card.style.maxWidth = '540px';
        card.innerHTML = '<div class="word-insight-head"><span class="word-insight-word">ÖZÇEKİM</span><span class="word-insight-badge">Yabancı Sözcüğe Karşılık</span></div>' +
          '<div class="word-insight-row"><strong>TDK Anlamı:</strong>Kişinin kendi fotoğrafını kendisinin çekmesi ve bu yolla elde edilen fotoğraf.</div>' +
          '<div class="word-insight-row"><strong>Köken ve Yapı:</strong>"öz" + "çekim" birleşimiyle "selfie" yerine önerilmiştir.</div>' +
          '<div class="word-insight-example">“Müze gezisi sonunda öğrenciler hatıra olarak bir özçekim yaptı.”</div>';
        box.appendChild(card);
      }
    },
    {
      title: 'İz Kartında beşli sırayı tamamla: SÖZ İZİ!',
      text: 'Sözcüğü bulunca torbadan 2 top çekersiniz. Numaralı top İz Kartındaki sayıyı işaretler, yeşil top ek hak verir, "?" topu dilediğiniz sayıyı seçtirir. Yatay, dikey veya çapraz 5 sayı dolunca SÖZ İZİ! (+500 puan).',
      demo: function (box) {
        var card = el('div', 'lingo-card intro-card');
        var grid = el('div', 'card-grid');
        var nums = [2, 14, 26, 38, 50, 4, 16, 28, 40, 52, 6, 18, 30, 42, 54, 8, 20, 32, 44, 56, 10, 22, 34, 46, 58];
        var marked = { 2: 1, 14: 1, 38: 1, 16: 1, 42: 1, 8: 1, 56: 1, 22: 1 };
        var cells = {};
        nums.forEach(function (n) {
          var c = el('div', 'card-cell' + (marked[n] ? ' marked' : ''), n);
          cells[n] = c; grid.appendChild(c);
        });
        card.appendChild(grid);
        var balls = el('div', 'balls');
        box.appendChild(card); box.appendChild(balls);
        var cap = el('div', 'intro-caption', 'Sözcük bulundu! Top çekiliyor…');
        box.appendChild(cap);
        function ball(type, label) { var b = el('span', 'ball ' + type, label); balls.appendChild(b); return b; }
        later(function () { ball('number', '26'); cells[26].classList.add('marked', 'just'); }, 900);
        later(function () { ball('green', '+1'); cap.textContent = 'Yeşil top: bir çekiliş hakkı daha!'; }, 1900);
        later(function () { ball('number', '50'); cells[50].classList.add('marked', 'just'); cap.textContent = 'İlk satır tamamlandı…'; }, 2900);
        later(function () {
          [2, 14, 26, 38, 50].forEach(function (n) { cells[n].classList.add('lingo'); });
          cap.textContent = 'SÖZ İZİ! +500 puan ve yeni İz Kartı.';
        }, 3700);
      }
    },
    {
      title: 'Sınıf Turnuvası ve Araştırma Verisi',
      text: 'Bireysel çalışma, İki Takım, Günün Sözcüğü veya 2–12 takımlı Sınıf Turnuvası modlarından birini seçin. Üst menüdeki 📊 Araştırma düğmesinden anonim performans ve yazım yanlışı verilerini CSV/JSON olarak indirebilirsiniz.',
      demo: function (box) {
        var grid = el('div', 'intro-modes');
        [['Mod I', 'Bireysel'], ['Mod II', 'İki Takım'], ['Mod III', 'Günün Sözcüğü'], ['Mod IV', 'Sınıf Turnuvası']].forEach(function (m, i) {
          var c = el('div', 'intro-mode');
          c.appendChild(el('span', 'mode-fig', m[0]));
          c.appendChild(el('span', 'mode-name', m[1]));
          c.style.animationDelay = (i * 150) + 'ms';
          grid.appendChild(c);
        });
        box.appendChild(grid);
      }
    }
  ];

  function render() {
    clearTimers();
    var s = STEPS[step];
    $('intro-title').textContent = s.title;
    $('intro-text').textContent = s.text;
    $('intro-step-label').textContent = (step + 1) + ' / ' + STEPS.length;
    var demo = $('intro-demo');
    demo.innerHTML = '';
    demo.classList.remove('intro-fade');
    void demo.offsetWidth;
    demo.classList.add('intro-fade');
    s.demo(demo);
    $('intro-prev').disabled = step === 0;
    $('intro-next').textContent = step === STEPS.length - 1 ? 'Başla' : 'İleri';
    var dots = $('intro-dots');
    dots.innerHTML = '';
    STEPS.forEach(function (_, i) {
      var d = el('button', 'intro-dot' + (i === step ? ' active' : ''));
      d.setAttribute('aria-label', (i + 1) + '. adım');
      d.addEventListener('click', function () { step = i; render(); });
      dots.appendChild(d);
    });
  }

  function show(startStep) {
    step = startStep || 0;
    open = true;
    $('intro').classList.remove('hidden');
    render();
    $('intro-next').focus();
  }

  function hide() {
    clearTimers();
    open = false;
    $('intro').classList.add('hidden');
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* yok say */ }
  }

  function next() { if (step < STEPS.length - 1) { step++; render(); } else hide(); }
  function prev() { if (step > 0) { step--; render(); } }

  $('intro-next').addEventListener('click', next);
  $('intro-prev').addEventListener('click', prev);
  $('intro-skip').addEventListener('click', hide);
  $('intro').addEventListener('click', function (e) { if (e.target === $('intro')) hide(); });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  }, true);

  var btn = $('btn-intro');
  if (btn) btn.addEventListener('click', function () { show(0); });

  window.LingoIntro = { show: show, hide: hide, isOpen: function () { return open; } };

  var seen = false;
  try { seen = !!localStorage.getItem(SEEN_KEY); } catch (e) { seen = false; }
  if (!seen && !/[?&]intro=0/.test(location.search)) show(0);
})();
