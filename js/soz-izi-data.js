/* Söz İzi – Dilbilimsel Veri Katmanı ve Akıllı Yazım Koçu
 * TÜBİTAK 2204-A Türk Dili ve Edebiyatı araştırma projesi kapsamında geliştirilmiştir.
 * Üç tematik söz varlığı modülü (Türkçe Karşılıklar, Deyim ve Atasözleri, Kültürel Miras)
 * ve kural + sözlük tabanlı Yazım Yanlışı Tanı Motoru içerir.
 */
(function (root) {
  'use strict';

  var TR_LOCALE = 'tr-TR';
  function toLowerTr(s) { return String(s || '').toLocaleLowerCase(TR_LOCALE); }
  function toUpperTr(s) { return String(s || '').toLocaleUpperCase(TR_LOCALE); }
  function chars(s) { return Array.from(String(s || '')); }

  /** Modül tanımları */
  var MODULES = {
    all: {
      id: 'all',
      name: 'Karma Sözİzi (3 Modül)',
      shortName: 'Karma Modül',
      badge: 'Tüm Temalar',
      desc: 'Öz Türkçe karşılıklar, deyim/atasözü bağlamı ve kültürel miras sözcükleri bir arada.'
    },
    karsilik: {
      id: 'karsilik',
      name: 'Türkçenin Karşılıkları',
      shortName: 'Öz Türkçe',
      badge: 'Yabancı Sözcüğe Karşılık',
      desc: 'Günlük ve dijital dildeki yabancı kökenli sözcüklerin TDK Türkçe karşılıkları.'
    },
    deyim: {
      id: 'deyim',
      name: 'Deyim ve Atasözleri',
      shortName: 'Deyim & Atasözü',
      badge: 'Atasözü / Deyim Bağlamı',
      desc: 'Boş bırakılan atasözü veya deyim bağlamından anahtar sözcüğü bulma.'
    },
    miras: {
      id: 'miras',
      name: 'Kültürel ve Edebi Miras',
      shortName: 'Kültürel Miras',
      badge: 'Kültürel & Edebi Söz Varlığı',
      desc: 'Anadolu ağızları, klasik/halk edebiyatı ve köklü Türkçe söz varlığı.'
    },
    genel: {
      id: 'genel',
      name: 'Genel Söz Varlığı',
      shortName: 'Genel Havuz',
      badge: 'Genel Türkçe (6.915 Sözcük)',
      desc: 'İpucu sınırlaması olmadan geniş Türkçe kelime havuzuyla klasik mod.'
    }
  };

  /**
   * Zenginleştirilmiş söz varlığı maddeleri.
   * Her madde: { word, module: 'karsilik'|'deyim'|'miras', clue, meaning, origin, example, foreign? }
   */
  var ENTRIES = [
    /* ==================== MODÜL 1: TÜRKÇENİN KARŞILIKLARI (4–7 HARF) ==================== */
    // 4 Harf
    {
      word: 'akım', module: 'karsilik', foreign: 'trend / cereyan',
      clue: 'Batı kökenli "trend" sözcüğü yerine sanat, düşünce ve modada kullanılan Türkçe karşılık.',
      meaning: 'Sanat, siyaset veya düşünce alanında ortaya çıkan yeni yönelim, hareket.',
      origin: 'Türkçe "ak-" fiil kökünden "+Im" yapım ekiyle türetilmiştir.',
      example: 'Toplumcu gerçekçi akım, dönem romanlarında güçlü biçimde hissedilir.'
    },
    {
      word: 'veri', module: 'karsilik', foreign: 'data',
      clue: 'Bilişim ve araştırmada "data" yerine kullanılan Türkçe sözcük.',
      meaning: 'Bir araştırmanın, tartışmanın veya bilgisayarda işlemin temeli olan bilgi ögesi.',
      origin: 'Türkçe "ver-" fiil kökünden "+I" ekiyle türetilmiş terimdir.',
      example: 'Araştırmada toplanan her veri istatistiksel olarak çözümlendi.'
    },
    {
      word: 'imge', module: 'karsilik', foreign: 'imaj',
      clue: 'Edebiyat ve sanatta Fransızca "imaj" yerine önerilen Türkçe karşılık.',
      meaning: 'Zihinde tasarlanan ve gerçekleşmesi özlenen şey, hayal, sembolik tasarım.',
      origin: 'Eski Türkçe "im" (işaret, parola) kökünden "+gA" ekiyle türetilmiştir.',
      example: 'Şair, yalnızlığı anlatmak için sonbahar yaprağı imgesini kullanmış.'
    },
    {
      word: 'dizi', module: 'karsilik', foreign: 'seri',
      clue: '"Seri" sözcüğü yerine televizyon, yayın ve matematikte kullanılan Türkçe karşılık.',
      meaning: 'Birbirini izleyen, bir bütün oluşturan bölümler veya ögeler bütünü.',
      origin: 'Türkçe "diz-" fiil kökünden "+I" yapım ekiyle türetilmiştir.',
      example: 'Yayınevi, Türk klasikleri dizisine üç yeni eser daha ekledi.'
    },
    {
      word: 'ilke', module: 'karsilik', foreign: 'prensip',
      clue: 'Fransızca "prensip" sözcüğünün Türkçe karşılığı olan temel kural.',
      meaning: 'Her türlü tartışmanın dışında sayılan temel düşünce, prensip, umde.',
      origin: 'Türkçe "ilk" sözcüğünden türetilmiş felsefe ve eğitim terimidir.',
      example: 'Bilimsel araştırmalarda tarafsızlık vazgeçilmez bir ilkedir.'
    },
    {
      word: 'oran', module: 'karsilik', foreign: 'rasyo',
      clue: 'Ekonomi ve matematikte "rasyo" yerine kullanılan Türkçe sözcük.',
      meaning: 'İki büyüklük arasındaki nicelik bağıntısı, nispet.',
      origin: 'Türkçe "ora-" (ölçmek, biçmek) kökünden türetilmiştir.',
      example: 'Okuma alışkanlığı oranı son uygulamayla birlikte belirgin biçimde arttı.'
    },
    {
      word: 'uyum', module: 'karsilik', foreign: 'adaptasyon / armoni',
      clue: '"Adaptasyon" ve "armoni" sözcüklerinin Türkçe karşılığı.',
      meaning: 'Bir bütünün parçaları arasında bulunan uygunluk veya çevreye alışma durumu.',
      origin: 'Türkçe "uy-" fiil kökünden "+Um" yapım ekiyle türetilmiştir.',
      example: 'Yeni okula uyum sürecini arkadaşlarının desteğiyle hızla tamamladı.'
    },
    {
      word: 'özet', module: 'karsilik', foreign: 'brifing / rezüme',
      clue: 'Uzun bir metnin veya "brifing"in ana noktalarını içeren kısa anlatım.',
      meaning: 'Bir yazı veya sözün anlamını daha az sözle ifade eden biçimi, hülasa.',
      origin: 'Türkçe "öz" kökünden türetilmiş sözcüktür.',
      example: 'Proje raporunun ilk sayfasında iki yüz kelimelik bir özet yer alır.'
    },
    {
      word: 'akış', module: 'karsilik', foreign: 'feed / timeline',
      clue: 'Sosyal medyada "feed / timeline" yerine TDK tarafından önerilen Türkçe sözcük.',
      meaning: 'İçeriklerin veya olayların art arda sıralanarak ilerlemesi.',
      origin: 'Türkçe "ak-" fiil kökünden "+Iş" isim-fiil ekiyle türetilmiştir.',
      example: 'Uygulamanın ana sayfa akışında yalnızca doğrulanmış haberler yer alıyor.'
    },
    {
      word: 'ürün', module: 'karsilik', foreign: 'prodükt / mahsul',
      clue: 'Ekonomi ve sanatta "prodükt" yerine kullanılan öz Türkçe sözcük.',
      meaning: 'Doğadan elde edilen veya emekle ortaya konulan yararlı şey, eser.',
      origin: 'Halk ağzındaki "ürün" (süt ve tahıl verimi) sözcüğünden yazı diline kazandırılmıştır.',
      example: 'Bu sözlük, yıllar süren titiz bir dil incelemesinin ürünüdür.'
    },

    // 5 Harf
    {
      word: 'ileti', module: 'karsilik', foreign: 'mesaj',
      clue: 'Günlük dilde ve bilişimde "mesaj" yerine kullanılan Türkçe karşılık.',
      meaning: 'Yazı, söz veya görsel aracılığıyla gönderilen bilgi, haber.',
      origin: 'Türkçe "ilet-" fiil kökünden "+I" yapım ekiyle türetilmiştir.',
      example: 'Öğretmenimiz toplantı saatini elektronik iletiyle tüm sınıfa bildirdi.'
    },
    {
      word: 'kurgu', module: 'karsilik', foreign: 'fiksiyon / montaj',
      clue: 'Sinema ve edebiyatta "fiksiyon" veya "montaj" yerine kullanılan Türkçe sözcük.',
      meaning: 'Sanat eserinde olayların ve parçaların yaratıcı biçimde düzenlenmesi.',
      origin: 'Türkçe "kur-" fiil kökünden "+gU" yapım ekiyle türetilmiştir.',
      example: 'Romanın sağlam kurgusu okuyucuyu son sayfaya dek merak içinde tutuyor.'
    },
    {
      word: 'sunum', module: 'karsilik', foreign: 'prezantasyon',
      clue: 'Toplantı ve derslerde "prezantasyon" yerine kullanılan Türkçe sözcük.',
      meaning: 'Bir konuyu görsel ve sözlü araçlarla dinleyicilere aktarma işi.',
      origin: 'Türkçe "sun-" fiil kökünden "+Um" yapım ekiyle türetilmiştir.',
      example: 'Jüri karşısında yaptıkları on dakikalık sunum büyük beğeni topladı.'
    },
    {
      word: 'süreç', module: 'karsilik', foreign: 'proses',
      clue: '"Proses" sözcüğü yerine kullanılan, olayların zaman içindeki akışını anlatan Türkçe sözcük.',
      meaning: 'Aralarında birlik olan olayların veya durumların belirli bir zaman içindeki dizisi.',
      origin: 'Türkçe "sür-" fiil kökünden "+Aç/+Eç" ekiyle türetilmiştir.',
      example: 'Dil edinimi, çocukluktan yetişkinliğe uzanan doğal bir süreçtir.'
    },
    {
      word: 'düzey', module: 'karsilik', foreign: 'level / seviye',
      clue: 'Oyunlarda ve eğitimde İngilizce "level" yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir şeyin ulaşmış bulunduğu aşama, derece, seviye.',
      origin: 'Türkçe "düz" kökünden türetilmiş ölçüt terimidir.',
      example: 'Öğrencilerin söz varlığı düzeyi ön test ile belirlendi.'
    },
    {
      word: 'işlev', module: 'karsilik', foreign: 'fonksiyon',
      clue: 'Dilbilim, matematik ve günlük dilde "fonksiyon" yerine kullanılan Türkçe sözcük.',
      meaning: 'Bir nesne veya kimsenin gördüğü iş, görev, fonksiyon.',
      origin: 'Türkçe "işle-" gövdesinden "+v" ekiyle türetilmiştir.',
      example: 'Yapım eklerinin temel işlevi, köklerden yeni anlamlı sözcükler türetmektir.'
    },
    {
      word: 'konum', module: 'karsilik', foreign: 'lokasyon',
      clue: 'Harita uygulamalarında ve günlük konuşmada "lokasyon" yerine kullanılması gereken Türkçe sözcük.',
      meaning: 'Bir şeyin veya bir kimsenin yeryüzünde ya da bir düzen içinde bulunduğu yer.',
      origin: 'Türkçe "kon-" fiil kökünden "+Um" ekiyle türetilmiştir.',
      example: 'Buluşma noktasının konumunu harita üzerinden paylaştı.'
    },
    {
      word: 'özgün', module: 'karsilik', foreign: 'orijinal',
      clue: 'Fransızca "orijinal" sözcüğünün Türkçe karşılığı; taklit olmayan.',
      meaning: 'Yalnız kendine özgü bir nitelik taşıyan, yeni ve yaratıcı olan.',
      origin: 'Türkçe "öz" kökünden türetilmiştir.',
      example: 'Araştırma projelerinde en önemli değerlendirme ölçütü özgün yaklaşımdır.'
    },
    {
      word: 'sürüm', module: 'karsilik', foreign: 'versiyon',
      clue: 'Yazılım ve yayıncılıkta "versiyon" yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir yazılımın veya eserin yenilenerek yayımlanan her bir biçimi.',
      origin: 'Türkçe "sür-" fiil kökünden "+Um" ekiyle türetilmiştir.',
      example: 'Uygulamanın yeni sürümü yazım denetimi özelliğiyle yayınlandı.'
    },
    {
      word: 'etkin', module: 'karsilik', foreign: 'aktif',
      clue: '"Aktif" sözcüğünün Türkçe karşılığı; harekette bulunan, katılımcı.',
      meaning: 'Çalışkan, işleyen, etki yapan, pasif karşıtı.',
      origin: 'Türkçe "et-" fiilinden "etki" ve "+n" ekiyle türetilmiştir.',
      example: 'Oyunlaştırma yöntemi öğrencilerin derse etkin katılımını sağladı.'
    },
    {
      word: 'kuram', module: 'karsilik', foreign: 'teori',
      clue: 'Bilim ve felsefede "teori" sözcüğü yerine kullanılan Türkçe karşılık.',
      meaning: 'Sistemli bir biçimde düzenlenmiş birçok olayı açıklayan ve bir bilime temel olan kurallar bütünü.',
      origin: 'Türkçe "kur-" fiil kökünden "+Am" ekiyle türetilmiştir.',
      example: 'Bilimsel gözlemler zamanla kapsamlı bir kurama dönüştü.'
    },
    {
      word: 'dizge', module: 'karsilik', foreign: 'sistem',
      clue: 'Dilbilim ve felsefede "sistem" yerine önerilen öz Türkçe terim.',
      meaning: 'Birbiriyle düzenli ilişki içinde bulunan ögelerin oluşturduğu bütün.',
      origin: 'Türkçe "diz-" fiil kökünden "+gE" yapım ekiyle türetilmiştir.',
      example: 'Dil, kendi kuralları içinde işleyen canlı bir göstergeler dizgesidir.'
    },

    // 6 Harf
    {
      word: 'güncel', module: 'karsilik', foreign: 'aktüel',
      clue: 'Basın ve yayın dilinde "aktüel" yerine kullanılan Türkçe sözcük.',
      meaning: 'Günün konusu olan, şimdiki zamanla ilgili, taze.',
      origin: 'Türkçe "gün" adından "+cAl" ekiyle türetilmiştir.',
      example: 'Sözlük veritabanı güncel yazım kılavuzu esas alınarak yenilendi.'
    },
    {
      word: 'içerik', module: 'karsilik', foreign: 'kontent / muhteva',
      clue: 'Dijital medyada İngilizce "content" yerine kullanılan Türkçe sözcük.',
      meaning: 'Bir sözün, yazının veya ortamın barındırdığı bilgi ve düşüncelerin bütünü.',
      origin: 'Türkçe "içer-" gövdesinden "+Ik" yapım ekiyle türetilmiştir.',
      example: 'Eğitsel içerik üretimi ana dil bilincini doğrudan destekler.'
    },
    {
      word: 'kavram', module: 'karsilik', foreign: 'konsept',
      clue: 'Tasarım ve düşüncede "konsept" yerine kullanılması önerilen Türkçe sözcük.',
      meaning: 'Bir nesnenin veya düşüncenin zihindeki soyut ve genel tasarımı.',
      origin: 'Türkçe "kavra-" fiilinden "+m" yapım ekiyle türetilmiştir.',
      example: 'Her bilim dalı kendi temel kavramları üzerine inşa edilir.'
    },
    {
      word: 'yöntem', module: 'karsilik', foreign: 'metot',
      clue: 'Bilimsel araştırmalarda "metot" sözcüğü yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir amaca erişmek için izlenen düzenli yol, usul.',
      origin: 'Anadolu ağızlarındaki "yöntem" (düzgün yol, usul) sözcüğünden terimleştirilmiştir.',
      example: 'Araştırmanın yöntem bölümünde deneysel desen ayrıntılarıyla açıklandı.'
    },
    {
      word: 'bellek', module: 'karsilik', foreign: 'memori / hafıza',
      clue: 'Bilişimde "memory" yerine kullanılan Türkçe karşılık; zihinde saklama gücü.',
      meaning: 'Yaşananları, öğrenilen konuları ve bunların geçmişle ilişkisini saklama gücü.',
      origin: 'Türkçe "belle-" (öğrenip akılda tutmak) fiilinden "+k" ekiyle türetilmiştir.',
      example: 'Deyimler, bir ulusun ortak kültürel belleğini kuşaktan kuşağa taşır.'
    },
    {
      word: 'duyuru', module: 'karsilik', foreign: 'anons',
      clue: 'Fransızca "anons" sözcüğü yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir haberi veya kararı herkese bildirme işi, ilan.',
      origin: 'Türkçe "duyur-" gövdesinden "+U" ekiyle türetilmiştir.',
      example: 'Turnuva takvimi okul panosunda yapılan duyuruyla paylaşıldı.'
    },
    {
      word: 'oturum', module: 'karsilik', foreign: 'seans / sesyon',
      clue: 'Sempozyum, sinema ve bilişimde "seans / session" yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir kurulun veya toplantının ara vermeden yaptığı çalışma bölümü.',
      origin: 'Türkçe "otur-" fiilinden "+Um" yapım ekiyle türetilmiştir.',
      example: 'Sempozyumun öğleden sonraki oturumu Türkçe öğretimine ayrıldı.'
    },
    {
      word: 'öngörü', module: 'karsilik', foreign: 'vizyon / projeksiyon',
      clue: 'Geleceğe yönelik "projeksiyon / vizyon" yerine kullanılan Türkçe sözcük.',
      meaning: 'Bir işin ilerisini kestirme veya bir işin nasıl bir yol alacağını önceden anlayabilme.',
      origin: 'Türkçe "ön" ve "görü" sözcüklerinin birleşmesiyle oluşturulmuştur.',
      example: 'Yazarın yüzyıl öncesinden yaptığı öngörü bugün gerçeğe dönüştü.'
    },
    {
      word: 'uzlaşı', module: 'karsilik', foreign: 'konsensüs',
      clue: 'Tartışma ve toplantılarda "konsensüs" yerine kullanılan Türkçe karşılık.',
      meaning: 'Farklı görüşler arasında varılan karşılıklı anlaşma, mutabakat.',
      origin: 'Türkçe "uzlaş-" fiilinden "+I" yapım ekiyle türetilmiştir.',
      example: 'Kurul üyeleri ortak bir terim listesi üzerinde tam uzlaşı sağladı.'
    },
    {
      word: 'saydam', module: 'karsilik', foreign: 'transparan / şeffaf',
      clue: '"Transparan" sözcüğü yerine hem fizikte hem mecaz anlamda kullanılan Türkçe karşılık.',
      meaning: 'İçinden ışığın geçmesine engel olmayan, arkasını gösteren; açık, hesap verebilir.',
      origin: 'Türkçe "say-" / "aydın" köküyle ilişkili türetilmiş sıfattır.',
      example: 'Değerlendirme ölçütlerinin saydam biçimde paylaşılması güveni artırdı.'
    },
    {
      word: 'sunucu', module: 'karsilik', foreign: 'server',
      clue: 'Bilişim ağlarında İngilizce "server" yerine kullanılan Türkçe terim.',
      meaning: 'Bir ağ üzerinde veri ve hizmet paylaşımını sağlayan ana bilgisayar; programı yöneten kişi.',
      origin: 'Türkçe "sun-" fiilinden "+UcU" ekiyle türetilmiştir.',
      example: 'Sözlük dosyaları yerel sunucu üzerinden milisaniyeler içinde yüklendi.'
    },
    {
      word: 'taslak', module: 'karsilik', foreign: 'draft / eskiz',
      clue: 'Yazı ve tasarımda İngilizce "draft" veya "eskiz" yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir yazının, yapıtın veya projenin ana çizgileriyle hazırlanmış ilk biçimi.',
      origin: 'Türkçe "tasla-" fiilinden "+k" ekiyle türetilmiştir.',
      example: 'Raporun ilk taslağı danışman öğretmenin görüşleriyle yeniden düzenlendi.'
    },

    // 7 Harf
    {
      word: 'özçekim', module: 'karsilik', foreign: 'selfie',
      clue: 'Akıllı telefonla kişinin kendi fotoğrafını çekmesi; "selfie"nin TDK Türkçe karşılığı.',
      meaning: 'Kişinin kendi fotoğrafını kendisinin çekmesi ve bu yolla elde edilen fotoğraf.',
      origin: 'Türk Dil Kurumu tarafından 2014 yılında "öz" + "çekim" birleşimiyle önerilmiştir.',
      example: 'Müze gezisi sonunda öğrenciler hatıra olarak bir özçekim yaptı.'
    },
    {
      word: 'yazılım', module: 'karsilik', foreign: 'software',
      clue: 'Bilgisayar teknolojisinde İngilizce "software" yerine kullanılan yerleşik Türkçe terim.',
      meaning: 'Bir bilgisayarda donanıma hayat veren programların, komutların ve belgelerin bütünü.',
      origin: 'Bilişim öncüsü Aydın Köksal tarafından "yaz-" kökünden türetilmiştir.',
      example: 'Geliştirdiğimiz açık kaynaklı yazılım tüm tarayıcılarda kurulumsuz çalışıyor.'
    },
    {
      word: 'donanım', module: 'karsilik', foreign: 'hardware',
      clue: 'Bilgisayar teknolojisinde İngilizce "hardware" yerine kullanılan Türkçe terim.',
      meaning: 'Bilgisayarı oluşturan ekran, klavye, işlemci gibi fiziksel parçaların tamamı.',
      origin: 'Türkçe "donan-" gövdesinden "+Im" ekiyle bilişim terimi olarak türetilmiştir.',
      example: 'Uygulama ek bir donanım gerektirmeden sınıf tahtasında çalıştırılabilir.'
    },
    {
      word: 'bilişim', module: 'karsilik', foreign: 'enformatik',
      clue: 'Fransızca "enformatik" yerine Türkçeye kazandırılan ana bilim ve teknoloji terimi.',
      meaning: 'Bilginin elektronik araçlarla düzenli ve ussal biçimde işlenmesi bilimi.',
      origin: 'Aydın Köksal tarafından 1960\'larda "bil-" kökünden türetilmiştir.',
      example: 'Türkçe bilişim terimleri, ana dilin bilim dili olma gücünü kanıtlamaktadır.'
    },
    {
      word: 'seçenek', module: 'karsilik', foreign: 'alternatif / opsiyon',
      clue: '"Alternatif" veya "opsiyon" sözcükleri yerine kullanılan Türkçe karşılık.',
      meaning: 'Birinin yerine seçilebilecek bir başka yol, olanak, şık.',
      origin: 'Türkçe "seç-" fiilinden "+AnAk" yapım ekiyle türetilmiştir.',
      example: 'Soru kökünün altında öğrencilere dört farklı seçenek sunuldu.'
    },
    {
      word: 'eşgüdüm', module: 'karsilik', foreign: 'koordinasyon',
      clue: 'Yönetim ve ekip çalışmalarında "koordinasyon" yerine kullanılan Türkçe sözcük.',
      meaning: 'Belli bir amaca ulaşmak için farklı birimlerin uyum içinde birlikte çalışması.',
      origin: 'Türkçe "eş" ve "güdüm" sözcüklerinin birleşmesiyle türetilmiştir.',
      example: 'Proje ekibindeki görev dağılımı tam bir eşgüdüm içinde yürütüldü.'
    },
    {
      word: 'tasarım', module: 'karsilik', foreign: 'dizayn',
      clue: 'Sanat, mühendislik ve mimaride İngilizce "dizayn (design)" yerine kullanılan Türkçe sözcük.',
      meaning: 'Zihinde canlandırılan biçim; bir ürünün ilk taslağı ve kurgulanma süreci.',
      origin: 'Türkçe "tasarla-" köküyle ilişkili "+Im" ekiyle türetilmiştir.',
      example: 'Arayüz tasarımı öğrencilerin dikkatini dağıtmayacak sadelikte kurgulandı.'
    },
    {
      word: 'deneyim', module: 'karsilik', foreign: 'eksperyans',
      clue: 'İş ilanlarında ve günlük dilde yabancı biçimleri yerine kullanılan "tecrübe" eş anlamlısı öz Türkçe sözcük.',
      meaning: 'Bir kimsenin belli bir sürede veya hayat boyu edindiği bilgilerin ve görgülerin tamamı.',
      origin: 'Türkçe "dene-" fiilinden "+yIm" yapım ekiyle türetilmiştir.',
      example: 'Sınıf içi turnuva uygulaması öğrencilere unutulmaz bir öğrenme deneyimi sundu.'
    },
    {
      word: 'söyleşi', module: 'karsilik', foreign: 'intervyu / talk show',
      clue: 'Basın ve televizyonda "talk show / interview" yerine kullanılan Türkçe sözcük.',
      meaning: 'Belli bir konu üzerinde karşılıklı ve samimi biçimde yapılan konuşma, sohbet.',
      origin: 'Türkçe "söyleş-" işteş fiilinden "+I" ekiyle türetilmiştir.',
      example: 'Okulumuzun edebiyat günlerinde konuk yazarla keyifli bir söyleşi gerçekleştirildi.'
    },
    {
      word: 'nitelik', module: 'karsilik', foreign: 'kalite / vasıf',
      clue: 'Üretim ve değerlendirmede Fransızca "kalite" yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir şeyin nasıl olduğunu belirten, onu başka şeylerden ayıran özellik.',
      origin: 'Türkçe "nite" (nasıl) soru sözcüğünden "+lIk" ekiyle türetilmiştir.',
      example: 'Araştırmada sözcük sayısından çok kullanılan bağlamın niteliği önemsendi.'
    },
    {
      word: 'tanıtım', module: 'karsilik', foreign: 'promosyon / lansman',
      clue: '"Promosyon" veya "lansman" sözcükleri yerine kullanılan Türkçe karşılık.',
      meaning: 'Bir ürünü, eseri veya çalışmayı geniş kitlelere bildirme ve benimsetme işi.',
      origin: 'Türkçe "tanıt-" gövdesinden "+Im" ekiyle türetilmiştir.',
      example: 'Yeni sözlük çalışmasının tanıtımı kültür merkezinde yapıldı.'
    },
    {
      word: 'denetim', module: 'karsilik', foreign: 'kontrol / audit',
      clue: '"Kontrol" veya "audit" yerine kullanılan; bir işin kurallara uygunluğunu inceleme.',
      meaning: 'Bir işin doğru ve yöntemine uygun yürütülüp yürütülmediğini inceleme işi, murakabe.',
      origin: 'Türkçe "denet-" gövdesinden "+Im" ekiyle türetilmiştir.',
      example: 'Yazım denetimi modülü öğrencilerin hatalarını anında fark etmesini sağladı.'
    },

    /* ==================== MODÜL 2: DEYİM VE ATASÖZLERİ (4–7 HARF) ==================== */
    // 4 Harf
    {
      word: 'pire', module: 'deyim',
      clue: '"___ için yorgan yakmak" (Önemsiz bir sorun yüzünden büyük zarara yol açacak tepki göstermek).',
      meaning: 'Küçük, sıçrayıcı asalak böcek; deyimde "çok küçük ve önemsiz neden" anlamında kullanılır.',
      origin: 'Eski Türkçe "bürge" sözcüğünden ses değişimiyle günümüz Türkçesine ulaşmıştır.',
      example: 'Küçücük bir anlaşmazlıkta pire için yorgan yakmaya hiç gerek yok.'
    },
    {
      word: 'kuyu', module: 'deyim',
      clue: '"İğne ile ___ kazmak" (Çok yetersiz araçlarla sabırla çok güç bir işi başarmaya çalışmak).',
      meaning: 'Su katmanına varıncaya değin derinlemesine kazılan çukur.',
      origin: 'Eski Türkçe "kudug" sözcüğünden gelişmiştir.',
      example: 'Tarihsel sözlük hazırlamak adeta iğne ile kuyu kazmak kadar sabır ister.'
    },
    {
      word: 'dere', module: 'deyim',
      clue: '"___yi görmeden paçaları sıvamak" (Henüz ortada bir durum yokken erken hazırlığa girişmek).',
      meaning: 'Çaydan küçük, yazın kuruyabilen akarsu.',
      origin: 'Türkçede yaygın doğa adlarından olup pek çok atasözünde somutlaştırma ögesidir.',
      example: 'Sonuçlar açıklanmadan kutlama planı yapma; dereyi görmeden paçaları sıvama.'
    },
    {
      word: 'ateş', module: 'deyim',
      clue: '"___ olmayan yerden duman çıkmaz" (Bir söylenti veya belirtinin altında mutlaka bir gerçek payı vardır).',
      meaning: 'Yanıcı cisimlerin tutuşmasıyla beliren ısı ve ışık.',
      origin: 'Farsça "âteş" sözcüğünden Türkçeye yerleşmiş, yüzlerce deyim üretmiştir.',
      example: 'Bütün kasaba bunu konuşuyorsa bir nedeni vardır; ateş olmayan yerden duman çıkmaz.'
    },
    {
      word: 'ayna', module: 'deyim',
      clue: '"İnsanın ___sı iştir, lafa bakılmaz" (Kişinin değeri sözleriyle değil ortaya koyduğu işle ölçülür).',
      meaning: 'Işığı yansıtan sırlı cam; mecaz olarak bir gerçeği olduğu gibi gösteren şey.',
      origin: 'Farsça "âyîne" sözcüğünden ses uyumuyla Türkçeleşmiştir.',
      example: 'Edebi eserler yazıldığı dönemin toplumsal aynası niteliğindedir.'
    },
    {
      word: 'gemi', module: 'deyim',
      clue: '"___leri yakmak" (Geri dönüş olanağını bilerek ortadan kaldıracak kesin bir adım atmak).',
      meaning: 'Su üstünde yüzen, insan ve yük taşımaya yarayan büyük taşıt.',
      origin: 'Eski Türkçe "kemi" sözcüğünden günümüze kesintisiz ulaşmıştır.',
      example: 'Yeni bir alanda araştırma yapmak için tüm gemileri yakıp çalışmaya koyuldu.'
    },
    {
      word: 'öfke', module: 'deyim',
      clue: '"___ ile kalkan zararla oturur" (Sinirlerine yenilerek davranan kişi sonunda kendi zarar görür).',
      meaning: 'Engellenme, incinme veya haksızlık karşısında gösterilen sert duygusal tepki, kızgınlık.',
      origin: 'Eski Türkçe "öpke" (akciğer, soluk, kızgınlık) sözcüğünden gelişmiştir.',
      example: 'Tartışmada sesini yükseltmeden önce öfke ile kalkanın zararla oturacağını hatırladı.'
    },
    {
      word: 'uyku', module: 'deyim',
      clue: '"Tavşan ___su uyumak" (En küçük seste uyanacak kadar hafif ve tetikte uyumak).',
      meaning: 'Dış uyaranlara karşı bilincin geçici olarak dinlenmeye çekildiği doğal durum.',
      origin: 'Eski Türkçe "udı-" (uyumak) fiilinden "udıku > uyku" gelişimiyle oluşmuştur.',
      example: 'Yolculuk heyecanından bütün gece tavşan uykusu uyudu.'
    },
    {
      word: 'iğne', module: 'deyim',
      clue: '"___ atsan yere düşmez" (Bir yerin adım atılamayacak ölçüde kalabalık olduğunu anlatan deyim).',
      meaning: 'Dikiş dikmeye veya tutturmaya yarayan ince, ucu sivri metal araç.',
      origin: 'Eski Türkçe "yigne" sözcüğünden başındaki y- sesinin düşmesiyle oluşmuştur.',
      example: 'Bilim şenliğinin açılış gününde salonda iğne atsan yere düşmezdi.'
    },
    {
      word: 'ümit', module: 'deyim',
      clue: '"Çıkmadık candan ___ kesilmez" (En umutsuz görünen durumda bile iyi bir sonuç olasılığı vardır).',
      meaning: 'Umulan ve beklenen olumlu şey, umut.',
      origin: 'Farsça "ümîd" sözcüğünden Türkçeye geçmiştir; öz Türkçe karşılığı "umut"tur.',
      example: 'Son tahmine kadar vazgeçmediler; ne de olsa çıkmadık candan ümit kesilmez.'
    },

    // 5 Harf
    {
      word: 'bakla', module: 'deyim',
      clue: '"Ağzında ___ ıslanmamak" (Hiç sır saklayamamak, duyduğunu hemen herkese söylemek).',
      meaning: 'Taneleri yassı ve iri bir sebze; deyimde ağızda tutulup yumuşaması beklenen taneyi simgeler.',
      origin: 'Arapça "bâkillâ" sözcüğünden Türkçeye geçmiş ve halk deyimlerinde yer etmiştir.',
      example: 'Ona gizli planımızı anlatma, bilirsin ağzında bakla ıslanmaz.'
    },
    {
      word: 'damla', module: 'deyim',
      clue: '"Bardağı taşıran son ___" (Sabrı tüketen en son küçük olay).',
      meaning: 'Yuvarlak biçimde, çok küçük miktarda sıvı tanesi.',
      origin: 'Türkçe "dam-" kökünden "damla-" fiili ve isim biçimiyle gelişmiştir.',
      example: 'Toplantıya üçüncü kez geç kalması bardağı taşıran son damla oldu.'
    },
    {
      word: 'demir', module: 'deyim',
      clue: '"___ tavında dövülür" (Her iş ancak en uygun zaman ve koşul yakalandığında başarıyla yapılır).',
      meaning: 'Atom numarası 26 olan, işlenmeye elverişli dayanıklı metal.',
      origin: 'Eski Türkçe "temür" sözcüğünden t- > d- ötümlüleşmesiyle günümüze gelmiştir.',
      example: 'Öğrencilerin merakı canlıyken uygulamayı başlattık; demir tavında dövülür.'
    },
    {
      word: 'çorap', module: 'deyim',
      clue: '"Başına ___ örmek" (Bir kimseye haberi olmadan kötü bir tuzak veya güç durum hazırlamak).',
      meaning: 'Ayağa giyilen örme giysi; deyimde avcıların kuşların başına geçirdiği örme ağdan gelir.',
      origin: 'Farsça "gûrâb" sözcüğünden Türkçeye geçmiştir.',
      example: 'Dikkatsizce imzaladığı belge az kalsın başına çorap örüyordu.'
    },
    {
      word: 'kaşık', module: 'deyim',
      clue: '"Bir ___ suda fırtına koparmak" (Küçük bir sorunu gereksiz yere çok büyütmek).',
      meaning: 'Sıvı veya taneli yiyecekleri ağza götürmeye yarayan saplı sofra aracı.',
      origin: 'Eski Türkçe "kaşuk" sözcüğünden ses uyumuyla günümüze ulaşmıştır.',
      example: 'Ufak bir yazım hatası yüzünden bir kaşık suda fırtına koparmaya gerek yok.'
    },
    {
      word: 'pabuç', module: 'deyim',
      clue: '"___u dama atılmak" (Kendinden daha üstün biri gelince eski değerini ve ilgisini yitirmek).',
      meaning: 'Ayakkabı; deyim Ahilik geleneğinde kusurlu ayakkabının çatıya atılmasına dayanır.',
      origin: 'Farsça "pâ-pûş" (ayak örten) birleşiğinden Türkçeleşmiştir; kültürel tarihi olan bir deyimdir.',
      example: 'Yeni etkileşimli uygulama gelince eski çalışma kâğıtlarının pabucu dama atıldı.'
    },
    {
      word: 'saman', module: 'deyim',
      clue: '"___ altından su yürütmek" (Kimseye sezdirmeden gizlice iş çevirmek).',
      meaning: 'Biçilmiş tahıl saplarının harman sonunda ufalanmış biçimi.',
      origin: 'Eski Türkçeden beri tarım söz varlığında yer alan temel sözcüklerdendir.',
      example: 'Açıkça konuşmak varken saman altından su yürütmek güveni zedeler.'
    },
    {
      word: 'meyve', module: 'deyim',
      clue: '"___ veren ağaç taşlanır" (Üretken ve başarılı kişiler kıskanılır, eleştiriye uğrar).',
      meaning: 'Bitkilerde çiçeğin döllenmesinden sonra tohumları taşıyan yenilebilir organ, yemiş.',
      origin: 'Farsça "mîve" sözcüğünden Türkçeye geçmiştir (yaygın yazım yanlışı: meyva).',
      example: 'Yapıcı olmayan eleştirilere üzülme; unutma ki meyve veren ağaç taşlanır.'
    },
    {
      word: 'güneş', module: 'deyim',
      clue: '"___ balçıkla sıvanmaz" (Herkesin bildiği apaçık gerçekler örtbas edilemez).',
      meaning: 'Gezegen sistemimizin merkezinde yer alan ısı ve ışık kaynağı yıldız.',
      origin: 'Eski Türkçe "küneş" sözcüğünden k- > g- değişimiyle gelmiştir.',
      example: 'Belgeler her şeyi kanıtlıyor; güneş balçıkla sıvanmaz.'
    },
    {
      word: 'bıçak', module: 'deyim',
      clue: '"___ kemiğe dayanmak" (Katlanılacak gücün ve sabrın son sınırına gelmek).',
      meaning: 'Kesmeye yarayan saplı çelik araç.',
      origin: 'Eski Türkçe "bıç-" (kesmek, biçmek) fiilinden "+Ak" ekiyle türetilmiştir.',
      example: 'Sorunlar aylarca çözülüp bıçak kemiğe dayanınca yeni bir düzenleme yapıldı.'
    },
    {
      word: 'ceviz', module: 'deyim',
      clue: '"___ kabuğunu doldurmamak" (Üzerinde durmaya değmeyecek kadar önemsiz olmak).',
      meaning: 'Dışı sert kabuklu, içi besleyici yağlı ağaç yemişi, koz.',
      origin: 'Arapça "cevz" sözcüğünden ünlü türemesiyle Türkçeleşmiştir.',
      example: 'İki saattir ceviz kabuğunu doldurmayan ayrıntıları tartışıyoruz.'
    },
    {
      word: 'sinek', module: 'deyim',
      clue: '"___ küçüktür ama mide bulandırır" (Önemsiz görünen bir kusur bile rahatsızlık uyandırabilir).',
      meaning: 'Çift kanatlı küçük uçucu böcek.',
      origin: 'Eski Türkçe "siñek" sözcüğünden gelişmiştir.',
      example: 'Rapordaki küçük tutarsızlıkları da giderelim; sinek küçüktür ama mide bulandırır.'
    },

    // 6 Harf
    {
      word: 'yorgan', module: 'deyim',
      clue: '"Ayağını ___ına göre uzat" (Harcamalarını gelirine ve olanaklarına göre dengele).',
      meaning: 'Yatakta örtünmeye yarayan, içi pamuk, yün veya elyafla doldurulmuş geniş örtü.',
      origin: 'Eski Türkçe "yogurkân" (örtü, saracak şey) sözcüğünden ses düşmesiyle oluşmuştur.',
      example: 'Bütçe planlaması yaparken ayağını yorganına göre uzatmayı ilke edindi.'
    },
    {
      word: 'karpuz', module: 'deyim',
      clue: '"Bir koltuğa iki ___ sığmaz" (Aynı anda iki büyük ve zahmetli iş birden yürütülemez).',
      meaning: 'Kabuğu yeşil, içi kırmızı ve sulu yaz meyvesi.',
      origin: 'Farsça "harbûze" sözcüğünden Türkçeye geçip ses değişimine uğramıştır.',
      example: 'Önce elindeki araştırmayı bitir; bir koltuğa iki karpuz sığmaz.'
    },
    {
      word: 'kantar', module: 'deyim',
      clue: '"___ın topuzunu kaçırmak" (Sözde veya davranışta ölçüyü aşmak, aşırıya kaçmak).',
      meaning: 'Ağır yükleri tartmaya yarayan topuzlu tartı aracı.',
      origin: 'Arapça "kıntâr" sözcüğünden Türkçeye geçmiştir.',
      example: 'Şaka yapayım derken kantarın topuzunu kaçırıp arkadaşını kırdı.'
    },
    {
      word: 'gömlek', module: 'deyim',
      clue: '"Ateşten ___ giymek" (Çok güç, tehlikeli ve sorumluluğu ağır bir işi üstlenmek).',
      meaning: 'Vücudun üst kısmına giyilen yakalı ve kollu giysi.',
      origin: 'Eski Türkçe "köñlek" (gönüle/göğse yakın giysi) sözcüğünden gelişmiştir.',
      example: 'Halide Edib, Kurtuluş Savaşı yıllarını Ateşten Gömlek adıyla romanlaştırmıştır.'
    },
    {
      word: 'peynir', module: 'deyim',
      clue: '"Lafla ___ gemisi yürümez" (Yalnızca konuşmakla ve vaatle hiçbir iş başarılamaz, emek gerekir).',
      meaning: 'Sütün mayalanıp süzülmesiyle elde edilen besin.',
      origin: 'Farsça "penîr" sözcüğünden Türkçeye yerleşmiştir.',
      example: 'Planlarımızı hemen uygulamaya dökelim; lafla peynir gemisi yürümez.'
    },
    {
      word: 'mercek', module: 'deyim',
      clue: '"___ altına almak" (Bir konuyu en ince ayrıntısına kadar titizlikle incelemek).',
      meaning: 'Işığı kırarak cisimleri büyütmeye veya küçültmeye yarayan saydam cam parçası.',
      origin: 'Biçim benzerliği nedeniyle "mercimek" köküyle ilişkili olarak türetilmiştir.',
      example: 'Araştırmamızda lise öğrencilerinin sık yaptığı yazım hatalarını mercek altına aldık.'
    },
    {
      word: 'sünger', module: 'deyim',
      clue: '"Üzerine ___ çekmek" (Geçmişteki tatsız bir olayı tümüyle unutulmuş sayıp kapatmak).',
      meaning: 'Suyu kolayca emen gözenekli madde; eskiden yazı tahtasını silmekte kullanılırdı.',
      origin: 'Rumca "sfoungári" sözcüğünden Türkçeleşmiştir.',
      example: 'Eski kırgınlıkların üzerine sünger çekip yeni bir sayfa açtılar.'
    },
    {
      word: 'zeytin', module: 'deyim',
      clue: '"___ dalı uzatmak" (Barışmak ve uzlaşmak için ilk dostça adımı atmak).',
      meaning: 'Akdeniz iklimine özgü uzun ömürlü ağaç ve onun yağlı meyvesi.',
      origin: 'Arapça "zeytûn" sözcüğünden Türkçeye geçmiştir.',
      example: 'Uzun süren tartışmanın ardından rakip takıma zeytin dalı uzattı.'
    },
    {
      word: 'bülbül', module: 'deyim',
      clue: '"___ kesilmek" (Bir konuda duraksamadan, akıcı ve güzel biçimde konuşmaya başlamak).',
      meaning: 'Güzel ötüşüyle ünlü küçük ötücü kuş; klasik edebiyatın temel mazmunlarındandır.',
      origin: 'Farsça "bülbül" sözcüğünden Türk edebiyatına ve halk diline yerleşmiştir.',
      example: 'Konu sevdiği romanlara gelince utangaçlığını atıp adeta bülbül kesildi.'
    },
    {
      word: 'kalbur', module: 'deyim',
      clue: '"___üstü sayılmak" (Toplumda veya bir alanda seçkin, önde gelen nitelikte olmak).',
      meaning: 'Tahılı elemeye yarayan iri gözlü elek; üstte kalan iri ve dolgun taneleri simgeler.',
      origin: 'Arapça "gırbâl" sözcüğünden ses değişimiyle Türkçeleşmiştir.',
      example: 'Seçkide çağdaş Türk öykücülüğünün kalburüstü eserlerine yer verildi.'
    },

    // 7 Harf
    {
      word: 'tencere', module: 'deyim',
      clue: '"___ yuvarlanmış, kapağını bulmuş" (Huy ve tutumları birbirine çok benzeyen kişilerin bir araya gelmesi).',
      meaning: 'İçinde yemek pişirilen kapaklı mutfak kabı.',
      origin: 'Türkçe mutfak kültürü söz varlığından deyimleşmiştir.',
      example: 'İkisi de kitap kurdu; doğrusu tencere yuvarlanmış kapağını bulmuş.'
    },
    {
      word: 'çekirge', module: 'deyim',
      clue: '"___ bir sıçrar, iki sıçrar, üçüncüde ele geçer" (Kusurlu bir iş bir süre gizlense de sonunda yakalanır).',
      meaning: 'Uzun arka bacaklarıyla sıçrayarak ilerleyen böcek.',
      origin: 'Eski Türkçe "çekürge" sözcüğünden ses uyumuyla gelişmiştir.',
      example: 'Kural dışı kısayollar uzun sürmez; çekirge bir sıçrar, iki sıçrar...'
    },
    {
      word: 'karınca', module: 'deyim',
      clue: '"___ kararınca" (Az da olsa elinden geldiği, gücünün yettiği ölçüde katkıda bulunmak).',
      meaning: 'Topluluk hâlinde yaşayan çalışkanlığıyla simgeleşmiş küçük böcek.',
      origin: 'Eski Türkçe "karınçga" sözcüğünden ses sadeleşmesiyle oluşmuştur.',
      example: 'Okul kütüphanesine herkes karınca kararınca kitap bağışladı.'
    },
    {
      word: 'fırtına', module: 'deyim',
      clue: '"Rüzgâr eken ___ biçer" (Sert ve yıkıcı davranışta bulunan kişi çok daha sert tepkiyle karşılaşır).',
      meaning: 'Çok güçlü esen rüzgâr ve onun doğurduğu sert hava olayı.',
      origin: 'İtalyanca "fortuna" (deniz fırtınası) sözcüğünden Türk denizcilik diline geçmiştir.',
      example: 'İletişimde kırıcı sözlerden kaçınmalıyız; rüzgâr eken fırtına biçer.'
    },
    {
      word: 'pervane', module: 'deyim',
      clue: '"Etrafında ___ olmak" (Bir kimseye büyük özen göstermek, her isteğine koşmak).',
      meaning: 'Işığın çevresinde dönen gece kelebeği; klasik şiirde adanmışlığın simgesidir.',
      origin: 'Farsça "pervâne" sözcüğünden divan ve halk edebiyatına yerleşmiştir.',
      example: 'Misafirleri rahat etsin diye bütün akşam etraflarında pervane oldu.'
    },
    {
      word: 'kestane', module: 'deyim',
      clue: '"Ateşten ___yi maşayla çekmek" (Tehlikeli bir işi kendi zarar görmeden başkasına yaptırmak).',
      meaning: 'Dikenli kabuk içinde yetişen, kışın közde pişirilen besleyici yemiş.',
      origin: 'Yunanca "kástana" sözcüğünden Türkçeye geçmiştir.',
      example: 'Kendi sorumluluk almayıp ateşten kestane çekmeye çalışması hoş karşılanmadı.'
    },
    {
      word: 'teselli', module: 'deyim',
      clue: '"Züğürt ___si" (Büyük bir kayıp karşısında kendini önemsiz bir ayrıntıyla avutma).',
      meaning: 'Acı veya üzüntüyü hafifletmek için söylenen avuntu verici söz, avunma.',
      origin: 'Arapça "tesellî" sözcüğünden Türkçeye geçmiştir.',
      example: 'Maçı kaybedip yalnızca ilk golü attık diye sevinmek züğürt tesellisidir.'
    },
    {
      word: 'bilmece', module: 'deyim',
      clue: '"İçinden çıkılmaz bir ___ye dönmek" (Anlaşılması ve çözülmesi çok güç, karmaşık bir hâl almak).',
      meaning: 'Bir şeyin adını anmadan niteliklerini üstü kapalı söyleyerek buldurmayı amaçlayan söz oyunu.',
      origin: 'Türkçe "bil-" fiilinden "-mAcA" ekiyle türetilmiş halk edebiyatı terimidir.',
      example: 'Eksik veriler tamamlanınca karmaşık bilmece bir anda çözüldü.'
    },
    {
      word: 'curcuna', module: 'deyim',
      clue: '"Ortalığı ___ya çevirmek" (Düzeni bozup gürültülü, kargaşalı bir ortam yaratmak).',
      meaning: 'Geleneksel orta oyununda gürültülü ve hareketli dans bölümü; kargaşa.',
      origin: 'Geleneksel Türk tiyatrosundan (Orta Oyunu) günlük dile geçmiş terimdir.',
      example: 'Teneffüs zili çalınca koridor bir anda neşeli bir curcunaya döndü.'
    },
    {
      word: 'anahtar', module: 'deyim',
      clue: '"Başarının ___ı olmak" (Bir sorunu çözen veya hedefe ulaştıran en temel etken olmak).',
      meaning: 'Kilidi açıp kapamaya yarayan araç; mecaz olarak çözüm sağlayan temel unsur.',
      origin: 'Rumca "anoikhtêri" (açacak) sözcüğünden Türkçeleşmiştir.',
      example: 'Zengin söz varlığı, etkili okuma ve yazmanın en temel anahtarıdır.'
    },

    /* ==================== MODÜL 3: KÜLTÜREL VE EDEBİ MİRAS (4–7 HARF) ==================== */
    // 4 Harf
    {
      word: 'ozan', module: 'miras',
      clue: 'Eski Oğuz Türklerinde kopuz eşliğinde şiir söyleyen bilge şair.',
      meaning: 'Şiir yazan veya halk geleneğinde sazıyla deyiş söyleyen sanatçı, şair.',
      origin: 'Oğuz Türkçesinden gelen öz Türkçe sözcüktür; Cumhuriyet döneminde yeniden canlandırılmıştır.',
      example: 'Dede Korkut, Oğuz boylarının destanlarını dillendiren ulu bir ozandır.'
    },
    {
      word: 'ağıt', module: 'miras',
      clue: 'Halk edebiyatında bir ölüm veya büyük felaket ardından söylenen ezgili yas şiiri.',
      meaning: 'Ölen bir kimsenin iyiliklerini ve duyulan acıyı anlatan manzum halk edebiyatı ürünü.',
      origin: 'Türkçe "ağla-" fiiliyle aynı kökten ("ağ-ıt") türetilmiştir; İslamiyet öncesi karşılığı "sagu"dur.',
      example: 'Anadolu kadınlarının yaktığı ağıtlar, toplumsal hafızanın en içli belgeleridir.'
    },
    {
      word: 'otağ', module: 'miras',
      clue: 'Eski Türk kültürünü ve destanlarını süsleyen büyük, kubbeli hükümdar veya bey çadırı.',
      meaning: 'Büyük ve süslü çadır.',
      origin: 'Eski Türkçe "otag" (çadır, oda — içinde ateş/ocak yanan yer) kökünden gelir; "oda" sözcüğüyle kökteştir.',
      example: 'Destanda boy beyleri bahar şöleni için ak otağda toplandı.'
    },
    {
      word: 'töre', module: 'miras',
      clue: 'Orhun Yazıtları\'nda devletin temeli sayılan, toplumca benimsenmiş hukuk ve ahlak kuralları bütünü.',
      meaning: 'Bir toplulukta benimsenmiş, yerleşmiş davranış ve yaşama biçimlerinin, kuralların bütünü.',
      origin: 'Eski Türkçe "törü" (düzen, yasa, gelenek) sözcüğünden kesintisiz ulaşmıştır.',
      example: 'Bilge Kağan yazıtında "İl gider, töre kalır" anlayışı vurgulanır.'
    },
    {
      word: 'ekin', module: 'miras',
      clue: 'Anadolu\'da tarlaya ekilen tahılı, yazı dilinde ise "kültür" kavramını karşılayan öz Türkçe sözcük.',
      meaning: 'Tahılın tarlaya atıldığı andan harman oluncaya değin aldığı durum; kültür.',
      origin: 'Türkçe "ek-" fiil kökünden "+In" yapım ekiyle türetilmiştir.',
      example: 'Dil, bir ulusun yüzyıllar boyunca yeşerttiği en değerli ekin alanıdır.'
    },
    {
      word: 'ülkü', module: 'miras',
      clue: 'Uğruna çalışılan yüce amaç; "ideal" sözcüğünün öz Türkçe karşılığı.',
      meaning: 'Düşüncenin tasarlayabileceği en üstün amaç, mefkûre, ideal.',
      origin: 'Eski Türkçe "ülgü" (ölçü, örnek alınan hedef) sözcüğünden gelişmiştir.',
      example: 'Çağdaş ve duru bir bilim Türkçesi oluşturmak ortak ülkümüzdür.'
    },
    {
      word: 'öbek', module: 'miras',
      clue: 'Dilbilgisinde "sözcük grubu" anlamında da kullanılan, bir araya toplanmış küme.',
      meaning: 'Aynı türden şeylerin oluşturduğu topluluk, küme, grup.',
      origin: 'Anadolu ağızlarından yazı ve dilbilgisi diline kazandırılmış Türkçe sözcüktür.',
      example: 'İsim ve sıfat tamlamaları Türkçenin en işlek söz öbekleri arasındadır.'
    },
    {
      word: 'mani', module: 'miras',
      clue: 'Anonim Türk halk şiirinde genellikle yedi heceli, dört dizeli, "aaxa" uyaklı en küçük nazım biçimi.',
      meaning: 'Başlıca konusu sevgi ve doğa olan, ilk iki dizesi hazırlık niteliğindeki dört dizelik halk şiiri.',
      origin: 'Arapça "ma\'nî" (anlamlı söz) kökeninden gelip Anadolu\'da özgün bir şiir türü olmuştur.',
      example: 'Ramazan gecelerinde ve imece çalışmalarında karşılıklı mani söyleme geleneği yaşatılır.'
    },

    // 5 Harf
    {
      word: 'imece', module: 'miras',
      clue: 'Anadolu köylerinde işlerin el birliğiyle ve sırayla yardımlaşarak yapılması geleneği.',
      meaning: 'Birçok kişinin toplanıp el birliğiyle bir kişinin veya topluluğun işini görmesi.',
      origin: 'Anadolu Türkçesinin özgün dayanışma kültürü sözcüğüdür.',
      example: 'Köy okulunun kütüphanesi tüm mahallenin katıldığı bir imece ile kuruldu.'
    },
    {
      word: 'yazıt', module: 'miras',
      clue: 'Orhun Vadisi\'ndeki dikili taşlar gibi taş veya metal üzerine kazınmış tarihsel metin, kitabe.',
      meaning: 'Bir kimse veya olayın anısını yaşatmak için bir şey üzerine kazılan yazı, kitabe.',
      origin: 'Türkçe "yaz-" fiil kökünden "+It" yapım ekiyle türetilmiştir.',
      example: 'Kültigin ve Bilge Kağan yazıtları Türk dilinin bilinen ilk büyük edebi metinleridir.'
    },
    {
      word: 'kopuz', module: 'miras',
      clue: 'Dede Korkut ve eski Türk ozanlarının destan söylerken çaldığı, bağlamanın atası sayılan telli çalgı.',
      meaning: 'Ozanların çaldığı üç telli, gövdesi derili en eski Türk sazı.',
      origin: 'Dîvânu Lugâti\'t-Türk\'te de geçen en köklü Türkçe müzik terimidir.',
      example: 'Ozan eline kopuzunu alıp boyun kahramanlık öyküsünü anlatmaya başladı.'
    },
    {
      word: 'koşuk', module: 'miras',
      clue: 'İslamiyet öncesi Türk edebiyatında şölen ve av törenlerinde kopuzla söylenen lirik şiir.',
      meaning: 'Eski Türklerde aşk, doğa ve yiğitlik konularında hece ölçüsüyle söylenen şiir biçimi.',
      origin: 'Eski Türkçe "koş-" (sözü ezgiye katmak, dizmek) fiilinden "+Uk" ekiyle türetilmiştir.',
      example: 'Halk edebiyatındaki koşma nazım biçimi, eski Türk koşuk geleneğinin devamıdır.'
    },
    {
      word: 'betik', module: 'miras',
      clue: 'Orhun ve Uygur Türkçesinde "kitap, yazılı belge, mektup" anlamına gelen köklü Türkçe sözcük.',
      meaning: 'Yazılı şey, kitap, mektup; bilişimde komut dizisi (script).',
      origin: 'Eski Türkçe "biti-" (yazmak) fiilinden "+k" ekiyle türetilmiştir.',
      example: 'Irk Bitig, Eski Uygur döneminden günümüze ulaşan önemli bir betiktir.'
    },
    {
      word: 'heybe', module: 'miras',
      clue: 'Anadolu dokuma kültüründe omza veya binek hayvanının terkisine atılan iki gözlü kilim torba.',
      meaning: 'Halı veya kilim gibi dokunmuş, birbirine bitişik iki gözlü taşıma torbası.',
      origin: 'Arapça "haybe" sözcüğünden Anadolu göçebe ve köy kültürüne yerleşmiştir.',
      example: 'Yolcu, azığını ve kitaplarını nakışlı yün heybesine yerleştirdi.'
    },
    {
      word: 'divan', module: 'miras',
      clue: 'Klasik Türk edebiyatı şairlerinin şiirlerini belli bir düzene göre topladıkları eser.',
      meaning: 'Klasik Türk edebiyatında şairlerin kaside, gazel ve diğer şiirlerini içeren kitap.',
      origin: 'Farsça aracılığıyla gelen terim, 13–19. yüzyıl Türk edebiyat geleneğine adını vermiştir.',
      example: 'Fuzûlî\'nin Türkçe Divan\'ı, dilin lirik anlatım gücünün zirvelerinden biridir.'
    },
    {
      word: 'seçki', module: 'miras',
      clue: 'Farklı şair veya yazarların seçilmiş eserlerini bir araya getiren kitap; "antoloji"nin Türkçe karşılığı.',
      meaning: 'Şiir, öykü veya deneme gibi edebi ürünlerden seçilerek oluşturulmuş derleme, antoloji, güldeste.',
      origin: 'Türkçe "seç-" fiil kökünden "+gI > +kI" yapım ekiyle türetilmiştir.',
      example: 'Öğrenciler Cumhuriyet dönemi şiirlerinden oluşan özgün bir seçki hazırladı.'
    },
    {
      word: 'pusat', module: 'miras',
      clue: 'Destanlarda "silah, zırh, araç-gereç ve donanım" anlamında kullanılan tarihi sözcük.',
      meaning: 'Eski savaş araçları ve zırhlarının genel adı; donanım.',
      origin: 'Orta Türkçeden beri metinlerde yer alan tarihsel söz varlığı ögesidir.',
      example: 'Destan kahramanı atını eyerleyip erlik pusatını kuşandı.'
    },
    {
      word: 'gazel', module: 'miras',
      clue: 'Klasik Türk şiirinde aşk, ayrılık ve güzellik temalarını işleyen, "aa ba ca..." uyaklı nazım biçimi.',
      meaning: 'Divan edebiyatında 5–15 beyitten oluşan lirik nazım biçimi.',
      origin: 'Arap edebiyatından alınıp Bâkî, Fuzûlî ve Nedîm gibi şairlerce Türkçede yetkinleştirilmiştir.',
      example: 'Bâkî\'nin İstanbul Türkçesiyle söylediği gazeller ses uyumuyla öne çıkar.'
    },

    // 6 Harf
    {
      word: 'yalaza', module: 'miras',
      clue: 'Anadolu ağızlarında ve Yaşar Kemal romanlarında sıkça geçen "harlı ateş dili, alev" anlamındaki sözcük.',
      meaning: 'Alev, ateşin uzanan parıltılı dili.',
      origin: 'Eski Türkçe "yal-" (yanmak, parlamak) kökünden Anadolu ağızlarında korunan öz Türkçe sözcüktür.',
      example: 'Çoban ateşinin kızıl yalazası gece karanlığında kayaları aydınlatıyordu.'
    },
    {
      word: 'destan', module: 'miras',
      clue: 'Ulusların tarihinde derin iz bırakan göç, savaş ve doğa olaylarını anlatan uzun kahramanlık şiiri.',
      meaning: 'Tarih öncesi tanrı, tanrıça ve kahraman efsanelerini anlatan büyük manzum eser, epope.',
      origin: 'Farsça "dâstân" sözcüğünden gelmiş, Oğuz Kağan ve Manas gibi eserlerle Türk kültürünü taçlandırmıştır.',
      example: 'Manas Destanı, dünyanın yaşayan en hacimli sözlü destan mirasıdır.'
    },
    {
      word: 'meddah', module: 'miras',
      clue: 'Geleneksel Türk seyirlik sanatında yalnız başına sopası ve mendiliyle taklitli öyküler anlatan sanatçı.',
      meaning: 'Halk önünde bütün kişileri tek başına canlandırarak öykü anlatan geleneksel tiyatro ustası.',
      origin: 'Arapça kökenli olup Türk şehir kültüründe özgün bir anlatı sanatına dönüşmüştür.',
      example: 'Meddah, elindeki değneği yere vurarak merak uyandıran hikâyesine başladı.'
    },
    {
      word: 'kümbet', module: 'miras',
      clue: 'Selçuklu mimarisinde silindirik veya çokgen gövdeli, konik külah çatılı anıt mezar yapısı.',
      meaning: 'Anadolu Selçuklu dönemine özgü, çadır mimarisini taşa yansıtan anıtsal mezar.',
      origin: 'Farsça "günbed" (kubbe) sözcüğünden Anadolu mimarlık terminolojisine yerleşmiştir.',
      example: 'Ahlat ve Kayseri\'deki taş işlemeli kümbetler Selçuklu sanatının simgesidir.'
    },
    {
      word: 'söylev', module: 'miras',
      clue: 'Bir topluluğa belli bir düşünceyi aşılamak için yapılan coşkulu konuşma; "nutuk"un öz Türkçe karşılığı.',
      meaning: 'Dinleyicileri etkilemek ve yönlendirmek amacıyla yapılan uzun, etkili konuşma, hitabe.',
      origin: 'Türkçe "söyle-" fiilinden "+v" yapım ekiyle türetilmiştir.',
      example: 'Atatürk\'ün Büyük Söylev\'i yakın tarihimizin en temel birincil kaynağıdır.'
    },
    {
      word: 'bozlak', module: 'miras',
      clue: 'Orta ve Güney Anadolu\'da (özellikle Neşet Ertaş geleneğinde) serbest ölçülü, yanık uzun hava türü.',
      meaning: 'Yiğitlik, gurbet ve ayrılık konularını yüksek ve içli bir sesle işleyen halk müziği uzun havası.',
      origin: 'Türkçe "bozla-" (haykırmak, feryat etmek) fiilinden "+k" ekiyle türetilmiştir.',
      example: 'Bozkırın ortasında yankılanan bozlak dinleyenlerin yüreğine işledi.'
    },
    {
      word: 'bakraç', module: 'miras',
      clue: 'Anadolu\'da süt, yoğurt veya su taşımakta kullanılan kulplu küçük bakır kova.',
      meaning: 'Çoğunlukla bakırdan yapılan kulplu küçük kap.',
      origin: 'Türkçe "bakır" sözcüğünden "+Aç" ekiyle ("bakıraç > bakraç") türetilmiştir.',
      example: 'Yayladan dönen köylülerin elinde kalaylı bakraçlar parlıyordu.'
    },
    {
      word: 'kaftan', module: 'miras',
      clue: 'Eski Türk ve Osmanlı kültüründe devlet büyüklerinin giydiği veya ödül olarak giydirdiği süslü uzun üstlük.',
      meaning: 'Çoğu ipekli, sırmalı kumaştan dikilen, astarsız, uzun ve süslü üst giysisi.',
      origin: 'Eski Türkçede "kaptan" biçimiyle belgelenmiş, Türkçeden dünya dillerine yayılmış kültür sözcüğüdür.',
      example: 'Müzayedede sergilenen çintemani desenli kaftan ziyaretçileri büyüledi.'
    },
    {
      word: 'arasta', module: 'miras',
      clue: 'Geleneksel Türk çarşı mimarisinde aynı işi yapan esnafın karşılıklı sıralandığı üstü örtülü sokak.',
      meaning: 'Külliye yakınında aynı meslek grubundaki dükkânların dizildiği çarşı bölümü.',
      origin: 'Farsça "ârâste" (düzenlenmiş, süslenmiş) sözcüğünden Osmanlı şehircilik diline geçmiştir.',
      example: 'Edirne Selimiye Arastası yüzyıllardır geleneksel el sanatlarını yaşatıyor.'
    },

    // 7 Harf
    {
      word: 'bağlama', module: 'miras',
      clue: 'Âşık Veysel\'den günümüze Anadolu halk müziğinin ve ozanlık geleneğinin simgesi olan telli saz.',
      meaning: 'Sapına perde bağlandığı için bu adı alan, mızrap veya parmakla çalınan yedi telli Türk halk çalgısı.',
      origin: 'Türkçe "bağla-" fiilinden "-mA" ekiyle (sapına bağlanan perdeler nedeniyle) adlandırılmıştır.',
      example: 'Âşık Veysel, sadık yârim toprağı anlatırken bağlamasının tellerine dokundu.'
    },
    {
      word: 'varsağı', module: 'miras',
      clue: 'Toroslar\'da yaşayan Varsak Türkmenlerine özgü, "bre, hey, behey" ünlemleriyle yiğitçe söylenen halk şiiri.',
      meaning: 'Sekizli hece ölçüsüyle ve mertçe bir edayla söylenen âşık edebiyatı nazım biçimi.',
      origin: 'Oğuzların Varsak boyunun adından "+I" aidiyet ekiyle türetilmiştir.',
      example: 'Karacaoğlan, Türk halk şiirinde varsağı türünün en güçlü örneklerini vermiştir.'
    },
    {
      word: 'taşlama', module: 'miras',
      clue: 'Halk edebiyatında toplumdaki haksızlıkları ve aksaklıkları iğneleyici bir dille eleştiren şiir türü.',
      meaning: 'Kişi veya toplum kusurlarını alaycı ve eleştirel biçimde konu edinen halk şiiri; hicviye, yergi.',
      origin: 'Türkçe "taşla-" fiilinden mecaz yoluyla edebi terim olarak türetilmiştir.',
      example: 'Seyranî, dönemindeki adaletsizlikleri keskin taşlamalarıyla dile getirmiştir.'
    },
    {
      word: 'mesnevi', module: 'miras',
      clue: 'Klasik Türk edebiyatında her beyti kendi arasında uyaklı ("aa bb cc...") uzun öyküleyici nazım biçimi.',
      meaning: 'Divan edebiyatında uzun aşk, tasavvuf ve kahramanlık hikâyelerinin yazıldığı nazım biçimi.',
      origin: 'Arapça "mesnevî" (ikişerli) kökenlidir; Mevlânâ ve Şeyh Galip\'in eserleriyle özdeşleşmiştir.',
      example: 'Şeyh Galip\'in Hüsn ü Aşk adlı eseri klasik edebiyatımızın başyapıt mesnevilerindendir.'
    },
    {
      word: 'külliye', module: 'miras',
      clue: 'Merkezinde cami bulunan; medrese, kütüphane, şifahane ve aşeviyle bütünleşen toplumsal yapı topluluğu.',
      meaning: 'Bir caminin çevresinde kamu hizmetine sunulmuş eğitim, sağlık ve kültür yapıları bütünü.',
      origin: 'Arapça "küll" (bütün) kökünden türemiş Türk-İslam şehircilik ve mimari terimidir.',
      example: 'Süleymaniye Külliyesi, kütüphanesi ve darüşşifasıyla dönemin bilim merkeziydi.'
    },
    {
      word: 'karagöz', module: 'miras',
      clue: 'UNESCO Somut Olmayan Kültürel Miras Listesi\'nde yer alan, Hacivat ile atışmaya dayalı geleneksel gölge oyunu.',
      meaning: 'Deve derisinden kesilmiş renkli tasvirlerin ışıkla perdeye yansıtılmasına dayanan geleneksel Türk tiyatrosu.',
      origin: 'Başkişisi Karagöz\'ün adından gelen, yanlış anlamalara dayalı söz oyunlarıyla zengin halk sanatıdır.',
      example: 'Karagöz oyunundaki nükteler Türkçenin çok anlamlılık zenginliğini gözler önüne serer.'
    },
    {
      word: 'feraset', module: 'miras',
      clue: 'Bir durumu veya insanı ince sezgisiyle çabucak kavrama yeteneği, anlayış çabukluğu.',
      meaning: 'Anlayışlılık, sezgi gücü, ileri görüşlülük.',
      origin: 'Arapça kökenli olup klasik ve modern Türk edebiyatı metinlerinde seçkin söz varlığı ögesidir.',
      example: 'Anadolu insanının feraseti, zor dönemlerde doğru yolu bulmasını sağlamıştır.'
    },
    {
      word: 'belagat', module: 'miras',
      clue: 'Edebiyatta sözü yerinde, etkili, açık ve muhatabın durumuna uygun söyleme sanatı.',
      meaning: 'İyi, ikna edici ve kusursuz söz söyleme yeteneği; retorik.',
      origin: 'Klasik edebiyat kuramının temel kavramlarından olup Tanzimat\'ta Recaizade Mahmut Ekrem\'ce incelenmiştir.',
      example: 'Etkili bir konuşmacı, ses tonunu olduğu kadar belagat ilkelerini de ustaca kullanır.'
    },
    {
      word: 'zarafet', module: 'miras',
      clue: 'Davranışta, sözde ve sanatta incelik, uyum güzelliği (sıkça "zerafet" diye yanlış yazılır!).',
      meaning: 'İncelik, yakışıklılık, seçkinlik ve ölçülü güzellik.',
      origin: 'Arapça "zarâfet" sözcüğünden gelir; ilk hecedeki ünlü "a" ile yazılır.',
      example: 'İstanbul Türkçesinin zarafeti, Yahya Kemal\'in dizelerinde berrak biçimde duyulur.'
    },
    {
      word: 'derleme', module: 'miras',
      clue: 'Halk ağzındaki sözcükleri, türküleri veya edebi ürünleri sahadan toplayıp bir araya getirme çalışması.',
      meaning: 'Seçme ve toplama yoluyla oluşturulan bütüncül çalışma; halk bilimi alan araştırması.',
      origin: 'Türkçe "derle-" fiilinden "-mA" isim-fiil ekiyle türetilmiştir.',
      example: 'TDK Derleme Sözlüğü, Anadolu ağızlarının eşsiz hazinesini kayıt altına almıştır.'
    }
  ];

  /* Hızlı erişim dizinleri */
  var BY_WORD = {};
  var BY_MODULE = {
    all: { 4: [], 5: [], 6: [], 7: [] },
    karsilik: { 4: [], 5: [], 6: [], 7: [] },
    deyim: { 4: [], 5: [], 6: [], 7: [] },
    miras: { 4: [], 5: [], 6: [], 7: [] }
  };

  ENTRIES.forEach(function (entry) {
    var w = toLowerTr(entry.word);
    var len = chars(w).length;
    if (!BY_MODULE.all[len]) return;
    var normalized = Object.assign({}, entry, { word: w, length: len });
    BY_WORD[w] = normalized;
    if (BY_MODULE[entry.module] && BY_MODULE[entry.module][len].indexOf(w) === -1) {
      BY_MODULE[entry.module][len].push(w);
    }
    if (BY_MODULE.all[len].indexOf(w) === -1) {
      BY_MODULE.all[len].push(w);
    }
  });

  function getEntry(word) {
    if (!word) return null;
    return BY_WORD[toLowerTr(word)] || null;
  }

  function getWordsForModule(moduleId, length, fallbackWords) {
    if (moduleId && moduleId !== 'genel' && BY_MODULE[moduleId] && BY_MODULE[moduleId][length] && BY_MODULE[moduleId][length].length) {
      return BY_MODULE[moduleId][length].slice();
    }
    return (fallbackWords && fallbackWords[length]) ? fallbackWords[length].slice() : [];
  }

  function moduleWordCounts(fallbackWords) {
    var result = {};
    Object.keys(MODULES).forEach(function (m) {
      result[m] = {};
      [4, 5, 6, 7].forEach(function (len) {
        result[m][len] = getWordsForModule(m, len, fallbackWords).length;
      });
    });
    return result;
  }

  /* ==================== KATMAN 2: AKILLI YAZIM KOÇU ==================== */

  /**
   * Öğrencilerin sık yaptığı yazım yanlışları veri tabanı (4–7 harfli biçimler).
   * Her kayıt: { correct, category, rule }
   */
  var COMMON_MISSPELLINGS = {
    // Ünlü düşmesi / türemesi ve kök değişimleri
    'yanlız': { correct: 'yalnız', category: 'Ünlü Düşmesi Hatası', rule: '"Yalın" kökünden "+ız" ekiyle türetilirken ikinci hecedeki dar ünlü düşer ve ses dizimi "yal-nız" olur.' },
    'yalnış': { correct: 'yanlış', category: 'Ünlü Düşmesi Hatası', rule: '"Yanıl-" fiil kökünden "+ış" ekiyle türetilir; dar ünlü düşer ve "yan-lış" biçiminde yazılır.' },
    'burda': { correct: 'burada', category: 'Ünlü Düşmesi Hatası', rule: 'Konuşma dilinde düşürülen "a" ünlüsü yazı dilinde korunmalıdır: "burada".' },
    'şurda': { correct: 'şurada', category: 'Ünlü Düşmesi Hatası', rule: 'İşaret bildiren yer sözcüklerinde orta hece ünlüsü düşürülmez: "şurada".' },
    'orda': { correct: 'orada', category: 'Ünlü Düşmesi Hatası', rule: 'Yazı dilinde orta hece ünlüsü korunur: "orada".' },
    'nerde': { correct: 'nerede', category: 'Ünlü Düşmesi Hatası', rule: 'Soru sözcüğü yazı dilinde ünlü düşmesi olmadan "nerede" biçiminde yazılır.' },
    'içerde': { correct: 'içeride', category: 'Ünlü Düşmesi Hatası', rule: '"İçeri" sözcüğü bulunma durumu eki aldığında son ünlüsü düşmez: "içeride".' },
    'dışarda': { correct: 'dışarıda', category: 'Ünlü Düşmesi Hatası', rule: '"Dışarı" sözcüğü ek aldığında dar ünlüsünü korur: "dışarıda".' },
    'yukarda': { correct: 'yukarıda', category: 'Ünlü Düşmesi Hatası', rule: '"Yukarı" sözcüğü bulunma eki aldığında "ı" ünlüsü korunur: "yukarıda".' },
    'klavuz': { correct: 'kılavuz', category: 'Ünlü Düşmesi Hatası', rule: 'Türkçe kökenli sözcüğün ilk hecesinde "ı" ünlüsü bulunur: "kılavuz".' },
    'traş': { correct: 'tıraş', category: 'Ünlü Eksikliği Hatası', rule: 'TDK Yazım Kılavuzu\'na göre ilk hecede "ı" ünlüsü yer alır: "tıraş".' },
    'kral': null, // doğru

    // Bitişik / Ayrı Yazım Hataları
    'herşey': { correct: 'her şey', category: 'Bitişik / Ayrı Yazım Hatası', rule: '"Şey" sözcüğü belgisiz zamirdir ve kendinden önceki sözcüklerden her zaman ayrı yazılır: "her şey".' },
    'birşey': { correct: 'bir şey', category: 'Bitişik / Ayrı Yazım Hatası', rule: '"Şey" sözcüğü her durumda ayrı yazılır: "bir şey".' },
    'çokşey': { correct: 'çok şey', category: 'Bitişik / Ayrı Yazım Hatası', rule: '"Şey" sözcüğü her durumda ayrı yazılır: "çok şey".' },
    'şuan': { correct: 'şu an', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'İşaret sıfatı "şu" ile "an" adı anlam kaymasına uğramadığı için ayrı yazılır: "şu an".' },
    'sağol': { correct: 'sağ ol', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Ses düşmesi veya türemesi olmayan yardımcı fiil/dilek kalıbı ayrı yazılır: "sağ ol".' },
    'pekçok': { correct: 'pek çok', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Belirteç görevindeki "pek" sözcüğü "çok"tan ayrı yazılır: "pek çok".' },
    'birçok': null, // doğru (bitişik)
    'hiçbir': null, // doğru (bitişik)
    'hergün': { correct: 'her gün', category: 'Bitişik / Ayrı Yazım Hatası', rule: '"Her" sıfatı kalıplaşmış birkaç sözcük (herhalde, herkes, herhangi) dışında ayrı yazılır: "her gün".' },
    'heran': { correct: 'her an', category: 'Bitişik / Ayrı Yazım Hatası', rule: '"Her" sıfatı "an" sözcüğünden ayrı yazılır: "her an".' },
    'farket': { correct: 'fark et', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'İlk sözcükte ünlü düşmesi veya ünsüz türemesi yoksa "etmek/olmak" yardımcı fiilleri ayrı yazılır.' },
    'terket': { correct: 'terk et', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Ses olayı bulunmadığı için yardımcı fiil ayrı yazılır: "terk et".' },
    'arzet': { correct: 'arz et', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Ses olayı bulunmadığı için yardımcı fiil ayrı yazılır: "arz et".' },
    'tabiki': { correct: 'tabii ki', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Bağlaç olan "ki" ayrı, ilk sözcük ise çift "i" ile yazılır: "tabii ki".' },
    'iyiki': { correct: 'iyi ki', category: 'Bitişik / Ayrı Yazım Hatası', rule: 'Bağlaç olan "ki" kendinden önceki sözcükten ayrı yazılır: "iyi ki".' },

    // Göçüşme (Metatez) Hataları
    'kiprik': { correct: 'kirpik', category: 'Göçüşme (Metatez) Hatası', rule: 'Konuşma dilinde seslerin yer değiştirmesi (r-p → p-r) yazıya aktarılmamalıdır: "kirpik".' },
    'kirbit': { correct: 'kibrit', category: 'Göçüşme (Metatez) Hatası', rule: 'Doğru ünsüz dizimi b-r biçimindedir: "kibrit".' },
    'körpü': { correct: 'köprü', category: 'Göçüşme (Metatez) Hatası', rule: 'Ağızlarda görülen p-r → r-p göçüşmesi yazı dilinde kullanılmaz: "köprü".' },
    'torpak': { correct: 'toprak', category: 'Göçüşme (Metatez) Hatası', rule: 'Yazı dilindeki doğru biçimi "toprak"tır.' },
    'yarpak': { correct: 'yaprak', category: 'Göçüşme (Metatez) Hatası', rule: 'Yazı dilindeki doğru biçimi "yaprak"tır.' },
    'eşki': { correct: 'ekşi', category: 'Göçüşme (Metatez) Hatası', rule: 'Ünsüz göçüşmesi yapılmadan k-ş sırasıyla "ekşi" olarak yazılır.' },
    'pehriz': { correct: 'perhiz', category: 'Göçüşme (Metatez) Hatası', rule: 'Farsça kökenli sözcüğün doğru yazımı "perhiz"dir.' },

    // Ünsüz Benzeşmesi / Yumuşaması / Değişimi Hataları
    'herkez': { correct: 'herkes', category: 'Ünsüz Değişimi Hatası', rule: 'Sözcük sonunda "z" değil "s" ünsüzü bulunur: "herkes".' },
    'tesbih': { correct: 'tespih', category: 'Ünsüz Benzeşmesi Hatası', rule: 'Türkçede yerleşmiş yazımı "b" ile değil "p" iledir: "tespih".' },
    'şevkat': { correct: 'şefkat', category: 'Ünsüz Değişimi Hatası', rule: 'Sözcük "şevk"ten değil "şefkat" kökünden gelir; "f" ile yazılır.' },
    'şarz': { correct: 'şarj', category: 'Ünsüz Değişimi Hatası', rule: 'Fransızca kökenli sözcüğün son sesi "j"dir: "şarj".' },
    'ahçı': { correct: 'aşçı', category: 'Ünsüz Benzeşmesi Hatası', rule: 'Sözcük "aş" (yemek) kökünden "+çı" ekiyle türemiştir: "aşçı".' },
    'kitapı': { correct: 'kitabı', category: 'Ünsüz Yumuşaması Hatası', rule: '"p, ç, t, k" ile biten sözcükler ünlüyle başlayan ek aldığında yumuşar: "kitabı".' },
    'ağaçı': { correct: 'ağacı', category: 'Ünsüz Yumuşaması Hatası', rule: 'Ünlüyle başlayan ek geldiğinde "ç" ünsüzü yumuşayarak "c" olur: "ağacı".' },
    'renki': { correct: 'rengi', category: 'Ünsüz Yumuşaması Hatası', rule: '"Renk" sözcüğü ünlüyle başlayan ek aldığında "k > g" yumuşaması gerçekleşir: "rengi".' },

    // Yabancı Kökenli Sözcük ve Ünlü Yazımı Hataları
    'orjinal': { correct: 'orijinal', category: 'Yabancı Kökenli Sözcük Yazımı', rule: 'Sözcükte "r"den sonra "i" ünlüsü bulunur: "orijinal" (Türkçe karşılığı: özgün).' },
    'süpriz': { correct: 'sürpriz', category: 'Yabancı Kökenli Sözcük Yazımı', rule: 'İlk hecenin sonunda "r" ünsüzü düşürülmez: "sürpriz".' },
    'şöför': { correct: 'şoför', category: 'Ünlü Uyumu Aşırı Düzeltmesi', rule: 'Fransızca kökenli sözcüğün ilk hecesi "o", ikinci hecesi "ö" iledir: "şoför".' },
    'espiri': { correct: 'espri', category: 'Ünlü Türemesi Hatası', rule: 'Ünsüz kümesi arasına "i" ünlüsü eklenmez: "espri".' },
    'gurup': { correct: 'grup', category: 'Anlam / Yazım Karışıklığı', rule: 'Topluluk anlamında "u"suz "grup" yazılır ("gurup" yalnızca güneşin batışı demektir).' },
    'klüp': { correct: 'kulüp', category: 'Ünlü Eksikliği Hatası', rule: 'İlk hecede "u" ünlüsü bulunur: "kulüp".' },
    'meyva': { correct: 'meyve', category: 'Ünlü Değişimi Hatası', rule: 'Ölçünlü yazı dilinde son ünlü "a" değil "e"dir: "meyve".' },
    'makina': { correct: 'makine', category: 'Ünlü Değişimi Hatası', rule: 'TDK Yazım Kılavuzu\'na göre son hece "e" ile yazılır: "makine".' },
    'zerafet': { correct: 'zarafet', category: 'Ünlü Değişimi Hatası', rule: '"Zarif" sözcüğüyle aynı kökten geldiği için ilk hece "a" ile yazılır: "zarafet".' },
    'döküman': { correct: 'doküman', category: 'Ünlü Değişimi Hatası', rule: 'İlk hecede "ö" değil "o" ünlüsü yer alır: "doküman" (Türkçe karşılığı: belge).' },
    'egzos': { correct: 'egzoz', category: 'Yabancı Kökenli Sözcük Yazımı', rule: 'Her iki seste de ötümlü ünsüz bulunur: "egzoz".' },
    'eksoz': { correct: 'egzoz', category: 'Yabancı Kökenli Sözcük Yazımı', rule: 'Doğru yazımı "egzoz" biçimindedir.' },
    'poaça': { correct: 'poğaça', category: 'Ünsüz Eksikliği Hatası', rule: 'Sözcükte "ğ" harfi yer alır: "poğaça".' },
    'pohaça': { correct: 'poğaça', category: 'Ünsüz Değişimi Hatası', rule: 'Sözcük "h" ile değil "ğ" ile yazılır: "poğaça".' },
    'lavobo': { correct: 'lavabo', category: 'Ünlü Değişimi Hatası', rule: 'İkinci hecede "o" değil "a" ünlüsü bulunur: "lavabo".' },
    'fasülye': { correct: 'fasulye', category: 'Ünlü Değişimi Hatası', rule: 'İkinci hecede "ü" değil "u" ünlüsü bulunur: "fasulye".' },
    'kurdela': { correct: 'kurdele', category: 'Ünlü Değişimi Hatası', rule: 'Son hecede "a" değil "e" ünlüsü bulunur: "kurdele".' },
    'ünvan': { correct: 'unvan', category: 'Ünlü Değişimi Hatası', rule: 'TDK Yazım Kılavuzu\'nda ilk harf noktasız "u" iledir: "unvan" (Türkçe karşılığı: san).' },

    // Konuşma Dili Aktarımı
    'çünki': { correct: 'çünkü', category: 'Dudak Uyumu Hatası', rule: 'Bağlaç küçük ünlü uyumuna uyarak "çünkü" biçiminde yazılır.' },
    'yapıyom': { correct: 'yapıyorum', category: 'Konuşma Dili Aktarımı', rule: 'Şimdiki zaman eki yazı dilinde daraltılmaz; "-yorum" biçiminde tam yazılır.' },
    'geliyom': { correct: 'geliyorum', category: 'Konuşma Dili Aktarımı', rule: 'Ağız ve konuşma dilindeki "-yom" kısaltması yazı dilinde kullanılmaz.' },
    'gidiyom': { correct: 'gidiyorum', category: 'Konuşma Dili Aktarımı', rule: 'Şimdiki zaman çekimi yazı dilinde "gidiyorum" olarak yazılır.' },
    'biliyom': { correct: 'biliyorum', category: 'Konuşma Dili Aktarımı', rule: 'Şimdiki zaman çekimi yazı dilinde "biliyorum" olarak yazılır.' }
  };

  var CONFUSABLE_PAIRS = [
    ['ı', 'i'], ['o', 'ö'], ['u', 'ü'], ['a', 'e'],
    ['ğ', 'g'], ['ş', 's'], ['ç', 'c'],
    ['p', 'b'], ['t', 'd'], ['k', 'g'], ['k', 'ğ'], ['s', 'z'], ['f', 'v']
  ];

  function dictHas(dictionary, w) {
    if (!dictionary) return false;
    if (typeof dictionary.has === 'function') return dictionary.has(w);
    return Array.isArray(dictionary) && dictionary.indexOf(w) !== -1;
  }

  /**
   * Sözlük tarafından reddedilen bir tahmini dilbilimsel açıdan çözümler.
   * Dönen nesne: { found: boolean, typed, suggested, category, rule }
   */
  function diagnoseOrthography(guess, dictionary) {
    var g = toLowerTr(String(guess || '').trim());
    if (!g) return { found: false };

    // 1. Doğrudan bilinen yazım yanlışları sözlüğü
    var known = COMMON_MISSPELLINGS[g];
    if (known) {
      return {
        found: true,
        typed: toUpperTr(g),
        suggested: toUpperTr(known.correct),
        category: known.category,
        rule: known.rule
      };
    }

    // Sözlük yüklü değilse algoritmik öneri üretme
    if (!dictionary) return { found: false };

    var gc = chars(g);

    // 2. Göçüşme (ardışık iki harfin yer değiştirmesi: ör. kiprik -> kirpik, kalme -> kalem)
    for (var i = 0; i < gc.length - 1; i++) {
      if (gc[i] === gc[i + 1]) continue;
      var swapped = gc.slice();
      var tmp = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = tmp;
      var candSwap = swapped.join('');
      if (dictHas(dictionary, candSwap)) {
        return {
          found: true,
          typed: toUpperTr(g),
          suggested: toUpperTr(candSwap),
          category: 'Harf Sırası / Göçüşme Hatası',
          rule: '"' + toUpperTr(gc[i]) + '" ve "' + toUpperTr(gc[i + 1]) + '" harflerinin sırası karışmış görünüyor. Doğru yazım: ' + toUpperTr(candSwap) + '.'
        };
      }
    }

    // 3. Türkçede sık karıştırılan ses çiftleri (ı/i, ö/o, ü/u, ğ/g, p/b, t/d, s/z vb.)
    for (var pos = 0; pos < gc.length; pos++) {
      var ch = gc[pos];
      for (var p = 0; p < CONFUSABLE_PAIRS.length; p++) {
        var pair = CONFUSABLE_PAIRS[p];
        var alt = ch === pair[0] ? pair[1] : (ch === pair[1] ? pair[0] : null);
        if (!alt) continue;
        var copy = gc.slice();
        copy[pos] = alt;
        var candAlt = copy.join('');
        if (dictHas(dictionary, candAlt)) {
          var isVowel = 'aıoueiöü'.indexOf(ch) !== -1;
          return {
            found: true,
            typed: toUpperTr(g),
            suggested: toUpperTr(candAlt),
            category: isVowel ? 'Ünlü Yazımı / Uyumu Hatası' : 'Ünsüz Yazımı / Benzeşmesi Hatası',
            rule: (pos + 1) + '. harfte "' + toUpperTr(ch) + '" yerine "' + toUpperTr(alt) + '" kullanılmalıdır. Sözlükteki doğru biçim: ' + toUpperTr(candAlt) + '.'
          };
        }
      }
    }

    return { found: false };
  }

  var api = {
    MODULES: MODULES,
    ENTRIES: ENTRIES,
    COMMON_MISSPELLINGS: COMMON_MISSPELLINGS,
    getEntry: getEntry,
    getWordsForModule: getWordsForModule,
    moduleWordCounts: moduleWordCounts,
    diagnoseOrthography: diagnoseOrthography
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.SozIziData = api;
  }
})(typeof window !== 'undefined' ? window : this);
