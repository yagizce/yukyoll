# HANDOFF: NakGo (Opus için devir notu)

Bu dosya, projeyi devralacak yapay zekâ asistanı (Opus) ve geliştirici için yazıldı. Önce bu dosyayı, sonra `README.md`'yi oku, ardından `npm test` çalıştır.

## 1. Ürün
NakGo, yük sahipleri ile taşıyıcıları (tır, kırkayak, kamyon, kamyonet, panelvan, tanker, lowbed, konteyner) buluşturan, **telefon ekranı için tasarlanmış** bir yük pazarı. Yükal ve Qmove gibi uygulamalardan esinlenildi. Türkiye'de, Türkçe kullanılacak. Şu an **geliştirme/prototip aşaması**: arayüz ve akışlar tamam, gerçek giriş, ödeme ve gerçek veritabanı yok.

## 1b. Marka
- Adı **NakGo** (eski çalışma adı YükYol, kodda kalmadı). Renkler ve kullanım kuralları `docs/MOBIL-VE-MARKA.md` içindedir.
- Logo (v2): gradyanlı amber zemin üzerinde lacivert tır; kasasında ">>" okları ("Go"), ayrı kabin (cam, far, egzoz), üç tekerlek (arkada tandem), altta kesikli yol çizgisi.
- Tek kaynak `tools/logo.py` (`npm run logo`). Başlıktaki ve açılış ekranındaki logo, çizimin `src/index.template.html` içine gömülü kopyalarıdır (maske kimlikleri `mkh` ve `mks`). Logoyu değiştirirsen betikteki `truck()` ile bu iki kopyayı (`src/index.template.html`) birlikte güncelle.
- localStorage anahtarları (`yy2`, `yy-seen`, `yy-onb`, `yy-role`, `yy-theme`) eski adın kısaltmasıdır, verileri silmemek için bilerek değiştirilmedi.
- Açılış ekranı (splash): `#splash`. Oturum başına bir kez ~1,5 sn gösterilir (`sessionStorage` anahtarı `ng-splash`), hareket azaltma tercihinde kısa ve hareketsizdir.

## 2. Ürün sahibinin kararları ve tercihleri (bunlara uy)
- Dil: arayüz ve tüm metinler Türkçe. Sade, kısa cümleler.
- **Görsel temizlik önceliklidir.** Gereksiz detay yok, sade ve şık. Eski ekranlar sadeleştirildi (örnek: Hesap ekranı sonuç odaklı, ayarlar "Diğer ayarlar" altında gizli).
- Araç tipi çipleri liste üstünde **durmaz**, yalnızca Filtre ekranında yer alır.
- Yakıt hesabı ana sayfada kart olarak durur, alt menüde sekme değildir.
- Tema düğmesi **yazısız**, yalnızca ay/güneş simgesidir ve **üst barda** (zilin yanında) durur, profilde yoktur.
- Premium üyelik: **aylık 299 ₺, yıllık 3.099 ₺**. Yalnızca **doğrudan arama** Premium'dur. Mesajlaşma ücretsizdir.
- Rozetler: "✓ Belgeli" (kişinin beyanı) ve "✓ Onaylı" (yönetici onayı). "Onaylı" ifadesi yalnızca gerçekten onaylanmışsa kullanılır.
- **Şimdilik kapsam dışı (kullanıcı en sona bıraktı):** ödeme, gerçek giriş/üyelik, Supabase, KVKK. Bunlara kendiliğinden başlama; ürün sahibi söyleyince yap.
- Dağıtım: GitHub'a yüklenip **Vercel**'de statik site olarak yayınlanacak.

## 3. Dosyalar ve komutlar
Klasör ağacı `README.md` içindedir (toplam 36 dosya). **Önce `docs/ARCHITECTURE.md`'yi oku**: modül düzeni, yükleme sırası, çizim deseni ve "yeni özellik ekleme kontrol listesi" orada. Dosya ve işlev listesi için `npm run map`.

