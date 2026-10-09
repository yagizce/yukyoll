# NakGo marka dosyaları

Tek kaynak: `brand/generate.py`. Aşağıdaki bütün dosyalar (uygulama simgeleri dahil) bu betikle üretilir, elle düzenleme.

## Dosyalar

| Dosya | Ne için |
|---|---|
| `svg/nakgo-icon.svg` | Yalnızca simge (yuvarlak köşeli kare). Sosyal medya, sunum |
| `svg/nakgo-icon-fullbleed.svg` | Köşesiz tam kare simge (mağaza ve iPhone gibi sistemin kendisinin yuvarlattığı yerler) |
| `svg/nakgo-logo-horizontal.svg` | Simge + NakGo yazısı, açık zemin için |
| `svg/nakgo-logo-horizontal-white.svg` | Simge + beyaz yazı, lacivert zemin dahil |
| `svg/nakgo-logo-vertical.svg` | Simge üstte, yazı altta |
| `png/nakgo-icon-1024.png` | Simge, 1024 px |
| `png/nakgo-logo-horizontal.png` | Yatay logo, şeffaf zemin |
| `png/nakgo-logo-horizontal-white.png` | Yatay logo, lacivert zemin |
| `png/nakgo-logo-vertical.png` | Dikey logo, şeffaf zemin |
| `../icons/*` | Uygulamanın kullandığı simgeler (tarayıcı sekmesi, ana ekran, PWA). Yayına bu klasör gider, `brand/` gitmez |

SVG dosyalarında yazı yola çevrilmiştir, bilgisayarında font olmasa da aynı görünür.

## Renkler

| Ad | Kod |
|---|---|
| Lacivert (marka) | `#12395f` |
| Lacivert açık (vurgu) | `#2a5f99` |
| Amber (başlangıç → bitiş) | `#ffd24f` → `#f0a30a` |
| Sarı ok | `#ffc93c` |
| Krem (cam, teker) | `#fff4d6` |

## Kullanım kuralları

- Logonun çevresinde simge yüksekliğinin yarısı kadar boşluk bırak.
- En küçük boyut: simge 24 px, yatay logo 96 px genişlik.
- Logoyu esnetme, döndürme, renklerini değiştirme. Koyu zeminde `*-white` sürümünü kullan.
- Amber zemin üzerine amber yazı koyma.

## Yeniden üretme

```
pip install fonttools playwright
playwright install chromium
python3 brand/generate.py
```

Poppins Bold yazı tipi gerekir (`brand/fonts/README.txt`). Betik `icons/` ve `brand/svg`, `brand/png` klasörlerini günceller.

Önemli: `index.html` içindeki başlık logosu ve açılış ekranı logosu bu çizimin gömülü kopyasıdır. Çizimi değiştirirsen `generate.py` içindeki `truck()` işlevini ve `index.html` içindeki iki gömülü kopyayı birlikte güncelle.
