# HANDOFF: YükYol (Opus için devir notu)

Bu dosya, projeyi devralacak yapay zekâ asistanı (Opus) ve geliştirici için yazıldı. Önce bu dosyayı, sonra `README.md`'yi oku, ardından `npm test` çalıştır.

## 1. Ürün
YükYol, yük sahipleri ile taşıyıcıları (tır, kırkayak, kamyon, kamyonet, panelvan, tanker, lowbed, konteyner) buluşturan, **telefon ekranı için tasarlanmış** bir yük pazarı. Yükal ve Qmove gibi uygulamalardan esinlenildi. Türkiye'de, Türkçe kullanılacak. Şu an **geliştirme/prototip aşaması**: arayüz ve akışlar tamam, gerçek giriş, ödeme ve gerçek veritabanı yok.

## 2. Ürün sahibinin kararları ve tercihleri (bunlara uy)
- Dil: arayüz ve tüm metinler Türkçe. Sade, kısa cümleler.
- **Görsel temizlik önceliklidir.** Gereksiz detay yok, sade ve şık. Eski ekranlar sadeleştirildi (örnek: Hesap ekranı sonuç odaklı, ayarlar "Diğer ayarlar" altında gizli).
- Araç tipi çipleri liste üstünde **durmaz**, yalnızca Filtre ekranında yer alır.
- Yakıt hesabı ana sayfada kart olarak durur, alt menüde sekme değildir.
- Tema düğmesi **yazısız**, yalnızca ay/güneş simgesidir.
- Premium üyelik: **aylık 299 ₺, yıllık 3.099 ₺**. Yalnızca **doğrudan arama** Premium'dur. Mesajlaşma ücretsizdir.
- Rozetler: "✓ Belgeli" (kişinin beyanı) ve "✓ Onaylı" (yönetici onayı). "Onaylı" ifadesi yalnızca gerçekten onaylanmışsa kullanılır.
- **Şimdilik kapsam dışı (kullanıcı en sona bıraktı):** ödeme, gerçek giriş/üyelik, Supabase, KVKK. Bunlara kendiliğinden başlama; ürün sahibi söyleyince yap.
- Dağıtım: GitHub'a yüklenip **Vercel**'de statik site olarak yayınlanacak.

## 3. Dosyalar ve komutlar
| Dosya | Görev |
|---|---|
| `index.html` | Uygulamanın tamamı (CSS + JS + örnek veri). **Tek dosya** |
| `manifest.webmanifest`, `icons/` | Ana ekrana eklenebilir uygulama |
| `vercel.json` | Güvenlik başlıkları |
| `package.json` | `npm start` (yerel sunucu), `npm test` |
| `tests/run.js` | Otomatik testler (Node, bağımlılık yok) |

- Çalıştır: `npm start` veya `index.html`'i tarayıcıda aç.
- Test: `npm test` (şu an 43 kontrol). **Her değişiklikten sonra çalıştır.** Testler sahte bir DOM kullanır, gerçek tarayıcı/telefon testinin yerini tutmaz.
- Yayın: GitHub'a gönder, Vercel "Other" preset, build komutu yok.
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
| `loads` | id, from, to, cargo, ton, veh, body, pay, price, date, note, km, owner/uid, phone, img (küçük jpeg data URL), items[{n,q,u}], closed, ts | `loads` |
| `trucks` | id, uid, from, to, veh, cap, body, date, phone, closed, ts, verified/approved (örnek veri) | `trucks` |
| `offers` | belge adı `<loadId>_<bidderUid>`: loadId, bidder, ownerUid, offer, status(wait/ok/counter/no), counter, stage(0-3), ts | `offers` |
| `msgs` | k (`o<loadId>_<bidder>`), uid, t, ts | `messages` |
| `carriers` | doc id = uid: phone, lic, src, kb, ruh, docs{src,kb,ruh}, ok | `carriers` |
| `approvals` | doc id = uid: ok (yalnızca yönetici yazar) | `approvals` |
| `carrierDocs/<uid>/files/<tür>` | img (jpeg data URL) | Storage kovası, özel |
| `pods/<loadId>_<bidder>` | img (teslim fotoğrafı) | Storage kovası |
| `ratings` | k, to, by, stars, text, ts | `ratings` |
| `premium/<uid>` | until, plan | `subscriptions` (yalnızca sunucu yazar) |
| `reports` | kind(l/t), tid, reason, note, by, ts | `reports` |
| `data/users/<uid>/prefs` | favs, calc, alerts, blocked | `profiles.prefs` jsonb |

