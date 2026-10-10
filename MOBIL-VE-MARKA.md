# Marka ve mobil uygulama

Bu belge iki konuyu anlatır: **Marka** (logo, renkler, simgeler) ve **Mobil** (Android ve iOS mağaza uygulaması).

## Marka


Tek kaynak: `tools/logo.py`. Aşağıdaki bütün dosyalar (uygulama simgeleri dahil) bu betikle üretilir, elle düzenleme. Üretilen paylaşım dosyaları `export/` klasörüne yazılır ve **git dışında** tutulur (ayrı bir "görseller" paketi olarak verilir); yalnızca uygulamanın kullandığı `icons/` git'e girer.

### Dosyalar

| Dosya | Ne için |
|---|---|
| `export/svg/nakgo-icon.svg` | Yalnızca simge (yuvarlak köşeli kare). Sosyal medya, sunum |
| `export/svg/nakgo-icon-fullbleed.svg` | Köşesiz tam kare simge (mağaza ve iPhone gibi sistemin kendisinin yuvarlattığı yerler) |
| `export/svg/nakgo-logo-horizontal.svg` | Simge + NakGo yazısı, açık zemin için |
| `export/svg/nakgo-logo-horizontal-white.svg` | Simge + beyaz yazı, lacivert zemin dahil |
| `export/svg/nakgo-logo-vertical.svg` | Simge üstte, yazı altta |
| `export/png/nakgo-icon-1024.png` | Simge, 1024 px |
| `export/png/nakgo-logo-horizontal.png` | Yatay logo, şeffaf zemin |
| `export/png/nakgo-logo-horizontal-white.png` | Yatay logo, lacivert zemin |
| `export/png/nakgo-logo-vertical.png` | Dikey logo, şeffaf zemin |
| `icons/*` | Uygulamanın kullandığı simgeler (tarayıcı sekmesi, ana ekran, PWA). Yayına bu klasör gider, `export/` gitmez |

SVG dosyalarında yazı yola çevrilmiştir, bilgisayarında font olmasa da aynı görünür.

### Renkler

| Ad | Kod |
|---|---|
| Lacivert (marka) | `#12395f` |
| Lacivert açık (vurgu) | `#2a5f99` |
| Amber (başlangıç → bitiş) | `#ffd24f` → `#f0a30a` |
| Sarı ok | `#ffc93c` |
| Krem (cam, teker) | `#fff4d6` |

### Kullanım kuralları

- Logonun çevresinde simge yüksekliğinin yarısı kadar boşluk bırak.
- En küçük boyut: simge 24 px, yatay logo 96 px genişlik.
- Logoyu esnetme, döndürme, renklerini değiştirme. Koyu zeminde `*-white` sürümünü kullan.
- Amber zemin üzerine amber yazı koyma.

### Yeniden üretme

```
pip install fonttools playwright
playwright install chromium
npm run logo
```

