# NakGo mimari

Bu belge, kodun nasıl düzenlendiğini ve yeni bir özelliğin nereye, nasıl ekleneceğini anlatır. Dosya ve işlev listesi için `npm run map` çalıştır (çıktıyı ekrana yazar).

## 1. Büyük resim

- Çerçevesiz, **tek sayfalık statik uygulama**. Yayına giden dosya `index.html` tek parçadır (Vercel ve Claude önizlemesi bunu bekler).
- Kod `src/` altında **9 betik ve 4 stil modülüne** bölünür. `npm run bundle` bunları birleştirip `index.html`'i üretir. **`index.html`'i elle düzenleme**, `npm test` içindeki bundle kontrolü bunu yakalar.
- Birleşik betik tek bir **klasik betik kapsamıdır** (ES modülü değil). Tüm üst düzey işlevler ve değişkenler birbirini doğrudan görür. Bu yüzden aynı ad iki yerde tanımlanamaz (`npm run lint` denetler).
- Her modül dosyası `// ===== Bölüm adı =====` ayraçlarıyla bölümlere ayrılmıştır. Bir şey ararken önce modülü, sonra bölümü bul.

```
nakgo/
├─ index.html  sw.js  manifest.webmanifest   yayına giden dosyalar (index.html src/'den üretilir)
├─ vercel.json  .vercelignore  package.json  ayarlar
├─ icons/                    uygulama simgeleri (5 dosya)
├─ src/
│  ├─ index.template.html    HTML iskeleti + /*@CSS@*/ ve /*@JS@*/ yerleri
│  ├─ js/                    00-config … 99-init (9 modül)
│  └─ css/                   01-theme … 04-motion-responsive (4 dosya)
├─ tools/                    bundle.js, dev.js (lint, map, new, www), logo.py
├─ tests/                    run.js, unit/{app,platform}.test.js, e2e.py
└─ docs/                     ARCHITECTURE.md, HANDOFF.md, MOBIL-VE-MARKA.md
```

## 2. JavaScript modülleri ve yükleme sırası

| Dosya | İçerik | Yükleme sırası neden böyle |
|---|---|---|
| `00-config` | Sabitler (şehirler, araç tipleri, fiyatlar, süreler), harita çokgenleri, mesafe ve rota haritası SVG'si | Diğer her şey bunları okur |
| `01-state` | **Tüm değişken durum (`let`)**, gruplanmış; yerel modda görünen örnek ilanlar ve boş araçlar | Hemen çalışan kodlar durumu görmeli |
| `02-core` | Çekirdek: yardımcılar (`esc`, `clean`, `$`, `fmt`, `toast`), fotoğraf işleme, `save()` ve açılışta geri yükleme, ortak veritabanı katmanı (`initCloud`) | Örnek veriden sonra çalışmalı (kayıtlı veri örneğin üstüne yazar) |
| `10-listings` | İlan listesi: kartlar, filtre, sıralama, yakınımda, karşılaştırma, piyasa fiyatı; **ilanlarım**: düzenle, kapat, sil | Yalnızca tanım |
| `11-offers` | Teklif, karşı teklif, simüle yanıt, teslim aşamaları ve fotoğrafı, dönüş yükü; bildirimler, zil, rota alarmı; teklif sohbeti | Yalnızca tanım |
| `12-account` | Herkese açık profil, puan/yorum, rol ve tanıtım, kazanç özeti, ana ekrana ekleme, profil sekmesinin olayları (`listBind`); belge rozetleri, belge fotoğrafı, yönetici onayı, telefon; şikayet, engelleme, yardım | Yalnızca tanım |
| `13-monetization` | Premium ve arama kapısı; öne çıkan ilan (fiyat, satın alma, etki ölçümü); ilan istatistikleri ve olay izleme | Yalnızca tanım |
| `20-screens` | `render()` (sekme çizimi), ilan ve boş araç detayı, alt pencere, gezinti; yakıt hesabı, tema, paylaşma, derin bağlantı | Yalnızca tanım |
| `99-init` | Olay bağlama, açılış ekranı, tema, kısayollar, geri tuşu, `initCloud()` çağrısı | **En sonda** çalışır, her şey tanımlıdır |

**Kural:** Üst düzeyde *çalışan* kod (try, if, ifade çağrısı) yalnızca `01-state`, `02-core` ve `99-init` içinde olabilir. Diğer modüller yalnızca `function` ve `const` tanımlar. Böylece yükleme sırası sorunları (henüz tanımlanmamış değişken) bu üç dosyaya sınırlı kalır.

## 3. Çizim deseni

