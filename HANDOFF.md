# HANDOFF: NakGo (Opus için devir notu)

Bu dosya, projeyi devralacak yapay zekâ asistanı (Opus) ve geliştirici için yazıldı. Önce bu dosyayı, sonra `README.md`'yi oku, ardından `npm test` çalıştır.

## 1. Ürün
NakGo, yük sahipleri ile taşıyıcıları (tır, kırkayak, kamyon, kamyonet, panelvan, tanker, lowbed, konteyner) buluşturan, **telefon ekranı için tasarlanmış** bir yük pazarı. Yükal ve Qmove gibi uygulamalardan esinlenildi. Türkiye'de, Türkçe kullanılacak. Şu an **geliştirme/prototip aşaması**: arayüz ve akışlar tamam, gerçek giriş, ödeme ve gerçek veritabanı yok.

## 1b. Marka
- Adı **NakGo** (eski çalışma adı YükYol, kodda kalmadı). Renkler ve kullanım kuralları `brand/README.md` içindedir.
- Logo (v2): gradyanlı amber zemin üzerinde lacivert tır; kasasında ">>" okları ("Go"), ayrı kabin (cam, far, egzoz), üç tekerlek (arkada tandem), altta kesikli yol çizgisi.
- Tek kaynak `brand/generate.py`. Başlıktaki ve açılış ekranındaki logo, çizimin `index.html` içine gömülü kopyalarıdır (maske kimlikleri `mkh` ve `mks`). Logoyu değiştirirsen betikteki `truck()` ile bu iki kopyayı birlikte güncelle.
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
Klasör yapısı `README.md` içinde ağaç olarak verilmiştir. Özet:

| Yol | Görev |
|---|---|
| `index.html` | Uygulamanın tamamı (CSS + JS + örnek veri). **Tek dosya** |
| `sw.js` | Servis çalışanı: önce ağ, ağ yoksa kayıtlı kopya. https ve localhost'ta kaydolur, Claude adresinde kaydolmaz |
| `manifest.webmanifest`, `icons/` | Ana ekrana eklenebilir uygulama ve simgeler |
| `vercel.json`, `.vercelignore` | Güvenlik başlıkları; `brand/`, `tests/` ve belgeler yayına gitmez |
| `mobile/` | Android/iOS kabuğu (Capacitor) şablonu, `prepare-web.js`, simge ve splash görselleri, mağaza kontrol listesi. Yayına gitmez |
| `brand/` | Logo kaynakları: `generate.py` her şeyi üretir (`icons/` dahil) |
| `tests/run.js` | Hızlı testler (Node, sahte DOM) |
| `tests/e2e.py` | Gerçek Chromium ile uçtan uca test (Playwright) |
| `tests/shots.py` | Ekran görüntüsü alır, görsel kontrol içindir |

- Komutlar: `npm start`, `npm test`, `npm run test:e2e`, `npm run test:shots`, `npm run logo`.
- **Her değişiklikten sonra `npm test` ve `npm run test:e2e` çalıştır.** Görsel değişiklikte `npm run test:shots` ile görüntülere de bak (390×844).
- Yayın: GitHub → Vercel "Other" preset, build komutu yok.
- Aynı dosya Claude'un artifact ortamında da yayınlanır. Orada `claude.use("db")` ile ortak veritabanı çalışır. Vercel'de `claude` yoktur, uygulama **yerel moda** (localStorage) düşer. Bu davranışı bozma.