| Yol | Görev |
|---|---|
| `src/` | **Kaynak.** `src/js/NN-ad.js` (9 betik modülü, bölümlere ayrılmış), `src/css/NN-ad.css` (4 stil dosyası), `src/index.template.html` (HTML iskeleti). Düzenlenen yer burasıdır |
| `index.html` | `src/`'den **üretilir** (`npm run bundle`), yayına giden tek parça dosya. Elle düzenleme, `npm test` bunu yakalar. Commit'e dahil edilir |
| `sw.js` | Servis çalışanı: önce ağ, ağ yoksa kayıtlı kopya. https ve localhost'ta kaydolur, Claude adresinde kaydolmaz |
| `manifest.webmanifest`, `icons/` | Ana ekrana eklenebilir uygulama ve simgeler |
| `vercel.json`, `.vercelignore` | Güvenlik başlıkları; `src/`, `tools/`, `tests/`, `docs/`, `export/` ve README yayına gitmez |
| `tools/` | `bundle.js` (birleştirir), `dev.js` (lint, map, new, www komutları), `logo.py` (logo ve simge üretici) |
| `tests/` | `run.js` (hızlı testler, sahte DOM) + `unit/app.test.js`, `unit/platform.test.js`; `e2e.py` (gerçek Chromium, `--shots` ile ekran görüntüsü) |
| `docs/` | `ARCHITECTURE.md`, `HANDOFF.md` (bu dosya), `MOBIL-VE-MARKA.md` (logo, renkler, Capacitor ayarı ve mağaza notları) |
| `export/` (git dışı) | `npm run logo` ile üretilen logo çıktıları (svg, png) ve mobil görseller. Ayrı "görseller" paketi olarak verilir |

