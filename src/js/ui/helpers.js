/**
 * Ekranlar ve araçlar
 * Ana çizim işlevi, ilan ve boş araç detayı, alt pencere, gezinti; yakıt hesabı, tema, paylaşma.
 */

// ===== Araçlar =====
// Yakıt hesabı, tema, paylaşma ve derin bağlantı, çevrimdışı uyarısı.


const APPURL = (() => {
    try {
        return location.origin + location.pathname;
    }
    catch (e) {
        return "";
    }
})();

function deep() {
    if (deepId && loads.some(x => x.id === deepId)) {
        const i = deepId;
        deepId = 0;
        openLoad(i);
    }
}

function shareLoad(l) {
    track("sh", l.id);
    const url = APPURL + "#l=" + l.id, text = dec(l.from + " → " + l.to + " · " + l.cargo + " · " + l.ton + " ton · " + fmt(l.price));
    const copy = () => {
        if (navigator.clipboard)
            navigator.clipboard.writeText(text + " " + url).then(() => toast("Bağlantı kopyalandı")).catch(() => toast("Kopyalanamadı"));
        else
            toast("Paylaşım bu cihazda desteklenmiyor");
    };
    if (navigator.share)
        navigator.share({ title: "NakGo", text, url }).catch(e => {
            if (!e || e.name !== "AbortError")
                copy();
        });
    else
        copy();
}

const themeIcon = () => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${isDark() ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' : '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'}</svg>`;

function updTheme() {
    const b = $("#thh");
    if (b)
        b.innerHTML = themeIcon();
    try {
        const m = document.querySelector('meta[name="theme-color"]');
        if (m)
            m.content = "#006970";
    }
    catch (e) { }
}

function toggleTheme() {
    const r = document.documentElement, d = isDark();
    r.dataset.theme = d ? "light" : "dark";
    try {
        localStorage.setItem("yy-theme", r.dataset.theme);
    }
    catch (e) { }
    updTheme();
}

function openCalc() {
    const m = $("#sheetBody");
    m.dataset.k = "";
    const num = (k, t, u) => `<div><label>${t}</label><div class="unit"><input data-k="${k}" type="number" inputmode="decimal" value="${calc[k]}"><em>${u}</em></div></div>`;
    const cur = vehicles.find(v => CONS[v] === calc.cons) || "";
    m.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b style="font-size:19px">Yakıt hesabı</b><button class="chip" id="cx">Kapat</button></div><div class="res" id="res"></div>
    <label>Araç tipi</label><select id="cv"><option value="" hidden>Özel</option>${vehicles.map(v => `<option ${v === cur ? "selected" : ""}>${v}</option>`).join("")}</select>
    <div class="row">${num("km", "Mesafe", "km")}${num("fare", "Navlun", "₺")}</div>
    <details class="more"><summary>Diğer ayarlar</summary>
      <p style="font-size:12px;color:var(--mute);margin-top:12px">Mazot fiyatı hesaplama varsayımıdır; güncel pompa fiyatına göre değiştir.</p><div class="row">${num("fuel", "Mazot", "₺/L")}${num("cons", "Tüketim", "L/100km")}</div>
      <div class="row">${num("toll", "Otoyol", "₺")}${num("other", "Diğer", "₺")}</div>
      <label class="chk"><input type="checkbox" id="bk" ${calc.back ? "checked" : ""}>Dönüşte boş döneceğim</label>
    </details>`;
    const out = () => {
        const d = calc.km * (calc.back ? 2 : 1), fc = Math.round(d * calc.cons / 100 * calc.fuel), cost = fc + calc.toll + calc.other, net = Math.round(calc.fare - cost), pc = x => Math.round(x / Math.max(cost, 1) * 100);
        $("#res").innerHTML = `<span>Net kazanç</span><div class="big ${net < 0 ? "bad" : ""}">${fmt(net)}</div><div class="sub">Masraf ${fmt(Math.round(cost))} · ${d ? Math.round(net / d) + " ₺/km" : "—"}</div>
      <div class="bar"><i style="width:${pc(fc)}%;background:var(--accent)"></i><i style="width:${pc(calc.toll)}%;background:#fff"></i><i style="width:${pc(calc.other)}%;background:rgba(255,255,255,.4)"></i></div>
      <div class="leg"><span><b style="background:var(--accent)"></b>Yakıt ${fmt(fc)}</span><span><b style="background:#fff"></b>Otoyol ${fmt(calc.toll)}</span><span><b style="background:rgba(255,255,255,.4)"></b>Diğer ${fmt(calc.other)}</span></div>`;
    };
    m.querySelectorAll("[data-k]").forEach(i => i.oninput = () => {
        calc[i.dataset.k] = +i.value || 0;
        if (i.dataset.k === "cons")
            $("#cv").value = vehicles.find(v => CONS[v] === calc.cons) || "";
        out();
        save();
    });
    $("#cv").onchange = e => {
        calc.cons = CONS[e.target.value];
        m.querySelector('[data-k="cons"]').value = calc.cons;
        out();
        save();
    };
    $("#bk").onchange = e => {
        calc.back = e.target.checked;
        out();
        save();
    };
    out();
    $("#cx").onclick = closeSheet;
    $("#sheet").classList.add("open");
}

const netUI = () => {
    const o = $("#off");
    if (o)
        o.style.display = (typeof navigator !== "undefined" && navigator.onLine === false) ? "block" : "none";
};

// ===== Ekranlar =====
// Ana çizim işlevi (render), ilan ve boş araç detayı, alt pencere, sekme gezintisi.

const soft = () => {
    if (tab !== "post")
        render();
};


const demoNotice = () => !cloud ? `<p class="demo-note"><b>Demo modu</b> · Veriler bu cihazda tutulur. Yanıtlar ve test satın almaları simüledir; gerçek işlem yapılmaz.</p>` : "";
const screenHeading = (title, note) => `<div class="screen-heading"><h2>${title}</h2><p>${note}</p></div>`;
