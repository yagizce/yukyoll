/**
 * Ekranlar ve araçlar
 * Ana çizim işlevi, ilan ve boş araç detayı, alt pencere, gezinti; yakıt hesabı, tema, paylaşma.
 */

// ===== Araçlar =====
// Yakıt hesabı, tema, paylaşma ve derin bağlantı, çevrimdışı uyarısı.

const fuelCard = () => `<button class="fuel" id="fc"><span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M7 8h4M14 9h2a2 2 0 012 2v5a1.5 1.5 0 003 0V9l-3-3"/></svg></span><span><b>Yakıt hesabı</b><span>Yakıt maliyeti ve net kazanç</span></span><em>${calc.fuel} ₺/L</em></button>`;

const APPURL = (() => {
    try {
        return /(claude\.ai|claudeusercontent)/.test(location.host) ? "https://claude.ai/artifact/HFcno9RoAwySpHtUaJsVJG" : location.origin + location.pathname;
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
            m.content = isDark() ? "#075b60" : "#007f83";
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
      <p style="font-size:12px;color:var(--mute);margin-top:12px">Mazot: İstanbul pompa fiyatı, 4 Ekim 2026. Fiyat değişirse buradan güncelle.</p><div class="row">${num("fuel", "Mazot", "₺/L")}${num("cons", "Tüketim", "L/100km")}</div>
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

function render() {
    const m = $("#main");
    save();
    bell();
    const SEG = `<div class="seg"><button data-md="load" class="${mode === "load" ? "on" : ""}">Yükler</button><button data-md="truck" class="${mode === "truck" ? "on" : ""}">Boş araçlar</button></div>`;
    const segBind = () => m.querySelectorAll("[data-md]").forEach(b => b.onclick = () => {
        mode = b.dataset.md;
        render();
    });
    if (tab === "list") {
        const isT = mode === "truck";
        const ok = x => !x.closed && !expired(x, isT ? "truck" : "load") && !(x.uid && blocked.includes(x.uid)) && (!nearOn || !nearR || dKm(x) <= nearR) && match(x, isT) && (!q || (x.from + x.to + (x.cargo || x.who)).toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")));
        let items = isT ? trucks.filter(ok) : sortL(loads.filter(ok));
        if (nearOn && myPos)
            items = [...items].sort((a, b) => dKm(a) - dKm(b));
        items = [...items.filter(isF), ...items.filter(x => !isF(x))];
        const n = fcount(), ac = activeChips();
        {
            const sg = JSON.stringify([F, q, mode, sort, nearOn, nearR]);
            if (sg !== lastSig) {
                lastSig = sg;
                shown = 20;
            }
        }
        const kl = loads.filter(x => x.km), avg = kl.length ? Math.round(kl.reduce((a, x) => a + x.price / x.km, 0) / kl.length) : 0;
        const st = isT ? [[trucks.length, "boş araç"], [trucks.filter(x => x.date === "Bugün").length, "bugün müsait"], [Math.round(trucks.reduce((a, x) => a + x.cap, 0)), "ton kapasite"]] : [[loads.filter(x => !x.closed).length, "açık ilan"], [loads.filter(x => x.date === "Bugün").length, "bugün yükleme"], [avg, "ort. ₺/km"]];
        const hero = `<div class="hero">${st.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join("")}</div>`;
        m.innerHTML = routeSearch() + SEG + (!cloud ? '<p class="demo-note"><b>Demo modu</b> · Örnek ilanlar ve teklifler deneme amaçlıdır; gerçek taşıma talebi değildir.</p>' : "") + `<div class="row listing-search" style="margin-bottom:12px"><input class="search" id="q" aria-label="İlanlarda ara" placeholder="${isT ? "Şehir veya taşıyıcı ara" : "Şehir veya yük ara"}" value="${q}" style="margin:0"><button class="chip ${n ? "on" : ""}" id="fb" style="flex:none;display:flex;gap:6px;align-items:center">${FI}Filtre${n ? `<b class="bdg">${n}</b>` : ""}</button></div>
    ${nearRow()}${ac.length ? `<div class="chips active-filters wrap">${ac.map(c => `<button class="chip on" data-x="${c[0]}" data-v="${c[1]}">${c[2]} ×</button>`).join("")}</div>` : ""}
    <div class="meta" style="margin:0 2px 10px"><span>${items.length} ${isT ? "boş araç" : "ilan"}${!isT && (F.from || F.to) ? ` <button class="chip" id="al" style="margin-left:6px;padding:4px 10px;font-size:12px">Alarm kur</button>` : ""}</span>${isT ? "" : `<select id="s" aria-label="İlanları sırala" style="width:auto;padding:5px 30px 5px 12px;font-size:16px;border-radius:99px"><option value="new">En yeni</option><option value="price" ${sort === "price" ? "selected" : ""}>Ücret ↓</option><option value="km" ${sort === "km" ? "selected" : ""}>Mesafe ↑</option><option value="rate" ${sort === "rate" ? "selected" : ""}>Puan ↓</option></select>`}</div>
    ${!loaded ? SKEL : items.length ? items.slice(0, shown).map(isT ? tCard : lCard).join("") + (items.length > shown ? `<button class="chip" id="more" style="display:block;margin:4px auto 12px">Daha fazla göster (${items.length - shown})</button>` : "") : `<div class="empty">Bu filtrelere uyan ${isT ? "boş araç" : "ilan"} yok.<br><button class="chip" id="rs" style="margin-top:12px">Filtreleri sıfırla</button></div>`}${cmpBar()}<section class="market-stats" aria-label="Pazar özeti"><h2>Pazar özeti</h2>${hero}</section>`;
        segBind();
        m.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => {
            e.stopPropagation();
            const f = b.dataset.fav, was = favs.includes(f);
            tog(favs, f);
            if (/^\d+$/.test(f))
                (was ? untrack : track)("s", +f);
            render();
        });
        $("#q").oninput = e => {
            q = e.target.value;
            const p = e.target.selectionStart;
            render();
            const i = $("#q");
            i.focus();
            i.setSelectionRange(p, p);
        };
        $("#fb").onclick = openFilter;
        m.querySelectorAll("[data-route]").forEach(e => e.onchange = () => {
            F[e.dataset.route] = e.value;
            render();
            $("[data-route=\"" + e.dataset.route + "\"]").focus();
        });
        $("#route-swap").onclick = () => {
            [F.from, F.to] = [F.to, F.from];
            render();
            $("#route-swap").focus();
        };
        if ($("#al"))
            $("#al").onclick = addAlert;
        if ($("#more"))
            $("#more").onclick = () => {
                shown += 20;
                render();
            };
        $("#nr0").onclick = toggleNear;
        m.querySelectorAll("[data-nr]").forEach(b => b.onclick = () => {
            nearR = +b.dataset.nr;
            render();
        });
        if ($("#cmpgo"))
            $("#cmpgo").onclick = openCompare;
        if ($("#cmpx"))
            $("#cmpx").onclick = () => {
                cmp = [];
                render();
            };
        if ($("#s"))
            $("#s").onchange = e => {
                sort = e.target.value;
                render();
            };
        if ($("#rs"))
            $("#rs").onclick = () => {
                F = F0();
                q = "";
                nearOn = false;
                render();
            };
        m.querySelectorAll("[data-x]").forEach(b => b.onclick = () => rmF(b.dataset.x, b.dataset.v));
        m.querySelectorAll("[data-tid]").forEach(b => b.onclick = () => openTruck(b.dataset.tid));
        m.querySelectorAll("[data-id]").forEach(b => {
            b.onclick = () => openLoad(+b.dataset.id);
            b.onkeydown = e => {
                if (e.target === b && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    openLoad(+b.dataset.id);
                }
            };
        });
    }
    if (tab === "post") {
        const opt = a => a.map(c => `<option>${c}</option>`).join("");
        const PS = `<div class="seg"><button data-pm="load" class="${postMode === "load" ? "on" : ""}">Yük ilanı</button><button data-pm="truck" class="${postMode === "truck" ? "on" : ""}">Boş araç ilanı</button></div>`;
        const pb = () => m.querySelectorAll("[data-pm]").forEach(b => b.onclick = () => {
            postMode = b.dataset.pm;
            render();
        });
        if (postMode === "truck") {
            m.innerHTML = PS + `<label>Nereden</label><select id="f">${opt2(cities, "İstanbul")}</select><label>Nereye</label><select id="t">${opt2(cities, "Ankara")}</select><div class="row"><div><label>Araç tipi</label><select id="v">${opt(vehicles)}</select></div><div><label>Boş kapasite (ton)</label><input id="w" type="number" value="10"></div></div><label>Kasa tipi</label><select id="bd">${opt(bodies)}</select><label>Müsait olduğun gün</label><select id="d">${opt(["Bugün", "Yarın", "Bu hafta"])}</select><button class="btn" id="go">Boş aracı yayınla</button>`;
            pb();
            $("#go").onclick = () => {
                if ($("#f").value === $("#t").value)
                    return toast("Çıkış ve varış şehri farklı olmalı");
                if (!(+$("#w").value > 0))
                    return toast("Boş kapasiteyi gir");
                postTruck({ id: "t" + Date.now(), who: "Ben (Yağız)", from: $("#f").value, to: $("#t").value, veh: $("#v").value, cap: +$("#w").value, body: $("#bd").value, date: $("#d").value, rate: "Yeni" });
                mode = "truck";
                tab = "list";
                setNav();
                render();
                toast("Boş araç ilanı yayınlandı");
            };
            return;
        }
        m.innerHTML = PS + `<label>Nereden</label><select id="f">${opt2(cities, "İstanbul")}</select>
    <label>Nereye</label><select id="t">${opt2(cities, "Ankara")}</select>
    <label>Yük cinsi</label><input id="c" placeholder="Örn. Paletli gıda">
    <div class="row"><div><label>Ağırlık (ton)</label><input id="w" type="number" min="1" value="10"></div>
    <div><label>Araç tipi</label><select id="v">${opt(vehicles)}</select></div></div>
    <div class="row"><div><label>Kasa tipi</label><select id="b">${opt(bodies)}</select></div>
    <div><label>Ödeme</label><select id="y">${opt(["Peşin", "Teslimde nakit", "15 gün vade", "30 gün vade"])}</select></div></div>
    <label>Yükleme günü</label><select id="d">${opt(["Bugün", "Yarın", "Bu hafta"])}</select>
    <label>Not (isteğe bağlı)</label><input id="n" placeholder="Yükleme saati, özel koşullar">
    <label>Teklif edilen ücret (₺)</label><input id="p" type="number" min="0" placeholder="15000">
    <div id="sg"></div><label>Yük kalemleri (isteğe bağlı)</label><div id="its"></div><button class="chip" id="addit" type="button" style="margin-top:8px">+ Kalem ekle</button><label>Fotoğraf (isteğe bağlı)</label><div style="display:flex;align-items:center;gap:10px"><button class="chip" id="ph" type="button">Fotoğraf ekle</button><span id="phs"></span></div><button class="btn" id="go">İlanı yayınla</button>`;
        pb();
        sugg();
        itemsUI();
        $("#go").onclick = () => {
            const l = { id: Date.now(), from: $("#f").value, to: $("#t").value, cargo: $("#c").value.trim(), ton: +$("#w").value, veh: $("#v").value, price: +$("#p").value, date: $("#d").value, body: $("#b").value, pay: $("#y").value, note: $("#n").value.trim(), owner: "Ben (Yağız)" };
            if (l.from === l.to)
                return toast("Çıkış ve varış şehri farklı olmalı");
            if (!l.cargo || !(l.price > 0) || !(l.ton > 0))
                return toast("Yük cinsi, ağırlık ve ücreti gir");
            if (myCar.phone)
                l.phone = myCar.phone;
            if (postImg)
                l.img = postImg;
            const its = [...document.querySelectorAll("#its .itrow")].map(w => ({ n: w.querySelector("[data-in]").value.trim().slice(0, 40), q: +w.querySelector("[data-iq]").value || 0, u: w.querySelector("[data-iu]").value })).filter(x => x.n).slice(0, 6);
            if (its.length)
                l.items = its;
            postImg = "";
            if (cloud) {
                l.uid = me;
                l.ts = Date.now();
                delete l.owner;
                dbw(db.doc("loads/" + l.id).set(l));
            }
            if (!cloud)
                l.mine = true;
            loads.unshift(l);
            tab = "list";
            setNav();
            render();
            toast("İlan yayınlandı");
        };
    }
    if (tab === "mine") {
        m.innerHTML = incHTML() + (offers.length ? offers.map(o => `<div class="load" style="cursor:default"><div class="route">${o.from}<i></i>${o.to}</div>
    <div class="meta"><span class="st ${o.status === "ok" ? "ok" : o.status === "no" ? "no" : ""}">${offerExp(o) ? "Süresi doldu" : STT[o.status]}${o.status === "counter" ? ": " + fmt(o.counter) : ""}</span><span class="price">${fmt(o.offer)}</span></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">${o.status === "counter" ? `<button class="chip on" data-ca="${o.id}">Karşı teklifi kabul et</button>` : ""}${o.status === "wait" || o.status === "counter" ? `<button class="chip" data-c="${o.id}">Geri çek</button>` : ""}<button class="chip" data-chat="o${o.id}_${o.bidder || ""}" data-who="${o.owner || (o.uid ? nm(o.uid) : "Yük sahibi")}">Mesaj</button>${callChip('data-cl="' + o.id + '"')}</div>${o.status === "ok" ? stageUI(o) + retHTML(o) : ""}</div>`).join("") : `<div class="empty">Henüz teklif vermedin. İlanlar sekmesinden bir yük seç.</div>`);
        m.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
            const o0 = offers.find(o => o.id === +b.dataset.c);
            offers = offers.filter(o => o.id !== +b.dataset.c);
            if (cloud && o0)
                dbw(db.doc(opath(o0)).delete());
            render();
            toast("Teklif geri çekildi");
        });
        m.querySelectorAll("[data-ca]").forEach(b => b.onclick = () => {
            const o = offers.find(x => x.id === +b.dataset.ca);
            oup(o, { status: "ok", offer: o.counter });
            toast("Anlaşma sağlandı");
        });
        m.querySelectorAll("[data-chat]").forEach(b => b.onclick = () => openChat(b.dataset.chat, b.dataset.who));
        m.querySelectorAll("[data-ia]").forEach(b => b.onclick = () => {
            oup(incoming[+b.dataset.ia], { status: "ok" });
            toast("Teklif kabul edildi");
        });
        m.querySelectorAll("[data-ir]").forEach(b => b.onclick = () => {
            oup(incoming[+b.dataset.ir], { status: "no" });
            toast("Teklif reddedildi");
        });
        m.querySelectorAll("[data-ik]").forEach(b => b.onclick = () => openCounter(incoming[+b.dataset.ik]));
        m.querySelectorAll("[data-rl]").forEach(b => b.onclick = () => openLoad(+b.dataset.rl));
        m.querySelectorAll("[data-sg]").forEach(b => {
            const [id, n] = b.dataset.sg.split("|");
            b.onclick = () => setStage(offers.find(o => o.id === +id), +n);
        });
        m.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => sendPod(offers.find(o => o.id === +b.dataset.sp)));
        m.querySelectorAll("[data-sv]").forEach(b => b.onclick = () => showPod(offers.find(o => o.id === +b.dataset.sv)));
        m.querySelectorAll("[data-ic]").forEach(b => b.onclick = () => setStage(incoming[+b.dataset.ic], 3));
        m.querySelectorAll("[data-iv]").forEach(b => b.onclick = () => showPod(incoming[+b.dataset.iv]));
        m.querySelectorAll("[data-cl]").forEach(b => b.onclick = () => {
            const o = offers.find(x => x.id === +b.dataset.cl);
            callTo(o && phoneOf(o));
        });
        m.querySelectorAll("[data-cli]").forEach(b => b.onclick = () => {
            const o = incoming[+b.dataset.cli];
            callTo(o && carrierPhone(o.bidder));
        });
        m.querySelectorAll("[data-bp]").forEach(b => b.onclick = () => {
            const o = incoming[+b.dataset.bp];
            if (o)
                openProfile({ uid: o.bidder, name: nm(o.bidder), lv: lvU(o.bidder) });
        });
        m.querySelectorAll("[data-bu]").forEach(b => b.onclick = () => blockUser((incoming[+b.dataset.bu] || {}).bidder));
        m.querySelectorAll("[data-rt]").forEach(b => b.onclick = () => openRate(offers.find(o => o.id === +b.dataset.rt), "carrier"));
        m.querySelectorAll("[data-ir2]").forEach(b => b.onclick = () => openRate(incoming[+b.dataset.ir2], "owner"));
    }
    if (tab === "me") {
        m.innerHTML = `<div style="display:flex;gap:14px;align-items:center"><div class="avatar">${(myName || "Y")[0].toUpperCase()}</div><div><b style="font-size:18px">${myName || "Yağız"}${vbadge(appr[me || "local"] === true ? 2 : cOk(myCar) ? 1 : 0)}</b><div style="color:var(--mute);font-size:14px">Taşıyıcı ve yük sahibi${myRate()}</div></div></div>
    <div class="stat"><div><b>${loads.length}</b><span>Açık ilan</span></div><div><b>${offers.length}</b><span>Verdiğim teklif</span></div></div>
    ${premCard()}${earnCard()}${phoneCard()}${roleCard()}${myListHTML()}${featSumCard()}${alertsCard()}${carCard()}${adminCard()}${reportsCard()}${blockedCard()}${installCard()}${helpCard()}`;
        carBind();
        listBind();
    }
}