`stage`: 0 Kabul, 1 Yüklendi, 2 Teslim edildi (fotoğraflı), 3 Yük sahibi onayladı.

## 6. Özellik durumu
**Tamam (arayüz + akış):** ilan listesi, filtre (araç/kasa/şehir/tonaj/ücret/ödeme/gün/puan/kayıtlı/belgeli), 81 il, boş araç ilanları, ilan verme (kalemler, fotoğraf, fiyat önerisi), harita üzerinde rota, piyasa fiyatı karşılaştırma, yakıt hesabı, teklif ve karşı teklif, mesajlaşma, teslim kanıtı, puan/yorum, dönüş yükü önerisi, rota alarmı, bildirimler, ilan düzenle/kapat/sil, ilan ve teklif süresi (yük 14 gün, boş araç 7 gün, teklif 3 gün), favoriler, belge rozeti ve yönetici onayı, Premium arama kapısı, paylaşma (derin bağlantı `#l=<id>`), ilk açılış tanıtımı, şikayet/engelleme/yardım, yükleniyor/çevrimdışı/hata durumları.
**Simüle:** örnek ilanlara verilen teklifler uygulama içinde yanıtlanır (`simulate`), örnek ilanların teslimi otomatik onaylanır, satın alma (`openPaywall` içindeki `buy`) gerçek ödeme almaz.
**Yok:** gerçek giriş, ödeme/abonelik, push bildirim, gerçek harita/mesafe, çok dilli arayüz, erişilebilirlik denetimi.

## 7. Güvenlik ve mahremiyet: dikkat
- **Premium kontrolü yalnızca arayüzde.** Telefon numaraları `loads/trucks/carriers` belgelerinde herkesin okuyabileceği alanda durur; üyelik bilgisi (`prem`) kullanıcının kendi tarayıcısında değiştirilebilir. Gerçekte: üyelik sunucuda ödeme webhook'uyla yazılmalı, numara yalnızca aktif üyeye sunucudan verilmeli.
- Ortak veritabanında varsayılan kurallar nedeniyle her yazıcı başkasının ilanını/teklifini değiştirebilir. Gerçek ürün: satır bazlı güvenlik (RLS), "yalnızca sahibi yazar".
- **Başka kullanıcıdan gelen her metin güvensizdir.** `clean()` üst düzey metinleri kaçışlar; iç içe alanlar (`items`), resimler (`img`) ve adlar gösterirken ayrıca kontrol edilir (`esc`, `imgOk`, `itemsTxt`). Yeni bir alan eklersen aynı kuralı uygula ve `tests/run.js` içindeki güvenlik testine ekle.
- Belge ve teslim fotoğrafları küçük jpeg data URL olarak belgede durur (≤ 170 KB). Gerçekte özel Storage + imzalı bağlantı gerekir.
- Şikayetler şu an kayıtlı herkesin okuyabildiği koleksiyonda. Gerçekte yalnızca yönetici okumalı.
- KVKK (aydınlatma metni, açık rıza, silme hakkı), kullanım sözleşmesi, yük aracılığı için gereken yetki belgeleri ve UETDS yükümlülüğü **henüz ele alınmadı**; hukuk danışmanıyla netleştirilmeli.