Poppins Bold yazı tipi gerekir: `tools/Poppins-Bold.ttf` olarak koy ([indir](https://fonts.google.com/specimen/Poppins), SIL Open Font License) ya da `NAKGO_FONT` ortam değişkeniyle yolunu ver. Betik `icons/` ve `export/` klasörlerini günceller.

Önemli: `src/index.template.html` içindeki başlık logosu ve açılış ekranı logosu bu çizimin gömülü kopyasıdır. Çizimi değiştirirsen `tools/logo.py` içindeki `truck()` işlevini ve şablondaki iki gömülü kopyayı birlikte güncelle, sonra `npm run bundle` çalıştır.

## Mobil


Uygulama zaten mobil uyumlu bir web uygulamasıdır. Mağazaya koymak için [Capacitor](https://capacitorjs.com) ile bir "kabuk" içine sarılır. Bu klasör o iş için hazırlıkları içerir.

Gereken dosyalar:

- `capacitor.config.json` (aşağıdaki içerik)
- Simge ve açılış görselleri: `npm run logo` komutu `export/mobile/` altına üretir (Android uyarlanabilir simge katmanları, iOS simgesi, açık ve koyu açılış görseli)
- `npm run mobile:prepare`: web dosyalarını `www/` klasörüne kopyalar

`capacitor.config.json`:

```json
{
  "appId": "com.nakgo.app",
  "appName": "NakGo",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  },
  "ios": {
    "contentInset": "never"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "backgroundColor": "#12395f"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#12395f",
      "overlaysWebView": true
    }
  }
}
```

Uygulama tarafında zaten yapılanlar: güvenli alanlar (çentik, durum çubuğu, ana ekran çizgisi), Android geri tuşu (alt pencereyi kapatır), yerel kabukta servis çalışanının kapanması ve kısa açılış ekranı, ana ekrana ekleme kartı, kısayollar (`?go=post`, `?go=mine`, `?go=near`), `tel:`, paylaşma ve konum.

### Gereksinimler

- Node.js 18+
- Android için Android Studio, iOS için Mac ve Xcode
- Android: Google Play Console hesabı (tek seferlik ücret). iOS: Apple Developer Program (yıllık ücret). Güncel ücretleri mağazaların sitesinden kontrol et.

### Kurulum (adım adım)

Vercel yayınını etkilememesi için bunu bu klasörün **kopyasında** (örneğin `nakgo-mobile`) veya ayrı bir dalda (branch) yap.

```
npm install -D @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/assets
# capacitor.config.json dosyasını yukarıdaki içerikle oluştur
npm run mobile:prepare
npx cap add android
npx cap add ios
npm run logo
cp -r export/mobile assets
npx capacitor-assets generate
npx cap sync
npx cap open android      # veya: npx cap open ios
```

Web kodunu her değiştirdiğinde: `npm run mobile:prepare && npx cap sync`.

### İzinler

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

### Mağaza öncesi kontrol listesi

- **Gizlilik politikası** adresi (iki mağaza da ister). KVKK aydınlatma metniyle birlikte hazırlanmalı.
- Kullanıcı hesabı varsa **uygulama içinde hesap silme** (Apple ve Google ister).
- Veri güvenliği formu (Google Play) ve App Privacy bilgileri (Apple): konum, fotoğraf, telefon numarası, kullanıcı kimliği.
- Yaş derecelendirmesi, kategori (İş / Lojistik), açıklama, ekran görüntüleri. `npm run test:shots` ile alınan görüntüler başlangıç için kullanılabilir.
- İnceleme için **test hesabı** bilgisi (giriş eklenince).
- Mağaza simgesi: `export/png/nakgo-icon-fullbleed-1024.png` (köşesiz, şeffaf alansız).
- Sürüm numarası ve imzalama anahtarı (Android keystore) güvenli bir yerde saklanmalı. Kaybedilirse güncelleme yayınlanamaz.

### Ödeme ve mağaza kuralları (önemli)

Premium üyelik gibi **uygulama içinde açılan dijital abonelikler**, mağaza uygulamalarında genellikle Apple ve Google'ın kendi uygulama içi satın alma sistemiyle satılmak zorundadır ve komisyon kesilir (genel oran %15 ile %30 arasındadır, küçük işletme programlarında indirim vardır). Bu, fiyatlandırmayı etkiler: 299 ₺ aylık fiyattan mağaza payı düşülür. Navlun ödemesi gibi fiziksel hizmet bedelleri için kurallar farklıdır. Kurallar sık değişir ve ülkeye göre farklıdır, yayından önce Apple App Store Review Guidelines ve Google Play Payments politikasını güncel haliyle oku, gerekirse hukuki destek al.

### Sonraki teknik adımlar

1. **Eklentiler:** `@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/share`, `@capacitor/app` (geri tuşu ve derin bağlantı), `@capacitor/status-bar`. Web API'leri WebView'da çalışır ama eklentiler izin akışında daha güvenilirdir.
2. **Bildirim:** `@capacitor/push-notifications` (Android için FCM, iOS için APNs). Gönderim için sunucu gerekir (örneğin Supabase Edge Function). Şimdiki bildirim zili yalnızca uygulama içidir.
3. **Derin bağlantı:** şu an ilan bağlantısı `#l=<id>`. Mağaza uygulamasında bağlantıdan açmak için alan adının `/.well-known/assetlinks.json` (Android) ve `/.well-known/apple-app-site-association` (iOS) dosyaları gerekir.
4. **Giriş:** gerçek giriş (SMS) eklenince uygulama kimliği, hesap silme ve test hesabı akışları tamamlanmalı.
5. **Test:** Android emülatör ve gerçek cihaz, iOS simülatör ve TestFlight, Google Play iç test kanalı.
