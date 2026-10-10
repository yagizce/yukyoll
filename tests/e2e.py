"""Uçtan uca test: gerçek Chromium ile uygulamayı bir kullanıcı gibi baştan sona gezer.
Gereken: pip install playwright && playwright install chromium
Çalıştır:  npm run test:e2e        (hata varsa çıkış kodu 1)
Ekran görüntüsü:  npm run test:shots   (390x844 görüntüleri tests/shots/ içine yazar, git dışındadır)"""
import os, sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def take_shots():
    out = os.path.join(ROOT, "tests", "shots"); os.makedirs(out, exist_ok=True); errs = []
    with sync_playwright() as p:
        b = p.chromium.launch(channel=os.environ.get("NAKGO_BROWSER_CHANNEL") or None)
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, permissions=["geolocation"], geolocation={"latitude": 39.93, "longitude": 32.86}, locale="tr-TR")
        ctx.add_init_script("localStorage.setItem('yy-onb','1')")
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("file://" + os.path.join(ROOT, "index.html"))
        pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(out, "01_splash.png"))
        pg.wait_for_timeout(2200); pg.screenshot(path=os.path.join(out, "02_liste.png"))
        for name, js in (("03_detay", "openLoad(1)"), ("04_karsilastirma", "closeSheet();toggleCmp(1);toggleCmp(2);openCompare()"),
                         ("05_profil", "closeSheet();offers=[{...loads[0],offer:28500,status:'ok',loadId:1,bidder:'',stage:3,doneAt:Date.now()}];tab='me';setNav();render()"),
                         ("06_yakinimda", "tab='list';setNav();render();toggleNear()")):
            pg.evaluate(js); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(out, name + ".png"))
        b.close()
    print("Görüntüler:", out, "| JS hatası:", errs or "yok")
    sys.exit(1 if errs else 0)

if "--shots" in sys.argv:
    take_shots()

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = os.environ.get("NAKGO_E2E_URL") or f"http://127.0.0.1:{srv.server_address[1]}/index.html"

results, errors = [], []
def check(name, cond):
    results.append(bool(cond)); print(("✓ " if cond else "✗ ") + name)

