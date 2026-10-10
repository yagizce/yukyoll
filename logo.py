"""NakGo logo üretici (tek kaynak). Çalıştır:  npm run logo   (veya  python3 tools/logo.py)
Üretir:
  icons/         uygulamanın kullandığı simgeler (git'e girer, yayına gider)
  export/svg     logo çıktıları: simge, yatay, yatay beyaz, dikey (git dışında, paylaşım için)
  export/png     aynıları PNG olarak, mağaza simgesi dahil
  export/mobile  Android/iOS kabuğu için simge ve açılış görselleri (bkz. docs/MOBIL-VE-MARKA.md)
Gerekenler:  pip install fonttools playwright  &&  playwright install chromium
Yazı tipi:   Poppins Bold (SIL Open Font License). tools/Poppins-Bold.ttf olarak koy
             (https://fonts.google.com/specimen/Poppins) veya NAKGO_FONT ortam değişkeniyle yol ver.
Logoyu değiştirmek için truck() ve tile() işlevlerini düzenle ve yeniden çalıştır.
Not: src/index.template.html içindeki başlık ve açılış ekranı logoları bu çizimin gömülü kopyasıdır; çizimi değiştirirsen onları da güncelle (sonra npm run bundle)."""
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOT
os.makedirs(OUT, exist_ok=True)
NAVY, NAVY2, CREAM, AMBER = "#007f83", "#21aaa5", "#fff4d6", "#ffd34e"
def _font():
    for p in (os.environ.get("NAKGO_FONT"), os.path.join(ROOT, "tools", "Poppins-Bold.ttf"), "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"):
        if p and os.path.exists(p): return p
    sys.exit("Poppins-Bold.ttf bulunamadı. tools/ klasörüne koy veya NAKGO_FONT ile yolunu ver.")
FP = _font()
F = TTFont(FP); gs = F.getGlyphSet(); cm = F.getBestCmap(); upm = F["head"].unitsPerEm
num = lambda v: ("%.1f" % v).rstrip("0").rstrip(".")

def word(text, size):
    s = size / upm; x = 0; d = ""
    for ch in text:
        g = cm[ord(ch)]; pen = SVGPathPen(gs, ntos=num)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0))); d += pen.getCommands(); x += F["hmtx"][g][0] * s
    return d, x

def truck(uid, wheel_ring=True):
    """64x64 ızgarada tır: kasa + >> okları, ayrı kabin, egzoz, tandem dingil, yol çizgisi."""
    wx = (16.5, 27.5, 50)
    m = "".join(f'<circle cx="{x}" cy="46.5" r="6.5" fill="#000"/>' for x in wx)
    mask = f'<mask id="mk{uid}"><rect width="64" height="64" fill="#fff"/>{m}</mask>'
    wheels = "".join(f'<circle cx="{x}" cy="46.5" r="5.2" fill="{NAVY}"/><circle cx="{x}" cy="46.5" r="3.4" fill="none" stroke="{NAVY2}" stroke-width=".8"/><circle cx="{x}" cy="46.5" r="2" fill="{CREAM}"/>' for x in wx)
    return (f'<defs>{mask}</defs>'
      f'<rect x="10" y="18" width="29" height="22" rx="2.5" fill="{NAVY}"/>'
      f'<path d="M10 20.5A2.5 2.5 0 0 1 12.5 18h24A2.5 2.5 0 0 1 39 20.5V22H10z" fill="{NAVY2}"/>'
      f'<path d="M18 25l6 5.5-6 5.5" fill="none" stroke="{AMBER}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
      f'<path d="M26 25l6 5.5-6 5.5" fill="none" stroke="#ffe7a3" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
      f'<rect x="39" y="35" width="3" height="3.2" fill="{NAVY}"/>'
      f'<rect x="43.4" y="19.5" width="1.9" height="6" rx=".95" fill="{NAVY}"/>'
      f'<path d="M42 40V27a3 3 0 0 1 3-3h5.6a3 3 0 0 1 2.4 1.2l5.6 8.2V40z" fill="{NAVY}"/>'
      f'<path d="M45.6 27.4h4.4l3.8 5.2h-8.2z" fill="{CREAM}"/>'
      f'<circle cx="57.3" cy="36.6" r="1.2" fill="{AMBER}"/>'
      f'<rect x="10" y="40" width="48.6" height="3.4" rx="1.7" fill="{NAVY}" mask="url(#mk{uid})"/>'
      f'{wheels}'
      f'<path d="M7 54h50" stroke="{NAVY}" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="7 4"/>')

def mark(uid, scale=1.0):
    return f'<g transform="translate(32 32) scale({num(scale)}) translate(-34.3 -36.5)">{truck(uid)}</g>'

GRAD = '<linearGradient id="g{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24f"/><stop offset="1" stop-color="#ffd34e"/></linearGradient>'
def tile(uid, tx, ty, T, scale=1.0, full=False):
    rx = 0 if full else T * 15 / 64
    return (f'<defs>{GRAD.format(u=uid)}</defs><rect x="{num(tx)}" y="{num(ty)}" width="{num(T)}" height="{num(T)}" rx="{num(rx)}" fill="url(#g{uid})"/>'
            f'<g transform="translate({num(tx)} {num(ty)}) scale({num(T/64)})">{mark(uid, scale)}</g>')

