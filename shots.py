"""Görsel kontrol: gerçek bir Chromium ile uygulamanın ekran görüntülerini alır ve JS hatalarını yazdırır.
Gereken: pip install playwright && playwright install chromium
Çalıştır:  python3 tests/shots.py   (görüntüler tests/shots/ klasörüne yazılır)"""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(os.path.dirname(__file__), "shots"); os.makedirs(OUT, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, permissions=["geolocation"], geolocation={"latitude": 39.93, "longitude": 32.86}, locale="tr-TR")
    ctx.add_init_script("localStorage.setItem('yy-onb','1')")
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.join(ROOT, "index.html"))
    pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(OUT, "01_splash.png"))
    pg.wait_for_timeout(2200); pg.screenshot(path=os.path.join(OUT, "02_liste.png"))
    pg.evaluate("openLoad(1)"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(OUT, "03_detay.png"))
    pg.evaluate("closeSheet();toggleCmp(1);toggleCmp(2);openCompare()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(OUT, "04_karsilastirma.png"))
    pg.evaluate("closeSheet();offers=[{...loads[0],offer:28500,status:'ok',loadId:1,bidder:'',stage:3,doneAt:Date.now()}];tab='me';setNav();render()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(OUT, "05_profil.png"))
    pg.evaluate("tab='list';setNav();render()"); pg.click("#nr0"); pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(OUT, "06_yakinimda.png"))
    b.close()
print("JS hatası:", errs or "yok")