with sync_playwright() as p:
    b = p.chromium.launch(channel=os.environ.get("NAKGO_BROWSER_CHANNEL") or None)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, locale="tr-TR", permissions=["geolocation"], geolocation={"latitude": 39.93, "longitude": 32.86})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" and "ERR_" not in m.text and "Failed to load" not in m.text and "fonts.g" not in m.text else None)
    toast = lambda: pg.inner_text("#toast")
    nav = lambda t: pg.click(f'nav button[data-t="{t}"]')
    cards = lambda: pg.locator(".load[data-id]").count()

    # 1) Açılış, tanıtım ve rol
    pg.goto(URL, wait_until="domcontentloaded")
    check("açılış ekranı görünür", pg.is_visible("#splash"))
    pg.wait_for_timeout(2300)
    check("açılış ekranı kapanır", not pg.is_visible("#splash"))
    check("ilk açılışta tanıtım gelir", pg.is_visible("#onb"))
    pg.click("#ob-skip"); pg.click("#r-c"); pg.wait_for_timeout(300)
    check("rol seçilince tanıtım kapanır ve liste açılır", not pg.is_visible("#onb") and cards() > 5)

    # 2) Detay, paylaşma ve klavye
    pg.click(".load[data-id]"); pg.wait_for_selector("#sheet.open")
    body = pg.inner_text("#sheetBody")
    check("ilan detayında harita, ücret ve düğmeler var", "Paylaş" in body and "Kâr hesapla" in body and pg.locator("#sheetBody .map").count() == 1)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    check("Escape ile alt pencere kapanır", pg.locator("#sheet.open").count() == 0)

    # 3) Yakıt hesabı
    pg.locator(".load[data-id]").first.click(); pg.click("#cc"); pg.wait_for_selector("#res")
    before = pg.inner_text("#res"); pg.fill('[data-k="km"]', "100"); after = pg.inner_text("#res")
    check("yakıt hesabı girdiye göre değişir", before != after and "₺" in after)
    pg.click("#cx"); pg.wait_for_timeout(200)

    # 4) Filtre
    n0 = cards(); pg.click("#fb"); pg.click('[data-g="veh"][data-v="Kamyonet"]'); pg.click("#fs"); pg.wait_for_timeout(200)
    n1 = cards(); check(f"araç filtresi listeyi daraltır ({n0}→{n1})", 0 < n1 < n0)
    pg.evaluate("F=F0();render()"); pg.wait_for_timeout(200)

    # 5) Karşılaştırma
    for i in (0, 1):
        pg.locator(".load[data-id]").nth(i).click(); pg.wait_for_selector("#sheet.open"); pg.click("#cp2"); pg.wait_for_timeout(250)
    check("iki ilan seçilince karşılaştır çubuğu çıkar", pg.is_visible("#cmpgo"))
    pg.click("#cmpgo"); pg.wait_for_selector("#sheet.open")
    check("karşılaştırma tablosu açılır", "İlanları karşılaştır" in pg.inner_text("#sheetBody") and pg.locator("#sheetBody .win").count() > 0)
    pg.keyboard.press("Escape"); pg.click("#cmpx"); pg.wait_for_timeout(200)

    # 6) Teklif ve simüle yanıt
    pg.locator(".load[data-id]").first.click(); pg.wait_for_selector("#sheet.open"); pg.click("#send")
    check("teklif gönderilir", "Teklif gönderildi" in toast())
    nav("mine"); pg.wait_for_timeout(300)
    check("teklif 'bekleniyor' görünür", "Yanıt bekleniyor" in pg.inner_text("#main"))
    pg.wait_for_timeout(3600)
    check("simüle yanıt gelir", "Yanıt bekleniyor" not in pg.inner_text("#main"))

    # 7) İlan verme ve istatistik
    nav("post"); pg.click('[data-pm="load"]'); pg.click("#post-next"); pg.fill("#c", "Test yükü"); pg.fill("#w", "5"); nav("list"); nav("post"); check("ilan taslağı sekmeler arasında korunur", pg.input_value("#c")=="Test yükü"); pg.reload(); pg.wait_for_timeout(300); nav("post"); check("ilan taslağı yenilemede korunur", pg.input_value("#c")=="Test yükü"); pg.click("#post-next"); pg.fill("#p", "12000"); pg.click("#go"); pg.wait_for_timeout(300)
    check("ilan yayınlanır", "İlan yayınlandı" in toast())
    nav("me"); pg.wait_for_timeout(300)
    check("İlanlarım'da yeni ilan ve istatistik satırı var", "görüntülenme" in pg.inner_text("#main") and pg.locator("[data-st2]").count() >= 1)
    pg.locator("[data-st2]").first.click(); pg.wait_for_selector("#sheet.open")
    check("istatistik penceresi açılır", "İlan performansı" in pg.inner_text("#sheetBody"))
    pg.keyboard.press("Escape")
    pg.locator("[data-ft]").first.click(); pg.wait_for_selector("#fbuy")
    check("öne çıkarma ekranı 5 sabit seçenek gösterir (saat çubuğu yok)", pg.locator("#sheetBody .fopt").count() == 5 and pg.locator("#sheetBody .fb").count() == 0)
    p0 = pg.inner_text(".fprice b"); pg.click('[data-fd="24"]'); p1 = pg.inner_text(".fprice b")
    check("süre değişince fiyat değişir (" + p0 + " → " + p1 + ")", p0 != p1 and "99" in p1)
    pg.click('[data-fd="6"]'); pg.click("#fbuy"); pg.wait_for_timeout(300)
    check("öne çıkarma satın alınır", "öne çıkarıldı" in toast())
    nav("me"); pg.wait_for_timeout(300); pg.locator("[data-st2]").first.click(); pg.wait_for_selector("#sheet.open")
    check("istatistikte öne çıkarmanın etkisi görünür", "Öne çıkarmanın etkisi" in pg.inner_text("#sheetBody"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    check("profilde öne çıkarma özeti var", "Öne çıkarma özeti" in pg.inner_text("#main"))
    nav("list"); pg.wait_for_timeout(300)
    check("öne çıkan ilan listenin başında ve etiketli", pg.locator(".load.feat").count() >= 1 and "Test yükü" in pg.locator(".load[data-id]").first.inner_text())
    pg.click('.seg [data-md="truck"]'); pg.wait_for_timeout(300)
    check("boş araç listesinde de öne çıkan örnek var", pg.locator(".load.feat[data-tid]").count() >= 1)
    pg.click('.seg [data-md="load"]'); pg.wait_for_timeout(200)

    # 8) Premium ve arama
    nav("me"); pg.wait_for_timeout(200)
    pg.click("#pm1"); pg.wait_for_selector("#buy"); pg.click("#buy"); pg.wait_for_timeout(300)
    check("test modunda üyelik açılır", "Aktif" in pg.inner_text("#main"))
    nav("list"); pg.locator(".load[data-id]").first.click(); pg.wait_for_selector("#sheet.open"); pg.click("#call"); pg.wait_for_timeout(250)
    check("örnek telefon gerçek arama sunmaz", "Örnek telefon" in pg.inner_text("#sheetBody")); pg.evaluate('callTo("0555 123 45 67")'); check("Premium gerçek numara için tel bağlantısı verir", pg.locator('#sheetBody a[href^="tel:"]').count()==1)
    pg.keyboard.press("Escape")

    # 9) Tema düğmesi üst barda ve kalıcı
    check("tema düğmesi başlıkta, profilde yok", pg.is_visible("header #thh") and pg.locator("#th").count() == 0)
    pg.click("#thh"); t1 = pg.evaluate("document.documentElement.dataset.theme")
    pg.reload(); pg.wait_for_timeout(500); t2 = pg.evaluate("document.documentElement.dataset.theme")
    check("tema seçimi yenilemede korunur", t1 and t1 == t2)
    check("kayıtlar yenilemede korunur (ilan, üyelik)", pg.evaluate("loads.some(l=>l.cargo==='Test yükü')&&isPrem()"))

    # 9b) Geri tuşu alt pencereyi kapatır, uygulamadan çıkarmaz
    nav("list"); pg.locator(".load[data-id]").first.click(); pg.wait_for_selector("#sheet.open"); pg.go_back(); pg.wait_for_timeout(300)
    check("geri tuşu alt pencereyi kapatır", pg.locator("#sheet.open").count() == 0 and pg.url.split("?")[0].rstrip("/") == URL.split("?")[0].rstrip("/"))
    # 9c) Kısayol adresi ve manifest
    pg.goto(URL + ("&" if "?" in URL else "?") + "go=post"); pg.wait_for_timeout(500)
    check("?go=post kısayolu İlan ver sekmesini açar", pg.evaluate("tab")=="post")
    man = pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
    check("manifest kısayolları ve kimliği var", len(man.get("shortcuts", [])) == 3 and man.get("id"))
    pg.goto(URL); pg.wait_for_timeout(400)

    # 10) Dar ekranda taşma olmaması (320 px)
    pg.set_viewport_size({"width": 320, "height": 640}); pg.wait_for_timeout(200)
    over = []
    for t in ("list", "post", "mine", "me"):
        nav(t); pg.wait_for_timeout(250)
        if pg.evaluate("document.documentElement.scrollWidth>window.innerWidth||document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1||document.querySelector('header').scrollWidth>document.querySelector('header').clientWidth+1"): over.append(t)
    check("320 px genişlikte yatay taşma yok" + (f" (taşan: {over})" if over else ""), not over)
    pg.set_viewport_size({"width": 390, "height": 844})

    # 11) Çevrimdışı açılış (servis çalışanı)
    pg.goto(URL); pg.evaluate("navigator.serviceWorker.ready.then(()=>true)"); pg.wait_for_timeout(800); pg.reload(); pg.wait_for_timeout(800)
    ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(800)
    check("internet yokken uygulama kayıtlı kopyadan açılır", cards() > 0 and pg.is_visible("#off"))
    ctx.set_offline(False)

    check("sayfa hatası yok" + (f" ({errors[:2]})" if errors else ""), not errors)

    # 12) İki temada mobil/masaüstü, adımlar, mesajlar ve profil.
    for theme in ("light", "dark"):
        for width in (360, 390, 430, 1280):
            matrix = b.new_context(viewport={"width":width,"height":844},locale="tr-TR",color_scheme=theme,reduced_motion="reduce",service_workers="block")
            matrix.add_init_script(f"localStorage.setItem('yy-onb','1');localStorage.setItem('yy-theme','{theme}');sessionStorage.setItem('ng-splash','1')")
            page = matrix.new_page(); page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto(URL); page.wait_for_selector('.load[data-id]')
            prefix=f"{theme}/{width} "
            page.select_option('#route-from','İstanbul');page.select_option('#route-to','Ankara')
            check(prefix+"güzergâh filtresi",page.locator('.load[data-id]').count()==1)
            page.locator('[data-id]').first.click();page.fill('#o','27000');page.click('#send')
            page.click('nav [data-t=mine]');page.locator('[data-chat]').first.click()
            page.fill('#mi','Test mesajı');page.click('#ms')
            check(prefix+"mesaj yazılır ve demo açıklaması görünür","Test mesajı" in page.inner_text('#msgs') and 'Demo sohbet' in page.inner_text('#sheetBody'))
            page.keyboard.press('Escape');page.click('nav [data-t=post]');page.click('[data-pm=load]')
            page.click('#post-next');page.fill('#c','Uzun şehir adlarıyla hassas test yükü');page.fill('#w','18');page.click('#post-next')
            page.fill('#p','123456789');page.fill('#n','Uzun not. '*40)
            page.click('#addit');page.fill('[data-in]','Palet');page.fill('[data-iq]','12')
            if width==390:
                with page.expect_file_chooser() as chooser: page.click('#ph')
                chooser.value.set_files(os.path.join(ROOT,'icons','icon-192.png'));page.wait_for_selector('#phs img')
            page.click('#post-prev');page.click('#post-next')
            check(prefix+"adımlarda not ve kalem korunur",page.input_value('#n').startswith('Uzun not.') and page.input_value('[data-in]')=='Palet')
            page.reload();page.click('nav [data-t=post]')
            check(prefix+"taslak ve ücret yenilemede korunur",page.input_value('#p')=='123456789' and page.input_value('[data-in]')=='Palet')
            if width==390: check(prefix+"fotoğraf taslağı korunur",page.locator('#phs img').count()==1)
            page.click('#go');check(prefix+"yayın sonrası taslak temizlenir",page.evaluate("!JSON.parse(localStorage.getItem('ng-post-drafts')).load"))
            page.click('nav [data-t=me]');page.locator('summary',has_text='İletişim ve tercihler').click();page.fill('#myph','0555 123 45 67');page.click('#phs2')
            check(prefix+"profil telefonu kaydedilir",page.evaluate("myCar.phone==='0555 123 45 67'"))
            page.locator('summary',has_text='Araç ve belgeler').click()
            check(prefix+"belge formu erişilir",page.is_visible('#lic'))
            page.click('nav [data-t=post]');page.click('[data-pm=truck]');page.select_option('#f','Afyonkarahisar');page.select_option('#t','Kahramanmaraş');page.click('#post-next');page.fill('#w','20');page.click('#post-next');page.click('#go')
            check(prefix+"boş araç yayınlanır ve filtre arkasında kalmaz",page.evaluate("trucks.some(t=>t.mine&&t.from==='Afyonkarahisar'&&t.to==='Kahramanmaraş'&&t.cap===20)&&document.querySelectorAll('.load[data-tid]').length===trucks.length"))
            page.locator('.load[data-tid]').first.click();check(prefix+"araç detayını kapatmak erişilir",page.is_visible('.detail-top #close'));page.click('#close')
            for screen in ('list','post','mine','me'):
                page.click(f'nav [data-t={screen}]')
                check(prefix+screen+" yatay taşmaz",page.evaluate("document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#main').scrollWidth<=document.querySelector('#main').clientWidth+1"))
            if width==1280: check(prefix+"masaüstü geniş alanı kullanır",page.locator('#app').bounding_box()['width']>1000)
            matrix.close()
    check("matris sayfa hatası yok",not errors)
    b.close()

srv.shutdown()
fail = results.count(False)
print(f"\n{len(results) - fail}/{len(results)} uçtan uca kontrol geçti")
sys.exit(1 if fail else 0)
