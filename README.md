# Söz İzi – Bağlam İpuçlu ve Yazım Geri Bildirimli Türkçe Söz Varlığı Uygulaması

**Söz İzi**, lise düzeyinde Türk Dili ve Edebiyatı öğretiminde söz varlığını zenginleştirmek, yabancı kökenli sözcüklere Türkçe karşılık kullanma bilincini geliştirmek, deyim ve atasözlerini bağlam içinde kavratmak ve sık yapılan yazım yanlışlarına anlık dilbilimsel geri bildirim sunmak amacıyla geliştirilmiş açık kaynaklı, bağımlılıksız bir web uygulamasıdır.

## Temel Özellikler

1. **Üç Katmanlı Dilbilimsel Mimari:**
   - **Türkçenin Karşılıkları Modülü:** Günlük ve dijital dildeki yabancı kökenli sözcüklerin (*selfie, mesaj, konsept, lokasyon, koordinasyon* vb.) TDK Türkçe karşılıklarını (*özçekim, ileti, kavram, konum, eşgüdüm*) bağlam ipucuyla buldurur.
   - **Deyim ve Atasözleri Modülü:** Boş bırakılan deyim veya atasözü bağlamından (*"Ağzında ___ ıslanmamak"*, *"İğne ile ___ kazmak"*) anahtar sözcüğü tahmin ettirir.
   - **Kültürel ve Edebi Miras Modülü:** Anadolu ağızları, klasik ve halk edebiyatı söz varlığından seçkin sözcükleri (*imece, yazıt, kopuz, yalaza, bozlak, bağlama, mesnevi* vb.) bağlam içinde öğretir.
2. **Akıllı Yazım Koçu (Anlık Düzeltici Geri Bildirim):**
   - TDK ve Zemberek tabanlı **105.675 sözcüklük** çekimli Türkçe sözlük ile çalışır.
   - Öğrencilerin sık yaptığı yazım yanlışlarını (*yanlız → yalnız, herşey → her şey, kiprik → kirpik, şöför → şoför, zerafet → zarafet* vb.) ve harf göçüşmesi / ses karışıklığı hatalarını yakalar; tahmin hakkını yakmadan ilgili yazım kuralını ekranda açıklar.
3. **Çözüm Sonrası Sözlük ve Köken Kartı:**
   - Sözcük bulunduğunda (veya hak bittiğinde) TDK anlamı, köken/yapım eki analizi ve edebi/günlük örnek cümlesi gösterilir.
4. **Dört Uygulama Kipi ve Araştırma Veri Kaydı:**
   - **Bireysel Çalışma**, **İki Takım**, **Günün Sözcüğü** ve akıllı tahtaya uyumlu **Sınıf Turnuvası** (2–12 takım, lig + yarı final + final).
   - Üst menüdeki **📊 Araştırma** paneli üzerinden kişisel veri içermeyen anonim oturum, başarı, süre ve yazım yanlışı verileri doğrudan `CSV` veya `JSON` biçiminde indirilebilir.

## Çalıştırma ve Test

Uygulama derleme adımı gerektirmez; statik olarak (GitHub Pages veya yerel HTTP sunucusu) ya da isteğe bağlı `server.js` ile çalıştırılabilir:

```bash
# Birim testlerini çalıştırma
npm test

# Yerel sunucu başlatma (http://localhost:8080)
npm start
```
