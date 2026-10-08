# NakGo

Yük sahipleri ile taşıyıcıları buluşturan, telefon ekranına göre tasarlanmış yük pazarı prototipi. Tek dosyalı statik uygulama: derleme adımı yok.

## Dosyalar

- `index.html`: uygulamanın tamamı (arayüz, mantık, örnek veriler)
- `manifest.webmanifest`, `icons/`: ana ekrana eklenebilir uygulama (PWA) ayarları ve simgeler
- `vercel.json`: Vercel yayın ayarları (güvenlik başlıkları)
- `package.json`: proje bilgisi, `npm start` ve `npm test` komutları (bağımlılık yok, derleme adımı yok)
- `tests/run.js`: otomatik testler (`npm test`), `tests/shots.py`: ekran görüntüsü alma (isteğe bağlı, Playwright gerekir)
- `brand/`: logo dosyaları (simge, yatay, dikey, açık/koyu zemin; SVG ve PNG)
- `sw.js`: servis çalışanı, uygulamanın internet olmadan da açılmasını sağlar
- `HANDOFF.md`: projeyi devralacak geliştirici veya yapay zekâ için ayrıntılı devir notu

## Bilgisayarında çalıştırma

`index.html` dosyasına çift tıklaman yeterli. Alternatif olarak klasörde `npm start` çalıştırabilirsin (Node.js 18 veya üstü gerekir).

## Test

`npm test` (Node.js 18+) sahte bir tarayıcı ortamıyla temel akışları kontrol eder. Gerçek telefon testinin yerini tutmaz, ayrıntılı kontrol listesi `HANDOFF.md` içindedir.

## GitHub'a yükleme

1. github.com'da yeni bir depo (repository) oluştur, örneğin `nakgo`.
2. Bu klasörün içindeki tüm dosyaları depoya yükle (tarayıcıdan "Add file → Upload files" ile sürükleyebilirsin) ya da:

```
git init
git add .
git commit -m "İlk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/nakgo.git
git push -u origin main
```

## Vercel'e yayınlama

1. vercel.com'a GitHub hesabınla giriş yap.
2. **Add New → Project** de ve `nakgo` deposunu seç (Import).
3. **Framework Preset: Other** seçili kalsın. Build Command, Output Directory ve Install Command alanlarını boş bırak (derleme adımı yok, `package.json` içinde `build` komutu bilerek tanımlı değil).
4. **Deploy**'a bas. Birkaç saniye sonra `https://nakgo-....vercel.app` adresinde yayında olur.
5. Depoya her yeni değişiklik gönderdiğinde Vercel otomatik yeniden yayınlar.

Not: GitHub'da `yukyol` adıyla bir depon varsa adını değiştirmek zorunda değilsin, uygulama adı depo adından bağımsızdır (GitHub'da istersen Settings → General → Repository name ile yeniden adlandırabilirsin).

Telefonda siteyi açıp tarayıcı menüsünden "Ana ekrana ekle" dersen uygulama gibi açılır.

## Önemli: veriler nerede tutuluyor?

Bu sürümde veritabanı yok. İlanlar, teklifler, mesajlar ve ayarlar her kullanıcının **kendi tarayıcısında** (localStorage) saklanır. Yani iki farklı telefon birbirinin ilanını görmez. Örnek ilanlara verilen teklifler uygulama tarafından simüle edilen yanıtlarla sonuçlanır.

Aynı dosya Claude üzerinde yayınlanan sürümde ortak veritabanıyla da çalışır. Dosya, `window.claude` yoksa otomatik olarak yerel moda geçer. Vercel'de her zaman yerel moddadır.

## Gerçek veritabanına geçerken (ileride)

Veri katmanı `index.html` içinde iki yerde toplanmıştır: sonundaki `claude.use("db")` ile başlayan bölüm (okuma ve canlı dinleme) ve `dbw(db.doc(...))` ile yapılan yazma çağrıları. Bunları kendi veritabanı istemcinle (örneğin Supabase) değiştirmek yeterli. Önerilen eşleşme:

| Koleksiyon | Önerilen tablo |
|---|---|
| `loads`, `trucks` | `loads`, `trucks` (`uid`, `closed`, `created_at`) |
| `offers` | `offers` (`load_id`, `bidder`, `status`, `counter`, `stage`) |
| `msgs` | `messages` (`key`, `uid`, `text`) |
| `carriers`, `approvals` | `carriers`, `approvals` (yalnızca yönetici yazar) |
| `carrierDocs`, `pods` | Storage kovaları (belge ve teslim fotoğrafı) |
| `ratings` | `ratings` |
| `premium` | `subscriptions` (`user_id`, `plan`, `until`; yalnızca sunucu yazar) |
| kullanıcı tercihleri | `profiles.prefs` (jsonb) |

Yazma yetkilerini her tablo için satır bazlı güvenlik kuralıyla (RLS) sınırla: herkes kendi satırını yazar, onay ve belge görüntüleme yalnızca yöneticiye açık olur.

## Premium üyelik (test modu)

Doğrudan arama özelliği yalnızca Premium üyelere açıktır. Üye olmayan biri "Ara" düğmesine dokununca üyelik ekranı açılır.

- Plan adları ve fiyatlar `index.html` içinde `PLANS` satırındadır (şu an iki plan: 299 ₺ aylık ve 3.099 ₺ yıllık). Fiyatı değiştirmek veya plan eklemek için bu satırı düzenle. Gerçek ödemede aylık plan yinelenen ödeme (abonelik) olarak ayarlanacak, şu an test modunda 30 günlük üyelik açar.
- **Satın alma şu an simüle edilir**: "Premium'a geç" düğmesi gerçek ödeme almaz, üyeliği doğrudan açar. Gerçek ödeme için `openPaywall` içindeki `buy` işlemine ödeme sağlayıcısı (iyzico, PayTR veya Stripe) bağlanacak.
- Profildeki "Üyeliği sıfırla (test)" düğmesi test için üyeliği kapatır.
- Telefon numarası profilden girilir ve ilanlara eklenir. Örnek ilanlardaki numaralar sahte (`0000 000 00 xx`) değerlerdir.

**Güvenlik uyarısı:** Premium kontrolü şu an yalnızca arayüzde yapılır. Numaralar veritabanında herkesin okuyabileceği alanlarda durur ve üyelik bilgisini kullanıcı kendi tarayıcısında değiştirebilir. Gerçek ürüne geçerken üyelik durumu ödeme sağlayıcısının webhook'u ile sunucuda yazılmalı, telefon numarası da yalnızca aktif üyeliği olan kullanıcıya sunucu tarafından verilmelidir (Supabase'te RLS ve `subscriptions` tablosu ile).

## Diğer özellikler

Yük kalemleri ve birimleri, ilanda küçük fotoğraf, puan ve yorum, rota alarmı, ilan paylaşma, ilk açılış tanıtımı, teslim kanıtı, belge rozetleri ve yönetici onayı, karşı teklif, bildirimler, yakıt hesabı, haritada rota.

## Bilinen sınırlar

- 81 ilin mesafeleri yaklaşıktır (ilk 12 şehir elle girilmiş tablodan, diğerleri koordinattan hesaplanır), gerçek rota hesabı değildir.
- Mazot fiyatı varsayılanı (95 ₺/L) 4 Ekim 2026 İstanbul fiyatıdır. Hesap ekranından değiştirilebilir.
- Piyasa fiyatı karşılaştırması yalnızca uygulamadaki ilanlardan hesaplanır.
- Belge rozeti "Belgeli" kişinin beyanıdır, "Onaylı" ise yöneticinin onayıdır.
- Gerçek kullanıcıya açmadan önce kullanıcı doğrulama, KVKK ve ödeme konuları ayrıca ele alınmalıdır.