## 4. Mimari (tek dosya, çerçevesiz)
- Durum, betiğin üstündeki global `let` değişkenlerdedir: `loads, trucks, offers, incoming, chats, rates, alerts, favs, blocked, reports, myCar, prem, carriers, appr, calc, F (filtre), tab, mode, postMode, role, cloud, me, db`.
- **Çizim:** `render()` o anki `tab` için `#main` içine `innerHTML` yazar, ardından olayları `querySelectorAll(...).forEach(b=>b.onclick=...)` ile bağlar. Alt pencere (sheet) için `#sheetBody` kullanılır: `openLoad`, `openTruck`, `openFilter`, `openCalc`, `openPaywall`, `callTo`, `openRate`, `openReport`, `openBell`, `openChat` hepsi bunu doldurup `#sheet`'e `open` sınıfı ekler. `closeSheet()` kapatır.
- Sekmeler: `list` (İlanlar), `post` (İlan ver), `mine` (Tekliflerim), `me` (Profil). Liste iki kipli: `mode="load"` (yükler) / `"truck"` (boş araçlar).
- **Kaydetme:** `save()` her `render()`'da çağrılır. localStorage `yy2` anahtarına yazar. Bulut modunda `savePrefs()` kullanıcıya özel tercihleri (`favs, calc, alerts, blocked`) `data/users/<id>/prefs` belgesine yazar.
- **Bulut/yerel ayrımı:** `cloud` bayrağı. Yazma çağrıları `if(cloud)dbw(db.doc(...).set(...))` biçimindedir; `dbw` yazma hatasında uyarı verir. Okumalar betiğin sonundaki `(async()=>{...claude.use("db")...})()` bloğunda canlı dinlenir (`onSnapshot`). Gelen veri `clean()` ile kaçışlanır.
- **`soft()`**: bulut güncellemeleri `soft()` ile çizer; `post` sekmesinde formu silmemek için o sekmede çizmez. Yeni dinleyicilerde `render()` yerine `soft()` kullan.
- Tema: CSS değişkenleri `:root`'ta, koyu tema iki yerde (`prefers-color-scheme` ve `data-theme="dark"`). Yeni renk eklersen üç yere de ekle.

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
- İki ayrı sabit var: `BASE` (harita SVG gövdesi) ve `APPURL` (paylaşım bağlantısı). Karıştırma.
- Veri öznitelikleri: `data-md` (liste kipi) ile `data-md2` (ilan sil) farklıdır. `data-ro` rol, `data-rc` şikayet kapat, `data-ub` engel kaldır, `data-sg/sp/sv` teslim aşamaları.
- `B12` + `D` yalnızca ilk 12 şehir için elle girilmiş gerçek mesafe tablosudur; diğer çiftler `LL` koordinatlarından kuş uçuşu × 1,3 ile **yaklaşık** hesaplanır. Gerçek yol mesafesi için harita servisi gerekir.
- Mazot fiyatı varsayılanı 95 ₺/L (4 Ekim 2026, İstanbul) ve piyasa karşılaştırması yalnızca uygulamadaki ilanlardan hesaplanır.
- Örnek ilan telefonları sahte (`0000 000 00 xx`). `SUPPORT_MAIL="destek@example.com"` yer tutucudur.
- localStorage anahtarları: `yy2` (veri), `yy-seen` (okunan bildirimler), `yy-onb` (tanıtım görüldü), `yy-role` (rol), `yy-theme` (tema).
- Servis çalışanı eski sürümde takılı kalmasın diye ağ öncelikli çalışır. `sw.js` içindeki `V` sürüm adını önbellek yapısını değiştirdiğinde artır. Vercel'de `sw.js` için `no-cache` başlığı vardır.
- Profil sayfasındaki yorum metni bulutta `clean()` ile kaçışlıdır, yerel modda gösterirken `esc` uygulanır. Bu ayrım bozulursa çift kaçış veya XSS olur.
- Artifact sürümü tek dosya ve kendine yeterli olmak zorunda. Dosyayı birden çok dosyaya bölersen Claude'daki yayın kırılır. Bölmek istersen build adımı ekleyip `index.html`'i üretmelisin.
- `render()` her çağrıda `innerHTML` yeniden yazdığı için yazılan formlar silinir. Form içindeki alanları etkileyecek yerde `soft()` veya hedefli güncelleme kullan.

