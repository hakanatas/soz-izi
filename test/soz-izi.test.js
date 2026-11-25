'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const L = require('../js/logic.js');
const S = require('../js/soz-izi-data.js');
const WORDS = require('../js/words.js');

test('Söz İzi modülleri: tüm maddeler geçerli uzunlukta, Türk alfabesinde ve eksiksiz alanlara sahip', () => {
  assert.ok(S.ENTRIES.length >= 120, 'en az 120 zenginleştirilmiş dilbilimsel madde bulunmalı');
  const dicts = {};
  for (const n of [4, 5, 6, 7]) {
    dicts[n] = L.parseDictionaryText(fs.readFileSync(`sozluk/${n}.txt`, 'utf8'));
  }

  for (const entry of S.ENTRIES) {
    const w = L.normalizeWord(entry.word);
    const v = L.validateWord(w);
    assert.equal(v.ok, true, `${entry.word} geçerli olmalı (${v.reason || ''})`);
    assert.ok(['karsilik', 'deyim', 'miras'].includes(entry.module), `${w} geçerli modülde olmalı`);
    assert.ok(entry.clue && entry.clue.length > 10, `${w} bağlam ipucu içermeli`);
    assert.ok(entry.meaning && entry.meaning.length > 10, `${w} TDK anlamı içermeli`);
    assert.ok(entry.origin && entry.origin.length > 10, `${w} köken/yapı bilgisi içermeli`);
    assert.ok(entry.example && entry.example.length > 10, `${w} örnek cümle içermeli`);
    assert.equal(dicts[v.length].has(w), true, `${w} sozluk/${v.length}.txt içinde bulunmalı`);
  }
});

test('Her modül ve her harf uzunluğu (4–7) için yeterli sözcük havuzu bulunur', () => {
  const counts = S.moduleWordCounts(WORDS);
  for (const mod of ['all', 'karsilik', 'deyim', 'miras', 'genel']) {
    for (const len of [4, 5, 6, 7]) {
      assert.ok(counts[mod][len] >= 8, `${mod} modülü ${len} harf havuzu dolu olmalı (${counts[mod][len]})`);
    }
  }
  const ozcekim = S.getEntry('ÖZÇEKİM');
  assert.ok(ozcekim);
  assert.equal(ozcekim.module, 'karsilik');
  assert.equal(ozcekim.foreign, 'selfie');
});

test('Akıllı Yazım Koçu: bilinen sık yazım yanlışlarını doğru kural ve kategoriyle yakalar', () => {
  const r1 = S.diagnoseOrthography('yanlız', null);
  assert.equal(r1.found, true);
  assert.equal(r1.suggested, 'YALNIZ');
  assert.match(r1.category, /Ünlü Düşmesi/);

  const r2 = S.diagnoseOrthography('HERŞEY', null);
  assert.equal(r2.found, true);
  assert.equal(r2.suggested, 'HER ŞEY');
  assert.match(r2.category, /Bitişik \/ Ayrı/);

  const r3 = S.diagnoseOrthography('kiprik', null);
  assert.equal(r3.found, true);
  assert.equal(r3.suggested, 'KİRPİK');
  assert.match(r3.category, /Göçüşme/);

  const r4 = S.diagnoseOrthography('zerafet', null);
  assert.equal(r4.found, true);
  assert.equal(r4.suggested, 'ZARAFET');
});

test('Akıllı Yazım Koçu: sözlük desteğiyle göçüşme ve ses karışıklığını algoritmik tespit eder', () => {
  const dict5 = new Set(['kalem', 'şehir', 'kitap']);
  const swap = S.diagnoseOrthography('kalme', dict5);
  assert.equal(swap.found, true);
  assert.equal(swap.suggested, 'KALEM');
  assert.match(swap.category, /Göçüşme/);

  const vowel = S.diagnoseOrthography('şehır', dict5);
  assert.equal(vowel.found, true);
  assert.equal(vowel.suggested, 'ŞEHİR');
  assert.match(vowel.category, /Ünlü/);

  const unknown = S.diagnoseOrthography('zzzzz', dict5);
  assert.equal(unknown.found, false);
});