- Komutlar: `npm run bundle`, `npm test` (bundle kontrolü + lint + hızlı testler), `npm run test:e2e`, `npm run test:all`, `npm run test:shots`, `npm run lint`, `npm run map`, `npm run new -- ad "Başlık" "Açıklama"`, `npm run logo`, `npm run mobile:prepare`, `npm start`.
- **Her değişiklikte:** `src/`'yi düzenle → `npm run bundle` → `npm test` → `npm run test:e2e`. Görsel değişiklikte `npm run test:shots` ile görüntülere bak (390×844).
- Yayın: GitHub → Vercel "Other" preset, **build komutu yok** (`package.json`'a `build` adlı komut ekleme, Vercel çalıştırır). Commit'e `index.html` ve `src/` birlikte girer.
- Aynı dosya Claude'un artifact ortamında da yayınlanır. Orada `claude.use("db")` ile ortak veritabanı çalışır. Vercel'de `claude` yoktur, uygulama **yerel moda** (localStorage) düşer. Bu davranışı bozma.

## 4. Mimari özeti
Ayrıntı `docs/ARCHITECTURE.md` içinde. Kısaca:
- Çerçevesiz, tek betik kapsamı. Modüller dosya adındaki sıraya göre birleşir; `01-state` tüm `let` durumunu ve örnek veriyi, `99-init` en sonda çalışan başlatmayı içerir. Üst düzeyde çalışan kod yalnızca `01-state`, `02-core`, `99-init` içinde olabilir (`npm run lint` uyarır).
- **Çizim:** `render()` (`30-screens`) `#main`'e `innerHTML` yazar ve olayları bağlar; alt pencereler `open*()` işlevleriyle `#sheetBody`'yi doldurur. Arka plan güncellemelerinde `soft()` kullan (İlan ver formu silinmesin).
- **Kayıt:** `save()` (`02-core`) her `render()`'da localStorage `yy2`'ye yazar; bulutta `savePrefs()` tercihleri (`favs, calc, alerts, blocked`) `data/users/<id>/prefs`'e yazar.
- **Bulut/yerel:** `cloud` bayrağı; yazma `if(cloud)dbw(...)`; okuma `initCloud()` (`02-core`) canlı dinler.
- **Tema:** renk değişkenleri `src/css/01-tokens.css` içinde, koyu tema iki yerde (`prefers-color-scheme` ve `data-theme="dark"`).

## 5. Veri modeli (koleksiyon: alanlar) ve Supabase eşleşmesi
| Koleksiyon | Alanlar | Önerilen tablo |
|---|---|---|
| `loads` | featFrom, featUntil, featPaid, featWin (öne çıkarma), id, from, to, cargo, ton, veh, body, pay, price, date, note, km, owner/uid, phone, img (küçük jpeg data URL), items[{n,q,u}], closed, ts | `loads` |
| `trucks` | id, uid, from, to, veh, cap, body, date, phone, closed, ts, verified/approved (örnek veri) | `trucks` |
| `offers` | belge adı `<loadId>_<bidderUid>`: loadId, bidder, ownerUid, offer, status(wait/ok/counter/no), counter, stage(0-3), ts | `offers` |
| `msgs` | k (`o<loadId>_<bidder>`), uid, t, ts | `messages` |
| `carriers` | doc id = uid: phone, lic, src, kb, ruh, docs{src,kb,ruh}, ok | `carriers` |
| `approvals` | doc id = uid: ok (yalnızca yönetici yazar) | `approvals` |
| `carrierDocs/<uid>/files/<tür>` | img (jpeg data URL) | Storage kovası, özel |
| `pods/<loadId>_<bidder>` | img (teslim fotoğrafı) | Storage kovası |
| `ratings` | k, to, by, stars, text, ts | `ratings` |
| `premium/<uid>` | until, plan | `subscriptions` (yalnızca sunucu yazar) |
| `events/<tür>_<ilanId>_<uid>` | t (v görüntüleme, s kayıt, sh paylaşım, c arama isteği), loadId, uid, ts | `listing_events` |
| `reports` | kind(l/t/u: ilan/boş araç/kullanıcı), tid, reason, note, by, ts | `reports` |
| `data/users/<uid>/prefs` | favs, calc, alerts, blocked | `profiles.prefs` jsonb |

`stage`: 0 Kabul, 1 Yüklendi, 2 Teslim edildi (fotoğraflı), 3 Yük sahibi onayladı.

## 6. Özellik durumu
**Tamam (arayüz + akış):** öne çıkan ilan ve boş araç ilanı (sabit fiyat listesi, bkz. bölüm 14), ilan istatistikleri (yük sahibi: görüntülenme, teklif, kaydeden, paylaşım, arama isteği, teklif oranı, 7 günlük grafik ve öneriler; bulutta `events` koleksiyonundan, yerel modda örnek veri), ilan listesi, filtre (araç/kasa/şehir/tonaj/ücret/ödeme/gün/puan/kayıtlı/belgeli), 81 il, boş araç ilanları, ilan verme (kalemler, fotoğraf, fiyat önerisi), harita üzerinde rota, piyasa fiyatı karşılaştırma, yakıt hesabı, teklif ve karşı teklif, mesajlaşma, teslim kanıtı, puan/yorum, dönüş yükü önerisi, rota alarmı, bildirimler, ilan düzenle/kapat/sil, ilan ve teklif süresi (yük 14 gün, boş araç 7 gün, teklif 3 gün), favoriler, belge rozeti ve yönetici onayı, Premium arama kapısı, paylaşma (derin bağlantı `#l=<id>`), ilk açılış tanıtımı, şikayet/engelleme/yardım, yükleniyor/çevrimdışı/hata durumları, herkese açık profil sayfası (yorumlar, aktif ilan, teslim sayısı), taşıyıcı "Kazancım" özeti, liste sayfalama (20'şerli) ve puana göre sıralama, tema tercihinin kalıcılığı, temel erişilebilirlik (dialog rolü, Escape, aria-live, klavyeyle kaydet), çevrimdışı açılış (servis çalışanı), "Yakınımda" (tarayıcı konumu, il merkezine kuş uçuşu mesafe, 100/250/500 km yarıçap; konum saklanmaz, sunucuya gitmez), iki ilanı yan yana karşılaştırma (ilan detayında "Karşılaştır", en iyi değerler yeşil), taşıyıcı için son 8 haftalık kazanç grafiği (`doneAt` teslim onay zamanı).
**Simüle:** örnek ilanlara verilen teklifler uygulama içinde yanıtlanır (`simulate`), örnek ilanların teslimi otomatik onaylanır, satın alma (`openPaywall` içindeki `buy`) gerçek ödeme almaz.
**Yok:** gerçek giriş, ödeme/abonelik, push bildirim, gerçek harita/mesafe, çok dilli arayüz, tam erişilebilirlik denetimi (sheet açılınca odak yönetimi ve odak kapanı yok, kontrast ölçülmedi).

## 7. Güvenlik ve mahremiyet: dikkat
- **Premium kontrolü yalnızca arayüzde.** Telefon numaraları `loads/trucks/carriers` belgelerinde herkesin okuyabileceği alanda durur; üyelik bilgisi (`prem`) kullanıcının kendi tarayıcısında değiştirilebilir. Gerçekte: üyelik sunucuda ödeme webhook'uyla yazılmalı, numara yalnızca aktif üyeye sunucudan verilmeli.
- Ortak veritabanında varsayılan kurallar nedeniyle her yazıcı başkasının ilanını/teklifini değiştirebilir. Gerçek ürün: satır bazlı güvenlik (RLS), "yalnızca sahibi yazar".
- **Başka kullanıcıdan gelen her metin güvensizdir.** `clean()` üst düzey metinleri kaçışlar; iç içe alanlar (`items`), resimler (`img`) ve adlar gösterirken ayrıca kontrol edilir (`esc`, `imgOk`, `itemsTxt`). Yeni bir alan eklersen aynı kuralı uygula ve `tests/run.js` içindeki güvenlik testine ekle.
- Belge ve teslim fotoğrafları küçük jpeg data URL olarak belgede durur (≤ 170 KB). Gerçekte özel Storage + imzalı bağlantı gerekir.
- İlan istatistikleri için `events` koleksiyonu da kayıtlı herkesin okuyabildiği alandadır (içinde kim baktığı bilgisi vardır). Gerçekte yalnızca ilan sahibi kendi ilanının sayılarını görmeli, kimlikler tutulmamalı veya gizlenmeli. Şikayetler de aynı şekilde yönetici dışında okunmamalı.
- Şikayetler şu an kayıtlı herkesin okuyabildiği koleksiyonda. Gerçekte yalnızca yönetici okumalı.
- KVKK (aydınlatma metni, açık rıza, silme hakkı), kullanım sözleşmesi, yük aracılığı için gereken yetki belgeleri ve UETDS yükümlülüğü **henüz ele alınmadı**; hukuk danışmanıyla netleştirilmeli.

## 8. Tuzaklar (bozma)
- `isDark()` koyu tema arka planını **`#101722`** sabitiyle anlar. Koyu `--bg` rengini değiştirirsen `isDark` ve test bozulur.
- Betik tek kapsamdır: iki dosyada aynı ad tanımlanamaz (örnek: `BASE` harita gövdesi, `APPURL` paylaşım bağlantısı ayrı adlardır). `npm run lint` çakışmayı yakalar.
- Veri öznitelikleri: `data-md` (liste kipi) ile `data-md2` (ilan sil) farklıdır. `data-ro` rol, `data-rc` şikayet kapat, `data-ub` engel kaldır, `data-sg/sp/sv` teslim aşamaları.
- `B12` + `D` yalnızca ilk 12 şehir için elle girilmiş gerçek mesafe tablosudur; diğer çiftler `LL` koordinatlarından kuş uçuşu × 1,3 ile **yaklaşık** hesaplanır. Gerçek yol mesafesi için harita servisi gerekir.
- Mazot fiyatı varsayılanı 95 ₺/L (4 Ekim 2026, İstanbul) ve piyasa karşılaştırması yalnızca uygulamadaki ilanlardan hesaplanır.
- Örnek ilan telefonları sahte (`0000 000 00 xx`). `SUPPORT_MAIL="destek@example.com"` yer tutucudur.
- localStorage anahtarları: `yy2` (veri), `yy-seen` (okunan bildirimler), `yy-onb` (tanıtım görüldü), `yy-role` (rol), `yy-theme` (tema).
- Servis çalışanı eski sürümde takılı kalmasın diye ağ öncelikli çalışır. `sw.js` içindeki `V` sürüm adını önbellek yapısını değiştirdiğinde artır. Vercel'de `sw.js` için `no-cache` başlığı vardır.
- Profil sayfasındaki yorum metni bulutta `clean()` ile kaçışlıdır, yerel modda gösterirken `esc` uygulanır. Bu ayrım bozulursa çift kaçış veya XSS olur.
- Artifact ve Vercel yayını tek parça `index.html` bekler. Kaynak `src/` altında bölünmüştür ve `npm run bundle` tek dosyaya birleştirir, bu yüzden `index.html`'i elle değiştirme.
- `render()` her çağrıda `innerHTML` yeniden yazdığı için yazılan formlar silinir. Form içindeki alanları etkileyecek yerde `soft()` veya hedefli güncelleme kullan.

## 9. Opus için öncelikli yapılacaklar (ürün sahibi onayından sonra)
1. **Gerçek giriş ve veritabanı (Supabase):** telefon + SMS doğrulama (Netgsm, İleti Merkezi veya Twilio Verify), yukarıdaki tablolar, RLS kuralları, rol ve yönetici ayrımı. Önce `db` çağrılarını tek bir `data` nesnesinin arkasına topla (aşağıdaki satır listesi), sonra Supabase istemcisini bağla.
2. **Premium'u sunucuya taşı:** abonelik tablosu, ödeme sağlayıcısı (iyzico/PayTR/Stripe) webhook'u, numaranın yalnızca aktif üyeye sunucudan verilmesi, süre dolunca uyarı/yenileme, aylık planın yinelenen ödeme olması.
3. **Güvenli dosya depolama:** belge ve teslim fotoğrafları için özel kova, imzalı bağlantı, boyut ve tür doğrulama; yönetici paneli (ayrı web sayfası).
4. **Gerçek harita ve mesafe:** Google Distance Matrix, Mapbox veya OpenRouteService; süre ve otoyol ücreti; piyasa fiyatı için gerçek veri.
5. **Bildirimler:** push (FCM / web push), WhatsApp bildirimi; sonra Flutter veya React Native ile mağaza uygulaması.
6. **Hukuk/KVKK:** metinler, rıza akışı, veri silme, kayıt tutma.
7. **Kalite:** gerçek tarayıcı testleri (Playwright), erişilebilirlik (kontrast, odak, ekran okuyucu), performans (liste sayfalama, 1000+ ilan), çok sayıda ilanda arama.
8. **Kod kalitesi:** kaynak modüllere bölünmüştür (`src/`). Sıradaki adımlar: ES modüllerine veya bir derleyiciye (örneğin Vite) geçiş, durum yönetimini sadeleştirme (her çağrıda tüm ekranı yazan `render()` yerine hedefli güncelleme), tip denetimi (JSDoc veya TypeScript).

## 10. Test notları
`npm test` mantığı kontrol eder; görünümü kontrol etmez. Görünüm için `npm run test:shots` ile ekran görüntüsü al (390×844). Gerçek cihaz testi yine gereklidir.

## 10b. Gerçek cihaz test listesi (ürün sahibi yapacak)
- iPhone Safari ve Android Chrome: tüm sekmeler, kaydırma, klavye açılınca form, yazı alanına dokununca yakınlaşma olmaması.
- Fotoğraf: ilan fotoğrafı, belge fotoğrafı, teslim fotoğrafı (kameradan çekme dahil).
- Arama: Premium'da "Şimdi ara" gerçekten `tel:` açıyor mu, Premium değilken üyelik ekranı çıkıyor mu.
- Paylaş menüsü ve `#l=<id>` bağlantısıyla ilan açma.
- Koyu/açık tema, 320 px genişlik, yatay döndürme.
- Çevrimdışı uyarısı (uçak modu), yenileyince verilerin korunması.
- Ana ekrana ekleme (PWA) ve simge.
- İki farklı hesapla (bulut sürümünde): teklif, karşı teklif, kabul, mesaj, teslim, puan.

## 12. Mobil entegrasyon
Ayrıntı ve adımlar `docs/MOBIL-VE-MARKA.md` içindedir. Özet:
- Web tarafı hazır: güvenli alanlar **başlıkta ve alt menüde** uygulanır (`header` üst boşluğu, `nav` alt boşluğu; kök `:root` üzerinde değil, böylece lacivert başlık durum çubuğunun altına uzanır), `viewport-fit=cover`, `theme-color` (tema değişince `updTheme()` günceller), iOS meta etiketleri, `overscroll-behavior:none`, `touch-action:manipulation`.
- **Geri tuşu:** alt pencere açılınca `history.pushState` eklenir, geri tuşu (`popstate`) pencereyi kapatır; kod pencereyi kapatınca durum geri alınır. `#sheet` üzerindeki `MutationObserver` bunu yönetir. Yeni bir tam ekran katman eklersen aynı deseni uygula.
- `isNative()` Capacitor'ı algılar: yerel kabukta servis çalışanı kaydolmaz, açılış ekranı kısa tutulur, "Ana ekrana ekle" kartı gizlenir.
- Ana ekrana ekleme: Android/Chrome'da `beforeinstallprompt` yakalanır (profilde kart), iOS'ta Safari yönergesi gösterilir.
- Kısayollar: manifest `shortcuts` ve `?go=post|mine|near`.
- Yapılacak (yerel katman): Capacitor eklentileri (konum, kamera, paylaşma, geri tuşu, derin bağlantı), push bildirim (FCM/APNs + sunucu), Universal/App Links dosyaları, hesap silme akışı, mağaza uygulama içi satın alma.
- Mağaza kuralları: Premium gibi uygulama içi dijital abonelik mağazalarda genellikle Apple/Google satın alma sistemiyle satılmak zorundadır ve komisyon kesilir (genelde %15–30). Fiyatlandırma buna göre yeniden düşünülmeli. Kuralları yayından önce güncel haliyle oku.

## 13. Gelir modeli notları (karar için, kodda yok)
Ürün sahibi gelir potansiyelinden emin değil, bu bölüm tartışma notudur.
- **Mevcut:** taşıyıcıya Premium (doğrudan arama) 299 ₺/ay, 3.099 ₺/yıl. Test modunda.
- **Aday gelir kalemleri:** (1) tamamlanan işten komisyon (ödeme güvencesi ile birlikte mümkün), (2) öne çıkan ilan (yük sahibi öder), (3) doğrulama/"Onaylı" rozeti ücreti, (4) taşıyıcı aboneliği (yük bulma), (5) ortaklıklar: yakıt kartı, sigorta, fatura finansmanı, araç bakım.
- **Asıl risk teknik değil pazar:** iki taraflı pazarda ilk günlerde yeterli yük ve yeterli taşıyıcı olmazsa kimse ödemez; Yükal gibi yerleşik rakipler var; mağaza komisyonu geliri düşürür.
- **Öneri:** büyük geliştirme yerine küçük bir pilotla ölç: tek güzergâh, 20–30 taşıyıcı, birkaç yük sahibi. İzlenecek ölçütler: haftalık aktif taşıyıcı, ilan başına teklif sayısı, teslime ulaşan iş oranı, Premium'a ödeme yapmaya razı olan taşıyıcı yüzdesi.

## 14. Öne çıkan ilan ve boş araç ilanı: fiyatlandırma
Yük sahibi ilanını, taşıyıcı boş araç ilanını listenin en üstüne "Öne çıkan" etiketiyle çıkarabilir (İlanlarım → Öne çıkar / Uzat). Reklam olduğu etiketle belirtilir. Yük ve boş araç listelerinde öne çıkanlar kendi içinde sıralamayı koruyarak en üstte yer alır.
- **Fiyat sabittir, saate göre değişmez** (ürün sahibi gece/gündüz farkını istemedi). Liste `FEAT.prices` içinde, yük (`l`) ve boş araç (`t`) için ayrı tutulur (şimdilik aynı): 3 saat 19 ₺, 6 saat 32 ₺, 12 saat 61 ₺, 24 saat 99 ₺, 3 gün 267 ₺ (günlük 89 ₺, yaklaşık %10 indirim).
- **Uzatma:** aktif öne çıkarma varken yeni süre onun bitişinden başlar, `featUntil` uzar.
- **Veri:** ilan/boş araç belgesinde `featFrom`, `featUntil` (ms), `featPaid` (toplam ödenen ₺). Aktiflik `isF()` ile hesaplanır.
- **Test modu:** ödeme alınmaz ve süreyi istemci yazar. Gerçekte ödeme onayından sonra sunucu `featUntil` yazmalı, fiyatı da sunucu belirlemeli (istemcideki fiyat listesine güvenme).
- **Yerel demo:** yerel modda 8 numaralı örnek ilan ve `t2` örnek boş araç ilk açılıştan 6 saat öne çıkarılmış gelir.
- **Etki ölçümü:** ilan istatistiği ekranında "Öne çıkarmanın etkisi" kutusu ve profilde "Öne çıkarma özeti" (toplam harcama, öne çıkan ilan sayısı, ortalama ilgi artışı) vardır. Hesap `featEffect()`: öne çıkarılan saatlerdeki saatlik benzersiz görüntülenme, ilanın diğer saatlerindeki saatlik görüntülenmeyle karşılaştırılır; öne çıkarma sırasında gelen teklifler de sayılır. `featWin` alanı her satın almanın `[başlangıç, bitiş]` aralığını (en son 10) tutar. **Sınırlar:** yalnızca yük ilanları için (boş araç ilanı görüntülenmesi izlenmiyor); her izleyici için tek `events` kaydı tutulduğundan ts, o kişinin son görüntülemesidir (kaba bir ölçü); en az 3 saat öne çıkarılmış, 3 saat normal geçmiş ve 8 görüntülenme yoksa sonuç gösterilmez; karşılaştırma neden-sonuç kanıtı değildir (günün saati, yük türü gibi etkenler karışabilir). Yerel modda sayılar örnek veridir ve öyle etiketlenir.
- **Doğrulama önerisi:** fiyatı A/B ile dene (örneğin 49 / 99 / 149 ₺ günlük), ödemeye razı olan oranı ve öne çıkarmanın görüntülenme/teklif etkisini (`events` + istatistik ekranı) ölç. Fiyat listesi tek yerde olduğu için değiştirmek kolaydır. Gelecekte olası: hafta sonu veya yoğun saat fiyatı, ilk öne çıkarmaya deneme indirimi, taşıyıcı ve yük sahibi için farklı fiyat.

## 11. Kod haritası
Dosya, işlev, depolama anahtarı ve koleksiyon listesi için `npm run map` çalıştır (çıktıyı ekrana yazar, satır numarası tutmaz).