function syncDetailViewport() {
    if (typeof window === "undefined" || !window || !window.visualViewport)
        return;
    const v = window.visualViewport, sheet = $("#sheet");
    sheet.style.setProperty("--detail-height", Math.floor(v.height * .92) + "px");
    sheet.style.setProperty("--keyboard-inset", Math.max(0, window.innerHeight - v.height - v.offsetTop) + "px");
}

function openLoad(id) {
    const l = loads.find(x => x.id === id);
    if (!l)
        return toast("İlan bulunamadı");
    track("v", id);
    const km = l.km || dist(l.from, l.to), fuelNet = km ? Math.round(l.price - km * (CONS[l.veh] || 22) / 100 * calc.fuel) : null;
    const kv = rows => rows.map(([a, b]) => `<div class="kv"><span>${a}</span><span>${b}</span></div>`).join("");
    $("#sheetBody").innerHTML = `<div class="load-detail">
      <div class="detail-top"><span>Yük ilanı <span class="detail-id">#${l.id}</span></span><button class="chip detail-close" id="close" aria-label="İlan detayını kapat">Kapat <span aria-hidden="true">×</span></button></div>
      <div class="detail-scroll" tabindex="0" aria-label="İlan bilgileri">
        <section class="detail-summary">${routeTitle(l)}<div class="listing-price"><strong class="price">${fmt(l.price)}</strong><span>Taşıma ücreti</span></div><div class="summary-tags"><span class="tag">Yükleme: ${l.date}</span>${isF(l) ? '<span class="tag ft">Öne çıkan</span>' : ""}</div></section>
        ${!cloud ? '<p class="demo-note"><b>Demo modu</b> · Bu ekrandaki örnek ilanlar ve teklifler deneme amaçlıdır.</p>' : ""}
        ${imgOk(l.img) ? `<img class="ph" src="${l.img}" alt="Yük fotoğrafı">` : ""}
        <section class="detail-group"><h2>Yük bilgileri</h2>${kv([["Yük türü", l.cargo], ["Tonaj", l.ton + " ton"], ...(Array.isArray(l.items) && l.items.length ? [["Kalemler", itemsTxt(l)]] : []), ["Yükleme tarihi", l.date]])}${l.note ? `<p class="detail-note">${l.note}</p>` : ""}</section>
        <section class="detail-group"><h2>Taşıma ve ödeme</h2>${kv([["Araç / kasa", l.veh + " · " + (l.body || "Belirtilmedi")], ["Ödeme şekli", l.pay || "Belirtilmedi"], ["Tahmini mesafe", km ? "≈ " + km + " km" : "Belirtilmedi"], ["Km başına ücret", km ? Math.round(l.price / km) + " ₺/km" : "—"], ["Yakıt sonrası tahmini kazanç", fuelNet !== null ? fmt(fuelNet) : "—"]])}<p class="estimate-note">Mesafe yaklaşık; kazanç yalnızca yakıt düşülerek hesaplanır (${calc.fuel} ₺/L). Otoyol ve diğer giderler dahil değildir.</p><button class="chip detail-calc" id="cc">Kâr hesapla</button></section>
        <section class="detail-group detail-route"><h2>Güzergâh</h2>${mapSVG(l.from, l.to)}</section>
        <section class="detail-group"><h2>Yük sahibi</h2><div class="owner-summary"><span class="owner-avatar" aria-hidden="true">${esc(String(l.owner || (l.uid ? nm(l.uid) : "Yük sahibi")).charAt(0))}</span><div><b>${l.owner || (l.uid ? nm(l.uid) : "Bireysel")}</b><p>${starTxt(l)} ${vbadge(l.uid ? lvU(l.uid) : 0)}</p></div></div><div class="detail-actions"><button class="chip" id="pf">Profili gör</button><button class="chip" id="call">Yük sahibini ara${isPrem() ? "" : '<b class="pm">Premium</b>'}</button></div></section>
        <div class="detail-actions"><button class="chip" id="sh">Paylaş</button><button class="chip" id="cp2">${cmp.includes(l.id) ? "Karşılaştırmadan çıkar" : "Karşılaştır"}</button><button class="chip" id="rp">Şikayet et</button>${l.uid && l.uid !== me ? '<button class="chip" id="bk2">Engelle</button>' : ""}</div>
      </div>
      <div class="offer-dock"><div><label for="o">Teklif tutarın</label><div class="offer-input"><input id="o" type="number" inputmode="numeric" min="1" step="1" value="${l.price}"><span aria-hidden="true">₺</span></div></div><button class="btn" id="send">Teklif ver <span aria-hidden="true">→</span></button></div>
    </div>`;
    $("#sheetBody").scrollTop = 0;
    syncDetailViewport();
    $("#sheet").classList.add("open");
    $("#close").onclick = closeSheet;
    $("#sh").onclick = () => shareLoad(l);
    $("#call").onclick = () => {
        track("c", l.id);
        callTo(phoneOf(l));
    };
    $("#cp2").onclick = () => toggleCmp(l.id);
    $("#pf").onclick = () => openProfile({ uid: l.uid, name: l.owner || (l.uid ? nm(l.uid) : "Yük sahibi"), lv: l.uid ? lvU(l.uid) : 0, rate: l.rate });
    $("#rp").onclick = () => openReport("l", l.id);
    if ($("#bk2"))
        $("#bk2").onclick = () => blockUser(l.uid);
    $("#cc").onclick = () => {
        calc = { ...calc, km: l.km || dist(l.from, l.to) || calc.km, cons: CONS[l.veh], fare: +$("#o").value || l.price };
        openCalc();
    };
    $("#send").onclick = () => {
        const v = +$("#o").value;
        if (!(v > 0))
            return toast("Teklif tutarını gir");
        if (cloud && l.uid === me)
            return toast("Kendi ilanına teklif veremezsin");
        offers = offers.filter(x => x.id !== l.id);
        const o = { ...l, offer: v, status: "wait", loadId: l.id, bidder: me, ownerUid: l.uid || "", ots: Date.now() };
        offers.unshift(o);
        if (cloud)
            dbw(db.doc(opath(o)).set({ loadId: l.id, bidder: me, ownerUid: l.uid || "", offer: v, status: "wait", ts: Date.now() }));
        closeSheet();
        toast("Teklif gönderildi");
        if (!l.uid)
            simulate(l.id);
    };
}