## 8. Tuzaklar (bozma)
- `isDark()` koyu tema arka planını **`#101722`** sabitiyle anlar. Koyu `--bg` rengini değiştirirsen `isDark` ve test bozulur.
- İki ayrı sabit var: `BASE` (harita SVG gövdesi) ve `APPURL` (paylaşım bağlantısı). Karıştırma.
- Veri öznitelikleri: `data-md` (liste kipi) ile `data-md2` (ilan sil) farklıdır. `data-ro` rol, `data-rc` şikayet kapat, `data-ub` engel kaldır, `data-sg/sp/sv` teslim aşamaları.
- `B12` + `D` yalnızca ilk 12 şehir için elle girilmiş gerçek mesafe tablosudur; diğer çiftler `LL` koordinatlarından kuş uçuşu × 1,3 ile **yaklaşık** hesaplanır. Gerçek yol mesafesi için harita servisi gerekir.
- Mazot fiyatı varsayılanı 95 ₺/L (4 Ekim 2026, İstanbul) ve piyasa karşılaştırması yalnızca uygulamadaki ilanlardan hesaplanır.
- Örnek ilan telefonları sahte (`0000 000 00 xx`). `SUPPORT_MAIL="destek@example.com"` yer tutucudur.
- localStorage anahtarları: `yy2` (veri), `yy-seen` (okunan bildirimler), `yy-onb` (tanıtım görüldü), `yy-role` (rol).
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

## 10. Gerçek cihaz test listesi (ürün sahibi yapacak)
- iPhone Safari ve Android Chrome: tüm sekmeler, kaydırma, klavye açılınca form, yazı alanına dokununca yakınlaşma olmaması.
- Fotoğraf: ilan fotoğrafı, belge fotoğrafı, teslim fotoğrafı (kameradan çekme dahil).
- Arama: Premium'da "Şimdi ara" gerçekten `tel:` açıyor mu, Premium değilken üyelik ekranı çıkıyor mu.
- Paylaş menüsü ve `#l=<id>` bağlantısıyla ilan açma.
- Koyu/açık tema, 320 px genişlik, yatay döndürme.
- Çevrimdışı uyarısı (uçak modu), yenileyince verilerin korunması.
- Ana ekrana ekleme (PWA) ve simge.
- İki farklı hesapla (bulut sürümünde): teklif, karşı teklif, kabul, mesaj, teslim, puan.

## 11. Kod haritası (otomatik üretildi)
`db.doc(...)` / `db.collection(...)` çağrılarının bulunduğu satırlar (veri katmanı taşınırken değiştirilecek yerler): 261, 262, 264, 290, 296, 304, 306, 333, 361, 380, 391, 392, 395, 397, 403, 404, 407, 410, 415, 476, 482, 516, 525, 528, 572, 573, 574, 575, 576, 577, 578

Fonksiyonlar:
- `F0` (satır 213)
- `match` (satır 217)
- `fcount` (satır 227)
- `activeChips` (satır 228)
- `rmF` (satır 229)
- `openFilter` (satır 233)
- `oup` (satır 261)
- `postTruck` (satır 262)
- `rebuild` (satır 263)
- `savePrefs` (satır 264)
- `dist` (satır 268)
- `mkt` (satır 269)
- `sugg` (satır 271)
- `mapSVG` (satır 282)
- `patchIt` (satır 290)
- `openEdit` (satır 291)
- `askDel` (satır 295)
- `openCounter` (satır 298)
- `listBind` (satır 303)
- `notifs` (satır 311)
- `bell` (satır 314)
- `openBell` (satır 315)
- `deep` (satır 322)
- `shareLoad` (satır 324)
- `openRate` (satır 330)
- `myRate` (satır 335)
- `addAlert` (satır 336)
- `setRole` (satır 339)
- `openOnb` (satır 341)
- `itemsUI` (satır 354)
- `openPaywall` (satır 357)
- `callTo` (satır 363)
- `savePhone` (satır 367)
- `openReport` (satır 378)
- `blockUser` (satır 382)
- `setStage` (satır 391)
- `shrink` (satır 393)
- `pickImg` (satır 394)
- `sendPod` (satır 395)
- `showImg` (satır 396)
- `showPod` (satır 397)
- `docPhoto` (satır 403)
- `viewDoc` (satır 404)
- `setCar` (satır 407)
- `carBind` (satır 408)
- `save` (satır 414)
- `simulate` (satır 415)
- `toast` (satır 423)
- `render` (satır 424)
- `openLoad` (satır 506)
- `openTruck` (satır 518)
- `openChat` (satır 519)
- `openCalc` (satır 532)
- `closeSheet` (satır 552)
- `setNav` (satır 554)
