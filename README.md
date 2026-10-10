# NakGo

Yük sahipleri ile taşıyıcıları buluşturan, telefon ekranına göre tasarlanmış yük pazarı. Çerçevesiz, statik uygulama: yayına giden tek dosya `index.html`.

## Klasör yapısı

```
nakgo/
├─ index.html            Yayına giden uygulama (src/'den ÜRETİLİR, elle düzenleme)
├─ sw.js                 Servis çalışanı (internet olmadan açılış)
├─ manifest.webmanifest  Ana ekrana eklenebilir uygulama (PWA) ayarları
├─ vercel.json           Vercel güvenlik başlıkları
├─ package.json          Komutlar
├─ README.md             Bu dosya
├─ icons/                Uygulama simgeleri (5 dosya)
├─ src/                  KAYNAK KOD: düzenlediğin yer
│  ├─ index.template.html
│  ├─ js/                9 modül (00-config … 99-init)
│  └─ css/               4 dosya
├─ tools/                bundle.js (birleştirir), dev.js (lint, map, new, www), logo.py
├─ tests/                run.js, unit/ (2 dosya), e2e.py
└─ docs/                 ARCHITECTURE.md (mimari), HANDOFF.md (devir notu), MOBIL-VE-MARKA.md
```

Toplam 36 dosya. Yayına yalnızca `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` ve ayar dosyaları gider (`.vercelignore`). Logo ve mağaza görselleri depoda tutulmaz, `npm run logo` ile üretilir (ayrı bir "görseller" paketi olarak da verilmiştir).

## Hızlı başlangıç

`index.html` dosyasına çift tıklayıp tarayıcıda açabilirsin. Daha doğru bir deneme için (servis çalışanı ve konum için) Node.js 18+ ile:

```
npm start
```

Açılan adres genellikle `http://localhost:3000`.

## Geliştirme akışı

Kodu **`src/` altında** düzenle, `index.html` bundan üretilir:

```
npm run bundle     # src/ → index.html
npm test           # bundle güncel mi + lint + hızlı testler
npm run test:e2e   # gerçek tarayıcı testi
```

Yeni özellik için `npm run new -- ad "Başlık" "Açıklama"`. Kodun nerede olduğu, yükleme sırası ve kontrol listesi `docs/ARCHITECTURE.md` içindedir. `index.html`'i elle değiştirirsen `npm test` hata verir.

## Komutlar

| Komut | Ne yapar | Gerekenler |
|---|---|---|
| `npm run bundle` | `src/` dosyalarını birleştirip `index.html` üretir | Node.js 18+ |
| `npm test` | Bundle güncel mi, lint, 100'den fazla hızlı kontrol | Node.js 18+ |
| `npm run test:e2e` | Gerçek Chromium'da uygulamayı baştan sona gezer | `pip install playwright` ve `playwright install chromium` |
| `npm run test:all` | İkisini birden çalıştırır | Yukarıdakiler |
| `npm run test:shots` | Ekran görüntüleri alır (`tests/shots/`, git dışı) | Playwright |
| `npm run lint` | Kaynak denetimi (ad çakışması, başlıklar, yasaklı ifadeler) | Node.js 18+ |
| `npm run map` | Dosya ve işlev haritasını ekrana yazar | Node.js 18+ |
| `npm run new -- ad "Başlık" "Açıklama"` | Yeni özellik modülü ve test iskeleti | Node.js 18+ |
| `npm run logo` | Logo, simge ve mobil görselleri üretir (`icons/` ve `export/`) | `pip install fonttools playwright`, Poppins Bold (bkz. `docs/MOBIL-VE-MARKA.md`) |
| `npm run mobile:prepare` | Web dosyalarını `www/` klasörüne kopyalar (mobil kabuk için) | Node.js 18+ |

Yayına çıkmadan önce `npm run test:all` çalıştır. Bunlar gerçek telefon testinin yerini tutmaz.

## GitHub'a yükleme (ilk kez)

1. github.com'da yeni bir depo oluştur (örneğin `nakgo`).
2. Bu klasörün içindeki **her şeyi** depoya yükle (GitHub Desktop veya tarayıcıdan "Add file → Upload files").

Komut satırıyla:

```
git init
git add .
git commit -m "NakGo ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/nakgo.git
git push -u origin main
```

## Var olan depoyu güncelleme (en güvenli yol)

Eski sürümlerde dosya düzeni farklıydı (`brand/`, `mobile/`, `tests/lib/` gibi klasörler artık yok). Karışmaması için:

1. Depo klasörünü aç. **`.git` klasörüne dokunma** (gizli olabilir), onun dışındaki her şeyi sil.
2. Bu zip'in içindeki dosyaların hepsini o klasöre kopyala.
3. GitHub Desktop'ta "Changes" altında silinen ve eklenen dosyaları göreceksin. Bir özet yazıp **Commit**, sonra **Push origin**.
4. "Pull" sırasında çakışma (conflict) çıkarsa: her çakışmada **senin bilgisayarındaki** sürümü tut, Copilot ile çözmeye çalışma.

## Vercel'e yayınlama