function openTruck(id) {
    const t = trucks.find(x => x.id === id);
    $("#sheetBody").innerHTML = `<div class="route">${t.from}<i></i>${t.to}</div>${mapSVG(t.from, t.to)}<div style="margin-top:10px">${[["Taşıyıcı", (t.who || nm(t.uid)) + (lvT(t) === 2 ? " ✓ Onaylı" : vok(t) ? " ✓ Belgeli" : "") + " · " + starTxt(t)], ["Araç", t.veh + " · " + t.body], ["Boş kapasite", t.cap + " ton"], ["Müsait", t.date]].map(([a, b]) => `<div class="kv"><span>${a}</span><span>${b}</span></div>`).join("")}</div><button class="btn" id="mg">Mesaj gönder</button><button class="btn alt" id="call">Taşıyıcıyı ara${isPrem() ? "" : '<b class="pm">Premium</b>'}</button><div class="chips" style="margin-top:14px"><button class="chip" id="pf">Profili gör</button><button class="chip" id="rp">Şikayet et</button>${t.uid && t.uid !== me ? '<button class="chip" id="bk2">Engelle</button>' : ""}</div><button class="btn alt" id="close">Kapat</button>`;
    $("#sheet").classList.add("open");
    $("#close").onclick = closeSheet;
    $("#mg").onclick = () => openChat("t" + id, t.who || nm(t.uid));
    $("#call").onclick = () => callTo(phoneOf(t));
    $("#pf").onclick = () => openProfile({ uid: t.uid, name: t.who || nm(t.uid), lv: lvT(t), rate: t.rate });
    $("#rp").onclick = () => openReport("t", t.id);
    if ($("#bk2"))
        $("#bk2").onclick = () => blockUser(t.uid);
}

function closeSheet() {
    if (unChat) {
        unChat();
        unChat = null;
    }
    $("#sheetBody").dataset.k = "";
    $("#sheet").classList.remove("open");
}

function setNav() {
    document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
}
