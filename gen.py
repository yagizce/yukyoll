"""NakGo logo üretici. Gerekenler: Python, fontTools, Playwright (Chromium). Çalıştır: python3 gen.py [çıktı_klasörü]
SVG logoyu çizer, yazıyı Poppins Bold'dan yola çevirir ve PNG'leri Chromium ile üretir."""
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)
NAVY, NAVY2, CREAM, AMBER = "#12395f", "#2a5f99", "#fff4d6", "#ffc93c"
FP = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
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

GRAD = '<linearGradient id="g{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24f"/><stop offset="1" stop-color="#f0a30a"/></linearGradient>'
def tile(uid, tx, ty, T, scale=1.0, full=False):
    rx = 0 if full else T * 15 / 64
    return (f'<defs>{GRAD.format(u=uid)}</defs><rect x="{num(tx)}" y="{num(ty)}" width="{num(T)}" height="{num(T)}" rx="{num(rx)}" fill="url(#g{uid})"/>'
            f'<g transform="translate({num(tx)} {num(ty)}) scale({num(T/64)})">{mark(uid, scale)}</g>')

def svg(w, h, body, bg=None):
    r = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{r}{body}</svg>'

files = {}
files["icon.svg"] = svg(64, 64, tile("a", 0, 0, 64, 1.0))
files["brand/logo-mark.svg"] = svg(128, 128, tile("b", 0, 0, 128, 1.0))
wd, ww = word("NakGo", 84); H, gap = 130, 28; W = int(H + gap + ww + 6)
txt = lambda fill, uid: f'<path transform="translate({H+gap} {num(H/2+84*.36)})" d="{wd}" fill="{fill}"/>'
files["brand/logo-horizontal.svg"] = svg(W, H, tile("c", 0, 0, H) + txt(NAVY, "c"))
files["brand/logo-horizontal-light.svg"] = svg(W + 60, H + 60, f'<g transform="translate(30 30)">{tile("d",0,0,H)}{txt("#fff","d")}</g>', bg=NAVY)
T = 220; wd2, ww2 = word("NakGo", 96); VW = int(max(T, ww2) + 80); VH = T + 40 + 96 + 20
files["brand/logo-vertical.svg"] = svg(VW, VH, tile("e", (VW - T) / 2, 10, T) + f'<path transform="translate({num((VW-ww2)/2)} {num(10+T+30+96*.72)})" d="{wd2}" fill="{NAVY}"/>')
files["brand/logo-app-full.svg"] = svg(64, 64, tile("f", 0, 0, 64, .86, full=True))
for name, content in files.items():
    p = os.path.join(OUT, name); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w", encoding="utf-8").write(content)
json.dump({"wordmark": wd, "wordmark_w": ww, "truck": truck("x"), "mark_g": mark("x", 1.0)}, open(os.path.join(OUT, "parts.json"), "w"))

# PNG'ler (Chromium ile)
from playwright.sync_api import sync_playwright
def render(page, svg_text, w, h, path, transparent=True):
    page.set_viewport_size({"width": w, "height": h})
    page.set_content(f"<body style='margin:0;background:transparent'>{svg_text.replace('<svg ', f'<svg style=\"display:block;width:{w}px;height:{h}px\" ', 1)}</body>")
    page.screenshot(path=path, omit_background=transparent)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
    render(pg, files["icon.svg"], 512, 512, os.path.join(OUT, "icons/icon-512.png"))
    render(pg, files["icon.svg"], 192, 192, os.path.join(OUT, "icons/icon-192.png"))
    render(pg, svg(64, 64, tile("m", 0, 0, 64, .72, full=True)), 512, 512, os.path.join(OUT, "icons/icon-maskable-512.png"))
    render(pg, files["brand/logo-app-full.svg"], 180, 180, os.path.join(OUT, "icons/apple-touch-icon.png"))
    for n, k in (("logo-horizontal", 4), ("logo-horizontal-light", 4)):
        s = files[f"brand/{n}.svg"]; w = int(s.split('width="')[1].split('"')[0]); h = int(s.split('height="')[1].split('"')[0])
        render(pg, s, w * k, h * k, os.path.join(OUT, f"brand/{n}.png"), transparent=(n == "logo-horizontal"))
    s = files["brand/logo-vertical.svg"]; render(pg, s, VW * 3, VH * 3, os.path.join(OUT, "brand/logo-vertical.png"))
    b.close()
print("tamam", OUT)