def svg(w, h, body, bg=None):
    r = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{r}{body}</svg>'

files = {}
icon_svg = svg(64, 64, tile("a", 0, 0, 64, 1.0))
files["icons/icon.svg"] = icon_svg
files["export/svg/nakgo-icon.svg"] = svg(128, 128, tile("b", 0, 0, 128, 1.0))
files["export/svg/nakgo-icon-fullbleed.svg"] = svg(64, 64, tile("f", 0, 0, 64, .86, full=True))
wd, ww = word("NakGo", 84); H, gap = 130, 28; W = int(H + gap + ww + 6)
txt = lambda fill: f'<path transform="translate({H+gap} {num(H/2+84*.36)})" d="{wd}" fill="{fill}"/>'
files["export/svg/nakgo-logo-horizontal.svg"] = svg(W, H, tile("c", 0, 0, H) + txt(NAVY))
files["export/svg/nakgo-logo-horizontal-white.svg"] = svg(W + 60, H + 60, f'<g transform="translate(30 30)">{tile("d",0,0,H)}{txt("#fff")}</g>', bg=NAVY)
T = 220; wd2, ww2 = word("NakGo", 96); VW = int(max(T, ww2) + 80); VH = T + 40 + 96 + 20
files["export/svg/nakgo-logo-vertical.svg"] = svg(VW, VH, tile("e", (VW - T) / 2, 10, T) + f'<path transform="translate({num((VW-ww2)/2)} {num(10+T+30+96*.72)})" d="{wd2}" fill="{NAVY}"/>')
for name, content in files.items():
    p = os.path.join(OUT, name); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w", encoding="utf-8").write(content)

from playwright.sync_api import sync_playwright
def render(page, svg_text, w, h, path, transparent=True):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page.set_viewport_size({"width": w, "height": h})
    page.set_content(f"<body style='margin:0;background:transparent'>{svg_text.replace('<svg ', f'<svg style=\"display:block;width:{w}px;height:{h}px\" ', 1)}</body>")
    page.screenshot(path=path, omit_background=transparent)
P = lambda *a: os.path.join(OUT, *a)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    render(pg, icon_svg, 512, 512, P("icons/icon-512.png")); render(pg, icon_svg, 192, 192, P("icons/icon-192.png"))
    render(pg, svg(64, 64, tile("m", 0, 0, 64, .72, full=True)), 512, 512, P("icons/icon-maskable-512.png"))
    render(pg, files["export/svg/nakgo-icon-fullbleed.svg"], 180, 180, P("icons/apple-touch-icon.png"))
    render(pg, icon_svg, 1024, 1024, P("export/png/nakgo-icon-1024.png"))
    for n in ("horizontal", "horizontal-white"):
        s = files[f"export/svg/nakgo-logo-{n}.svg"]; w = int(s.split('width="')[1].split('"')[0]); h = int(s.split('height="')[1].split('"')[0])
        render(pg, s, w * 4, h * 4, P(f"export/png/nakgo-logo-{n}.png"), transparent=(n == "horizontal"))
    render(pg, files["export/svg/nakgo-logo-vertical.svg"], VW * 3, VH * 3, P("export/png/nakgo-logo-vertical.png"))
    b.close()
print("Logolar üretildi:", OUT)

# --- Mobil kabuk (Capacitor) ve mağaza varlıkları ---
fg = svg(64, 64, f'<g transform="translate(32 32) scale(.62) translate(-34.3 -36.5)">{truck("g")}</g>')
bgsvg = svg(64, 64, f'<defs>{GRAD.format(u="bg")}</defs><rect width="64" height="64" fill="url(#gbg)"/>')
def splash(bgc):
    S = 2732; tw = 560; wdS, wwS = word("NakGo", 230)
    return svg(S, S, f'<rect width="{S}" height="{S}" fill="{bgc}"/>' + tile("s", (S - tw) / 2, 900, tw) + f'<path transform="translate({num((S-wwS)/2)} {num(900+tw+300)})" d="{wdS}" fill="#fff"/>')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    render(pg, files["export/svg/nakgo-icon-fullbleed.svg"], 1024, 1024, P("export/mobile/icon-only.png"), transparent=False)
    render(pg, files["export/svg/nakgo-icon-fullbleed.svg"], 1024, 1024, P("export/png/nakgo-icon-fullbleed-1024.png"), transparent=False)
    render(pg, fg, 1024, 1024, P("export/mobile/icon-foreground.png"))
    render(pg, bgsvg, 1024, 1024, P("export/mobile/icon-background.png"), transparent=False)
    render(pg, splash(NAVY), 2732, 2732, P("export/mobile/splash.png"), transparent=False)
    render(pg, splash("#0b2540"), 2732, 2732, P("export/mobile/splash-dark.png"), transparent=False)
    b.close()
print("Mobil varlıklar üretildi: export/mobile")
