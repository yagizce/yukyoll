# Geliştirme ve test

Yeni JS/CSS dosyasını `tools/project.js` sırasına ekleyin. Betikler ortak kapsamı paylaşır: üst düzey isimler çakışmamalı; başlangıç olayları `src/js/app.js` içindedir. Lint birleşik sözdizimini, isim çakışmalarını ve kaynak başlıklarını denetler. `npm run map -- --write` yerel docs/CODEMAP.md üretir.

`tests/run.js` sahte DOM ile davranışı ve yayın çıktısını denetler. Yeni testler tests/unit/ altında *.test.js olur. Yerleşim ve klavye gerçek tarayıcıda doğrulanmalıdır.

Tarayıcı testi için Python 3, `python -m pip install playwright` ve `python -m playwright install chromium` gerekir. Kurulu Chrome için NAKGO_BROWSER_CHANNEL=chrome kullanılabilir. NAKGO_E2E_URL testin yerel sunucu yerine önizlemeyi açmasını sağlar; korunan Vercel önizlemesi geçerli paylaşım bağlantısı gerektirir. Testler demo verisi oluşturur, gerçek ödeme veya taşıma yapmaz.

Çalışan komutlar README'dedir. Kontrollerde 360/390/430 px ve masaüstünde iki tema, uzun metin/fiyat, boş sonuç ve görsel klavye alanı incelenmelidir. Fiziksel cihaz klavyesi ayrıca doğrulanmalıdır.

Vercel statik yayın kullanır. Kaynaklar/araçlar/belgeler .vercelignore ile dışlanır; index.html, manifest, SW ve icons/ yayınlanır. Yeni önizleme onaylanmadan üretim dalı birleştirilmez veya üretim yayını yapılmaz.