1. Durum değişkenleri (`01-state`) değişir.
2. `render()` o anki `tab` için `#main.innerHTML` yazar (ekran HTML'i şablon dizgisi olarak üretilir) ve ardından olayları `querySelectorAll("[data-xx]").forEach(b => b.onclick = ...)` ile bağlar.
3. Alt pencereler (`openLoad`, `openFilter`, `openStats` gibi `open*` işlevleri) `#sheetBody.innerHTML` doldurur ve `#sheet`'e `open` sınıfı ekler. `closeSheet()` kapatır. Geri tuşu bu açılışı izler (`99-init`).
4. Küçük HTML parçaları `*Card()`, `*HTML()` işlevleridir ve `render()` ya da başka bir ekran tarafından birleştirilir.
5. `render()` her çağrıda `innerHTML`'i yeniden yazar, bu yüzden yazılmakta olan form silinir. Arka plandan gelen güncellemelerde `render()` yerine `soft()` kullan (İlan ver sekmesinde çizmez).

Olay öznitelikleri tek yerde değil, bağlayan işlevin yanındadır. Çakışmaya dikkat: `data-md` (liste kipi), `data-md2` (ilan sil), `data-st2` (istatistik), `data-ft` (öne çıkar). Yeni bir öznitelik seçmeden önce `grep` ile ara.

## 4. Bulut ve yerel mod

- `cloud` bayrağı. `claude.use("db")` varsa (Claude önizlemesi) bulut, yoksa yerel mod (Vercel dahil).
- Yazma: `if (cloud) dbw(db.doc(...).set(...))`. Okuma: `initCloud()` canlı dinler ve diziler (`loads`, `trucks`, `offers`...) yeniden kurulur.
- **Yerel modda hiçbir şey bozulmamalı.** Yeni özellik bulut yoksa da çalışmalı (gerekirse örnek veriyle, "Örnek veri" etiketiyle).
- Koleksiyonlar ve alanlar: `HANDOFF.md` bölüm 5. Kullanılan koleksiyonlar `npm run map` çıktısında listelenir.

## 5. Güvenlik kuralları (bozma)

- Başka kullanıcıdan gelen her metin güvensizdir. Buluttan gelen belgeler `clean()` ile kaçışlanır. İç içe alanlar (`items`), resimler (`img`) ve adlar gösterirken `esc`, `imgOk`, `itemsTxt` ile ayrıca temizlenir. Yeni alan eklersen aynısını yap ve `tests/unit/shell.test.js` içindeki güvenlik testine ekle.
- Premium ve öne çıkarma şu an **istemci tarafında**, test modunda. Gerçekte sunucu belirlemeli (bkz. `HANDOFF.md` bölüm 7 ve 14).

## 6. Stil (CSS) düzeni

- `01-theme`: renk değişkenleri (açık ve koyu tema) ve temel stiller. Yeni renk eklersen hem açık hem koyu tanıma ekle (`prefers-color-scheme` ve `data-theme="dark"`).
- `02-ui`: sayfa iskeleti (üst bar, alt menü, alt pencere) ve ortak bileşenler (çip, düğme, kart, etiket).
- `03-features`: özellik stilleri, bölüm başlıklarıyla ayrılmış (ilan listesi ve formlar, teklifler, profil, premium ve öne çıkan, istatistik ve hesap, açılış ekranı).
- `04-motion-responsive`: animasyonlar, hareket azaltma ve dar ekran düzeltmeleri. **En sonda** olmalı ki diğer kuralları ezebilsin.
- Aynı öğeyi hem geniş hem dar ekranda değiştiren kuralı `04-motion-responsive`'e koy. `!important` kullanma, dosya sırasına güven.
- Renkleri sabit yazma, `var(--ink)` gibi değişken kullan. Koyu temanın `--bg` değeri `#101722` sabitini `isDark()` kullanır, değiştirirsen birlikte güncelle.

## 7. Yeni özellik ekleme kontrol listesi

1. Küçük bir ekleme ise ilgili modülün uygun bölümüne ekle. Yeni bir özellik alanıysa `npm run new -- ad "Başlık" "Açıklama"` ile modül ve test iskeletini oluştur.
2. Gerekli durumu `01-state.js` içinde ilgili gruba ekle. Kalıcı olacaksa `save()` / `savePrefs()` ve geri yüklemeyi (`02-core`) güncelle.
3. Ekranı `*Card()` ve `open*()` işlevleriyle yaz, olayları ilgili ekranın bağlayıcısına ekle (`render()` veya `listBind()`).
4. Bulutta veri gerekiyorsa `02-core.js` içindeki bulut bölümünü ve `docs/HANDOFF.md` bölüm 5'i güncelle. Yerel mod davranışını da tanımla.
5. Stil gerekiyorsa `src/css/03-features.css` içinde ilgili bölüme ekle (dar ekran kuralları `04-motion-responsive.css` içine).
6. `tests/unit/app.test.js` içine test yaz (yeni modül açtıysan iskelet testi doldur). Gerçek tarayıcıda bir akış gerekiyorsa `tests/e2e.py`'ye ekle.
7. `npm run bundle`, `npm test`, `npm run test:e2e`, görsel değişiklikte `npm run test:shots`.
8. İlgili belgeleri (`README.md`, `docs/HANDOFF.md`) güncelle.

## 8. Yayın akışı

`src/` düzenle → `npm run bundle` → `npm test` → `index.html`'i ve `src/`'yi birlikte commit et → GitHub'a gönder → Vercel `index.html`'i olduğu gibi yayınlar (derleme komutu yok; `src/`, `tools/`, `tests/`, `docs/` yayına gitmez, bkz. `.vercelignore`).
