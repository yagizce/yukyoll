# NakGo mobil kabuk (Android ve iOS)

Uygulama zaten mobil uyumlu bir web uygulamasıdır. Mağazaya koymak için [Capacitor](https://capacitorjs.com) ile bir "kabuk" içine sarılır. Bu klasör o iş için hazırlıkları içerir.

| Dosya | Görev |
|---|---|
| `capacitor.config.json` | Capacitor ayar şablonu (uygulama kimliği `com.nakgo.app`, ad, renkler) |
| `prepare-web.js` | Web dosyalarını `www/` klasörüne kopyalar (`npm run mobile:prepare`) |
| `assets/` | Hazır simge ve açılış görselleri (Android uyarlanabilir simge, iOS simge, açık/koyu splash) |

Uygulama tarafında zaten yapılanlar: güvenli alanlar (çentik, durum çubuğu, ana ekran çizgisi), Android geri tuşu (alt pencereyi kapatır), yerel kabukta servis çalışanının kapanması ve kısa açılış ekranı, ana ekrana ekleme kartı, kısayollar (`?go=post`, `?go=mine`, `?go=near`), `tel:`, paylaşma ve konum.

## Gereksinimler

- Node.js 18+
- Android için Android Studio, iOS için Mac ve Xcode
- Android: Google Play Console hesabı (tek seferlik ücret). iOS: Apple Developer Program (yıllık ücret). Güncel ücretleri mağazaların sitesinden kontrol et.

## Kurulum (adım adım)

Vercel yayınını etkilememesi için bunu bu klasörün **kopyasında** (örneğin `nakgo-mobile`) veya ayrı bir dalda (branch) yap.

```
npm install -D @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/assets
cp mobile/capacitor.config.json capacitor.config.json
npm run mobile:prepare
npx cap add android
npx cap add ios
cp -r mobile/assets assets
npx capacitor-assets generate
npx cap sync
npx cap open android      # veya: npx cap open ios
```

Web kodunu her değiştirdiğinde: `npm run mobile:prepare && npx cap sync`.

## İzinler

**Android** (`android/app/src/main/AndroidManifest.xml`): `INTERNET` zaten vardır. Konum ve kamera için ekle:

```
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS** (`ios/App/App/Info.plist`) açıklama metinleri (Türkçe, kullanıcıya gösterilir):

| Anahtar | Önerilen metin |
|---|---|
| `NSLocationWhenInUseUsageDescription` | Yakınındaki yükleri göstermek için konumunu kullanırız. |
| `NSCameraUsageDescription` | İlan, belge ve teslim fotoğrafı çekmek için kamerayı kullanırız. |
| `NSPhotoLibraryUsageDescription` | İlan, belge ve teslim fotoğrafı seçmek için fotoğraflarına erişiriz. |

## Mağaza öncesi kontrol listesi

- **Gizlilik politikası** adresi (iki mağaza da ister). KVKK aydınlatma metniyle birlikte hazırlanmalı.
- Kullanıcı hesabı varsa **uygulama içinde hesap silme** (Apple ve Google ister).
- Veri güvenliği formu (Google Play) ve App Privacy bilgileri (Apple): konum, fotoğraf, telefon numarası, kullanıcı kimliği.
- Yaş derecelendirmesi, kategori (İş / Lojistik), açıklama, ekran görüntüleri. `npm run test:shots` ile alınan görüntüler başlangıç için kullanılabilir.
- İnceleme için **test hesabı** bilgisi (giriş eklenince).
- Mağaza simgesi: `brand/png/nakgo-icon-fullbleed-1024.png` (köşesiz, şeffaf alansız).
- Sürüm numarası ve imzalama anahtarı (Android keystore) güvenli bir yerde saklanmalı. Kaybedilirse güncelleme yayınlanamaz.

## Ödeme ve mağaza kuralları (önemli)

Premium üyelik gibi **uygulama içinde açılan dijital abonelikler**, mağaza uygulamalarında genellikle Apple ve Google'ın kendi uygulama içi satın alma sistemiyle satılmak zorundadır ve komisyon kesilir (genel oran %15 ile %30 arasındadır, küçük işletme programlarında indirim vardır). Bu, fiyatlandırmayı etkiler: 299 ₺ aylık fiyattan mağaza payı düşülür. Navlun ödemesi gibi fiziksel hizmet bedelleri için kurallar farklıdır. Kurallar sık değişir ve ülkeye göre farklıdır, yayından önce Apple App Store Review Guidelines ve Google Play Payments politikasını güncel haliyle oku, gerekirse hukuki destek al.

## Sonraki teknik adımlar

1. **Eklentiler:** `@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/share`, `@capacitor/app` (geri tuşu ve derin bağlantı), `@capacitor/status-bar`. Web API'leri WebView'da çalışır ama eklentiler izin akışında daha güvenilirdir.
2. **Bildirim:** `@capacitor/push-notifications` (Android için FCM, iOS için APNs). Gönderim için sunucu gerekir (örneğin Supabase Edge Function). Şimdiki bildirim zili yalnızca uygulama içidir.
3. **Derin bağlantı:** şu an ilan bağlantısı `#l=<id>`. Mağaza uygulamasında bağlantıdan açmak için alan adının `/.well-known/assetlinks.json` (Android) ve `/.well-known/apple-app-site-association` (iOS) dosyaları gerekir.
4. **Giriş:** gerçek giriş (SMS) eklenince uygulama kimliği, hesap silme ve test hesabı akışları tamamlanmalı.
5. **Test:** Android emülatör ve gerçek cihaz, iOS simülatör ve TestFlight, Google Play iç test kanalı.