1. vercel.com'a GitHub hesabınla gir, **Add New → Project**, deponu seç.
2. **Framework Preset: Other** kalsın. Build Command, Output Directory, Install Command alanları **boş** kalsın. (`package.json` içinde bilerek `build` komutu yok.)
3. **Deploy**. Birkaç saniye sonra `https://nakgo-....vercel.app` adresinde yayında olur.
4. Depoya her gönderişinde Vercel otomatik yeniden yayınlar.

Telefonda siteyi açıp tarayıcı menüsünden "Ana ekrana ekle" dersen uygulama gibi açılır. Kamera, konum ve arama gibi özellikler için adres `https` olmalı, Vercel adresleri zaten öyle.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| Vercel "No Output Directory" veya build hatası | Project Settings → Build and Output Settings'te Build Command ve Output Directory'yi boşalt |
| Değişiklik sitede görünmüyor | Vercel → Deployments'ta son dağıtımın "Ready" olduğuna bak. Tarayıcıda sayfayı sert yenile (Ctrl+Shift+R) veya site verilerini sil. Servis çalışanı önce ağdan dener, ama tarayıcı bazen eski sayfayı tutar |
| Sayfa 404 | `index.html` deponun **kökünde** olmalı, bir alt klasörde değil |
| Değişikliğim yayında yok ama `src/` içinde yaptım | `npm run bundle` çalıştırıp **`index.html`'i de commit et**. Vercel `src/`'yi derlemez, hazır `index.html`'i yayınlar |
| GitHub Desktop "Resolve conflicts" | Her çakışmada kendi sürümünü tut ("Accept Current Change"), sonra Continue merge |
| Telefonda konum/kamera çalışmıyor | Adres `https` mi? Tarayıcı site ayarlarında izni ver |
| Eski logo görünüyor | Tarayıcı simgeyi önbelleğe alır. Sekmeyi kapatıp aç, ana ekran simgesini silip yeniden ekle |

## Mobil uygulama (Android ve iOS)

Uygulama mobil uyumlu bir web uygulamasıdır: güvenli alanlar, Android geri tuşu, ana ekrana ekleme (profilde kart), kısayollar (`?go=post`, `?go=mine`, `?go=near`) hazırdır. Mağazaya koymak için Capacitor kabuğu kullanılır, adımlar `docs/MOBIL-VE-MARKA.md` içindedir. Telefona uygulama gibi eklemek için Vercel adresini açıp "Ana ekrana ekle" demen yeterlidir.

## Veriler nerede?

Bu sürümde veritabanı yok. İlanlar, teklifler, mesajlar ve ayarlar her kullanıcının **kendi tarayıcısında** (localStorage) durur. İki farklı telefon birbirinin ilanını görmez. Örnek ilanlara verilen teklifler uygulama tarafından simüle edilen yanıtlarla sonuçlanır, ilan istatistikleri yerel modda örnek verilerdir.

Aynı dosya Claude üzerinde yayınlanınca ortak veritabanıyla da çalışır. `claude` yoksa uygulama otomatik yerel moda geçer, Vercel'de her zaman yerel moddadır.

## Premium üyelik (test modu)

Doğrudan arama yalnızca Premium üyelere açıktır. Planlar `index.html` içinde `PLANS` satırındadır (299 ₺ aylık, 3.099 ₺ yıllık). **Satın alma şu an simüle edilir**, gerçek ödeme almaz. Profildeki "Üyeliği sıfırla (test)" testte üyeliği kapatır. Premium kontrolü yalnızca arayüzdedir: gerçek ürüne geçerken üyelik durumu sunucuda tutulmalı ve telefon numarası yalnızca üyeye sunucudan verilmelidir.

## Özellikler

İlan listesi ve filtre (81 il), boş araç ilanları, yakınımda (konum), ilan verme (kalem, fotoğraf, fiyat önerisi), haritada rota, piyasa karşılaştırma, iki ilanı karşılaştırma, yakıt hesabı, teklif ve karşı teklif, mesajlaşma, teslim kanıtı (fotoğraflı), puan ve yorum, herkese açık profil, belge rozeti ve yönetici onayı, rota alarmı, bildirimler, favoriler, ilan istatistikleri (yük sahibi), öne çıkan ilan ve boş araç ilanı (sabit fiyat listesi, test modu) ve öne çıkarmanın etkisi, haftalık kazanç grafiği (taşıyıcı), şikayet ve engelleme, yardım, açılış tanıtımı, açık/koyu tema (üst barda ay/güneş düğmesi), internet olmadan açılış, ana ekrana ekleme.

## Bilinen sınırlar

- 81 ilin mesafeleri yaklaşıktır (ilk 12 şehir elle girilmiş tablodan, diğerleri koordinattan hesaplanır), gerçek rota hesabı değildir.
- Mazot fiyatı varsayılanı (95 ₺/L) 4 Ekim 2026 İstanbul fiyatıdır. Yakıt hesabından değiştirilebilir.
- Piyasa fiyatı karşılaştırması yalnızca uygulamadaki ilanlardan hesaplanır.
- "Belgeli" rozeti kişinin beyanı, "Onaylı" rozeti yöneticinin onayıdır.
- Gerçek kullanıcıya açmadan önce kullanıcı doğrulama, ödeme, KVKK ve hukuki konular ayrıca ele alınmalıdır (bkz. `docs/HANDOFF.md`).