## 9. Opus için öncelikli yapılacaklar (ürün sahibi onayından sonra)
1. **Gerçek giriş ve veritabanı (Supabase):** telefon + SMS doğrulama (Netgsm, İleti Merkezi veya Twilio Verify), yukarıdaki tablolar, RLS kuralları, rol ve yönetici ayrımı. Önce `db` çağrılarını tek bir `data` nesnesinin arkasına topla (aşağıdaki satır listesi), sonra Supabase istemcisini bağla.
2. **Premium'u sunucuya taşı:** abonelik tablosu, ödeme sağlayıcısı (iyzico/PayTR/Stripe) webhook'u, numaranın yalnızca aktif üyeye sunucudan verilmesi, süre dolunca uyarı/yenileme, aylık planın yinelenen ödeme olması.
3. **Güvenli dosya depolama:** belge ve teslim fotoğrafları için özel kova, imzalı bağlantı, boyut ve tür doğrulama; yönetici paneli (ayrı web sayfası).
4. **Gerçek harita ve mesafe:** Google Distance Matrix, Mapbox veya OpenRouteService; süre ve otoyol ücreti; piyasa fiyatı için gerçek veri.
5. **Bildirimler:** push (FCM / web push), WhatsApp bildirimi; sonra Flutter veya React Native ile mağaza uygulaması.
6. **Hukuk/KVKK:** metinler, rıza akışı, veri silme, kayıt tutma.
7. **Kalite:** gerçek tarayıcı testleri (Playwright), erişilebilirlik (kontrast, odak, ekran okuyucu), performans (liste sayfalama, 1000+ ilan), çok sayıda ilanda arama.
8. **Kod düzeni:** `index.html`'i `src/` altında modüllere böl (veri, çizim, özellikler), build ile tek dosya üret; Vercel build komutunu buna göre ayarla.

## 10. Test notları
`npm test` mantığı kontrol eder; görünümü kontrol etmez. Görünüm için `python3 tests/shots.py` ile ekran görüntüsü al (390×844). Gerçek cihaz testi yine gereklidir.

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
Ayrıntı ve adımlar `mobile/README.md` içindedir. Özet:
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

## 11. Kod haritası (otomatik üretildi)
`db.doc(...)` / `db.collection(...)` çağrılarının bulunduğu satırlar (veri katmanı taşınırken değiştirilecek yerler): 294, 295, 297, 323, 329, 337, 340, 369, 397, 416, 458, 459, 524, 525, 528, 530, 536, 537, 540, 543, 548, 610, 616, 651, 660, 663, 717, 718, 719, 720, 721, 722, 723

Fonksiyonlar:
- `F0` (satır 246)
- `match` (satır 250)
- `fcount` (satır 260)
- `activeChips` (satır 261)
- `rmF` (satır 262)
- `openFilter` (satır 266)
- `oup` (satır 294)
- `postTruck` (satır 295)
- `rebuild` (satır 296)
- `savePrefs` (satır 297)
- `dist` (satır 301)
- `mkt` (satır 302)
- `sugg` (satır 304)
- `mapSVG` (satır 315)
- `patchIt` (satır 323)
- `openEdit` (satır 324)
- `askDel` (satır 328)
- `openCounter` (satır 331)
- `listBind` (satır 336)
- `notifs` (satır 347)
- `bell` (satır 350)
- `openBell` (satır 351)
- `deep` (satır 358)
- `shareLoad` (satır 360)
- `openRate` (satır 366)
- `myRate` (satır 371)
- `addAlert` (satır 372)
- `setRole` (satır 375)
- `openOnb` (satır 377)
- `itemsUI` (satır 390)
- `openPaywall` (satır 393)
- `callTo` (satır 399)
- `savePhone` (satır 403)
- `openReport` (satır 414)
- `blockUser` (satır 418)
- `openProfile` (satır 425)
- `nearestCity` (satır 438)
- `toggleNear` (satır 439)
- `toggleCmp` (satır 445)
- `openCompare` (satır 447)
- `weekly` (satır 454)
- `weekChart` (satır 456)
- `track` (satır 458)
- `untrack` (satır 459)
- `statsOf0` (satır 460)
- `statTips` (satır 467)
- `openStats` (satır 474)
- `updTheme` (satır 480)
- `toggleTheme` (satır 481)
- `openFeature` (satır 495)
- `featEffect` (satır 508)
- `fxOf` (satır 512)
- `statsOf` (satır 515)
- `setStage` (satır 524)
- `shrink` (satır 526)
- `pickImg` (satır 527)
- `sendPod` (satır 528)
- `showImg` (satır 529)
- `showPod` (satır 530)
- `docPhoto` (satır 536)
- `viewDoc` (satır 537)
- `setCar` (satır 540)
- `carBind` (satır 541)
- `save` (satır 547)
- `simulate` (satır 548)
- `toast` (satır 557)
- `render` (satır 558)
- `openLoad` (satır 641)
- `openTruck` (satır 653)
- `openChat` (satır 654)
- `openCalc` (satır 667)
- `closeSheet` (satır 687)
- `setNav` (satır 689)
