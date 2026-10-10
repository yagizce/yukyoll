/**
 * İlan listesi ve ilanlarım
 * Liste kartları, filtre, sıralama, yakınımda, karşılaştırma, piyasa fiyatı; kendi ilanlarını düzenleme, kapatma ve silme.
 */

// ===== İlan listesi =====
// Liste kartları, filtre, sıralama, yakınımda, iki ilanı karşılaştırma, piyasa fiyatı.

function F0() {
    return { veh: [], body: [], pay: [], date: [], from: "", to: "", tonMin: "", tonMax: "", priceMin: "", rate: 0, fav: false, ok: false };
}

function match(x, isT) {
    if (F.veh.length && !F.veh.includes(x.veh))
        return 0;
    if (F.body.length && !F.body.includes(x.body))
        return 0;
    if (F.from && x.from !== F.from)
        return 0;
    if (F.to && x.to !== F.to)
        return 0;
    const t = isT ? x.cap : x.ton;
    if (F.tonMin !== "" && t < +F.tonMin)
        return 0;
    if (F.tonMax !== "" && t > +F.tonMax)
        return 0;
    if (F.date.length && !F.date.includes(dk(x.date)))
        return 0;
    const rr = x.uid && ratingOf(x.uid) ? ratingOf(x.uid).avg : x.rate;
    if (F.rate && !(rr >= F.rate))
        return 0;
    if (F.fav && !favs.includes(String(x.id)))
        return 0;
    if (F.ok && isT && !vok(x))
        return 0;
    if (!isT) {
        if (F.pay.length && !F.pay.includes(x.pay))
            return 0;
        if (F.priceMin !== "" && x.price < +F.priceMin)
            return 0;
    }
    return 1;
}

function fcount() {
    return ["veh", "body", "pay", "date"].filter(k => F[k].length).length + (F.from ? 1 : 0) + (F.to ? 1 : 0) + ((F.tonMin !== "" || F.tonMax !== "") ? 1 : 0) + (F.priceMin !== "" ? 1 : 0) + (F.rate ? 1 : 0) + (F.fav ? 1 : 0) + (F.ok ? 1 : 0);
}

function activeChips() {
    const a = [];
    ["veh", "body", "pay", "date"].forEach(k => F[k].forEach(v => a.push([k, v, v])));
    if (F.from)
        a.push(["from", "", "Çıkış: " + F.from]);
    if (F.to)
        a.push(["to", "", "Varış: " + F.to]);
    if (F.tonMin !== "" || F.tonMax !== "")
        a.push(["ton", "", (F.tonMin || 0) + "–" + (F.tonMax || "∞") + " ton"]);
    if (F.priceMin !== "")
        a.push(["priceMin", "", "en az " + fmt(+F.priceMin)]);
    if (F.rate)
        a.push(["rate", "", "★ " + F.rate + "+"]);
    if (F.fav)
        a.push(["fav", "", "♥ Kayıtlılar"]);
    if (F.ok)
        a.push(["ok", "", "✓ Belgeli"]);
    return a;
}

function rmF(k, v) {
    if (Array.isArray(F[k]))
        F[k] = F[k].filter(x => x !== v);
    else if (k === "ton") {
        F.tonMin = F.tonMax = "";
    }
    else
        F[k] = k === "rate" ? 0 : "";
    render();
}

const lCard = l => `<button class="load ${isF(l) ? "feat" : ""}" data-id="${l.id}"><div class="route">${l.from}<i></i>${l.to}</div><div style="margin-top:6px;font-size:14px;display:flex;gap:10px;align-items:center">${imgOk(l.img) ? `<img class="th" src="${l.img}" alt="">` : ""}<span>${l.cargo} · ${l.ton} ton${Array.isArray(l.items) && l.items.length ? " · " + l.items.length + " kalem" : ""}</span></div><div class="meta"><span><span class="tag">${l.veh}</span> ${isF(l) ? '<span class="tag ft">Öne çıkan</span> ' : ""}${l.date === "Bugün" ? '<span class="tag hot">Acil</span> ' : ""}&nbsp;${l.date}</span><span class="price">${fmt(l.price)}</span></div><div class="meta" style="margin-top:6px"><span>${nearTxt(l)}${l.km ? l.km + " km · " : ""}${l.body || ""}${ago(l) ? (l.km || l.body ? " · " : "") + ago(l) : ""}</span><span>${starTxt(l)} &nbsp;<span role="button" tabindex="0" aria-label="Kaydet" class="fav ${favs.includes(String(l.id)) ? "on" : ""}" data-fav="${l.id}">${favs.includes(String(l.id)) ? "♥" : "♡"}</span></span></div></button>`;

const tCard = t => `<button class="load ${isF(t) ? "feat" : ""}" data-tid="${t.id}"><div class="route">${t.from}<i></i>${t.to}</div><div style="margin-top:6px;font-size:14px">${t.who || nm(t.uid)}${vbadge(lvT(t))} · ${t.cap} ton boş kapasite</div><div class="meta"><span><span class="tag">${t.veh}</span> ${isF(t) ? '<span class="tag ft">Öne çıkan</span> ' : ""}${t.date === "Bugün" ? '<span class="tag hot">Bugün</span> ' : ""}&nbsp;${t.date}</span><span>${starTxt(t)}</span></div><div class="meta" style="margin-top:6px"><span>${nearTxt(t)}${t.body}</span><span role="button" tabindex="0" aria-label="Kaydet" class="fav ${favs.includes(String(t.id)) ? "on" : ""}" data-fav="${t.id}">${favs.includes(String(t.id)) ? "♥" : "♡"}</span></div></button>`;

function openFilter() {
    const isT = mode === "truck", B = $("#sheetBody");
    const cnt = () => (isT ? trucks : loads).filter(x => match(x, isT)).length;
    const grp = (k, t, o) => `<label>${t}</label><div class="chips wrap">${o.map(v => `<button class="chip ${F[k].includes(v) ? "on" : ""}" data-g="${k}" data-v="${v}">${v}</button>`).join("")}</div>`;
    const sel = (k, t, o) => `<div><label>${t}</label><select data-s="${k}"><option value="">Hepsi</option>${o.map(c => `<option ${F[k] === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>`;
    B.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">Filtrele</b><button class="chip" id="fr">Sıfırla</button></div>`
        + grp("veh", "Araç tipi", vehicles) + grp("body", "Kasa tipi", bodies)
        + `<div class="row">${sel("from", "Nereden", cities)}${sel("to", "Nereye", cities)}</div>`
        + `<div class="row"><div><label>${isT ? "Boş kapasite" : "Yük"}: en az (ton)</label><input data-n="tonMin" type="number" inputmode="decimal" value="${F.tonMin}"></div><div><label>En çok (ton)</label><input data-n="tonMax" type="number" inputmode="decimal" value="${F.tonMax}"></div></div>`
        + (isT ? "" : `<label>Ücret: en az (₺)</label><input data-n="priceMin" type="number" inputmode="numeric" value="${F.priceMin}">` + grp("pay", "Ödeme şekli", ["Peşin", "Teslimde nakit", "7 gün vade", "15 gün vade", "30 gün vade"]))
        + grp("date", "Yükleme günü", ["Bugün", "Yarın", "İleri tarih"])
        + `<label>Kayıtlılar</label><div class="chips"><button class="chip ${F.fav ? "on" : ""}" id="ff">♥ Sadece kayıtlı olanlar</button>${isT ? `<button class="chip ${F.ok ? "on" : ""}" id="fo">✓ Sadece belgeli taşıyıcılar</button>` : ""}</div><label>Puan</label><div class="chips">${[[0, "Hepsi"], [4.5, "★ 4.5+"], [4.8, "★ 4.8+"]].map(([v, t]) => `<button class="chip ${F.rate === v ? "on" : ""}" data-r="${v}">${t}</button>`).join("")}</div><button class="btn" id="fs" style="position:sticky;bottom:0"></button>`;
    const upd = () => {
        $("#fs").textContent = cnt() + (isT ? " boş aracı göster" : " ilanı göster");
    };
    B.querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
        tog(F[b.dataset.g], b.dataset.v);
        b.classList.toggle("on");
        upd();
    });
    B.querySelectorAll("[data-s]").forEach(e => e.onchange = () => {
        F[e.dataset.s] = e.value;
        upd();
    });
    B.querySelectorAll("[data-n]").forEach(e => e.oninput = () => {
        F[e.dataset.n] = e.value;
        upd();
    });
    B.querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
        F.rate = +b.dataset.r;
        B.querySelectorAll("[data-r]").forEach(x => x.classList.toggle("on", x === b));
        upd();
    });
    if ($("#fo"))
        $("#fo").onclick = e => {
            F.ok = !F.ok;
            e.currentTarget.classList.toggle("on", F.ok);
            upd();
        };
    $("#ff").onclick = e => {
        F.fav = !F.fav;
        e.currentTarget.classList.toggle("on", F.fav);
        upd();
    };
    $("#fr").onclick = () => {
        F = F0();
        openFilter();
    };
    $("#fs").onclick = () => {
        closeSheet();
        render();
    };
    upd();
    $("#sheet").classList.add("open");
}

function mkt(a, b, veh, ex) {
    const rt = x => x.km && x.price > 0 ? x.price / x.km : 0, L = loads.filter(x => x.id !== ex && rt(x)), same = L.filter(x => (x.from === a && x.to === b) || (x.from === b && x.to === a)), sv = L.filter(x => x.veh === veh), pool = same.length ? same : sv.length > 1 ? sv : L;
    return { rate: pool.length ? pool.reduce((t, x) => t + rt(x), 0) / pool.length : 45, n: pool.length };
}

const mk = l => {
    const km = l.km || dist(l.from, l.to);
    if (!km)
        return "—";
    const m = mkt(l.from, l.to, l.veh, l.id), d = Math.round((l.price / km / m.rate - 1) * 100);
    return (Math.abs(d) < 3 ? "Piyasa seviyesinde" : "%" + Math.abs(d) + (d > 0 ? " üstünde" : " altında")) + " · ort. " + Math.round(m.rate) + " ₺/km";
};

function sugg() {
    const f = $("#f"), t = $("#t"), v = $("#v"), g = $("#sg");
    if (!g)
        return;
    const up = () => {
        const km = dist(f.value, t.value);
        if (!km) {
            g.innerHTML = "";
            return;
        }
        const m = mkt(f.value, t.value, v.value, 0), pr = Math.round(km * m.rate / 100) * 100;
        g.innerHTML = `Önerilen ücret <b>${fmt(pr)}</b> · ${km} km · piyasa ${Math.round(m.rate)} ₺/km <button class="chip" id="sa" style="margin-left:6px">Uygula</button>`;
        $("#sa").onclick = () => {
            $("#p").value = pr;
        };
    };
    [f, t, v].forEach(e => e.onchange = up);
    up();
}

const dKm = x => myPos && LL[x.from] ? hav(myPos, LL[x.from]) : 9e9;

const nearTxt = x => nearOn && myPos && LL[x.from] ? `<b>Sana ${Math.round(dKm(x))} km</b> · ` : "";

function toggleNear() {
    if (nearOn) {
        nearOn = false;
        render();
        return;
    }
    if (myPos) {
        nearOn = true;
        render();
        return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation)
        return toast("Bu cihaz konumu desteklemiyor");
    toast("Konum alınıyor...");
    navigator.geolocation.getCurrentPosition(p => {
        myPos = [p.coords.longitude, p.coords.latitude];
        myCity = nearestCity(myPos);
        nearOn = true;
        render();
        toast("Konumun: " + myCity + " civarı");
    }, e => toast(e && e.code === 1 ? "Konum izni verilmedi. Tarayıcı ayarlarından izin verebilirsin." : "Konum alınamadı"), { timeout: 10000, maximumAge: 600000 });
}

const nearRow = () => `<div class="chips"><button class="chip ${nearOn ? "on" : ""}" id="nr0">Yakınımda${nearOn && myCity ? " · " + myCity : ""}</button>${nearOn ? [100, 250, 500, 0].map(k => `<button class="chip ${nearR === k ? "on" : ""}" data-nr="${k}">${k ? k + " km" : "Tümü"}</button>`).join("") : ""}</div>`;

function toggleCmp(id) {
    const i = cmp.indexOf(id);
    if (i >= 0)
        cmp.splice(i, 1);
    else {
        cmp.push(id);
        if (cmp.length > 2)
            cmp.shift();
    }
    closeSheet();
    render();
    toast(i >= 0 ? "Karşılaştırmadan çıkarıldı" : cmp.length === 2 ? "2 ilan seçildi, Karşılaştır'a dokun" : "1 ilan seçildi, bir tane daha seç");
}

const cmpBar = () => cmp.length ? `<div class="cmpbar"><span>${cmp.length} ilan seçildi</span><span style="display:flex;gap:6px"><button class="chip" id="cmpx">Temizle</button>${cmp.length === 2 ? '<button class="chip on" id="cmpgo">Karşılaştır</button>' : ""}</span></div>` : "";

function openCompare() {
    const L = cmp.map(id => loads.find(x => x.id === id)).filter(Boolean);
    if (L.length < 2)
        return toast("İki ilan seç");
    const B = $("#sheetBody");
    B.dataset.k = "";
    const km = l => l.km || dist(l.from, l.to), pk = l => km(l) ? Math.round(l.price / km(l)) : 0, net = l => km(l) ? Math.round(l.price - km(l) * (CONS[l.veh] || 22) / 100 * calc.fuel) : 0;
    const rows = [["Yük", l => l.cargo, null], ["Ağırlık", l => l.ton + " ton", null], ["Araç", l => l.veh + " · " + (l.body || "—"), null], ["Mesafe", l => km(l) ? km(l) + " km" : "—", l => -km(l)], ["Ücret", l => fmt(l.price), l => l.price], ["Km başı", l => pk(l) ? pk(l) + " ₺/km" : "—", pk], ["Tahmini net", l => km(l) ? fmt(net(l)) : "—", net], ["Ödeme", l => l.pay || "—", null], ["Yükleme", l => l.date, null], ["Puan", l => starTxt(l), rv]];
    const cell = (i, rw) => {
        const g = rw[1], sc = rw[2], win = sc && sc(L[0]) !== sc(L[1]) && sc(L[i]) === Math.max(sc(L[0]), sc(L[1]));
        return `<div class="${win ? "win" : ""}">${g(L[i])}</div>`;
    };
    B.innerHTML = `<b style="font-size:19px">İlanları karşılaştır</b><div class="cmp"><div></div>${L.map(l => `<div class="ch">${l.from}<br>→ ${l.to}</div>`).join("")}${rows.map(rw => `<div class="rl">${rw[0]}</div>${cell(0, rw)}${cell(1, rw)}`).join("")}</div><div class="row" style="margin-top:14px">${L.map(l => `<button class="chip" data-gl="${l.id}">İlana git</button>`).join("")}</div><button class="btn alt" id="close">Kapat</button>`;
    B.querySelectorAll("[data-gl]").forEach(b => b.onclick = () => openLoad(+b.dataset.gl));
    $("#close").onclick = closeSheet;
    $("#sheet").classList.add("open");
}

const sortL = a => sort === "price" ? [...a].sort((x, y) => y.price - x.price) : sort === "km" ? [...a].sort((x, y) => (x.km || 9e9) - (y.km || 9e9)) : sort === "rate" ? [...a].sort((x, y) => rv(y) - rv(x)) : a;

// ===== İlanlarım =====
// Kendi ilanlarını ve boş araçlarını düzenleme, kapatma, silme, ilan verirken kalem ve süre yardımcıları.

function postTruck(t) {
    if (myCar.phone)
        t.phone = myCar.phone;
    if (cloud) {
        t.uid = me;
        t.ts = Date.now();
        delete t.who;
        dbw(db.doc("trucks/" + t.id).set(t));
    }
    if (!cloud)
        t.mine = true;
    trucks.unshift(t);
}

const mineL = () => loads.filter(l => cloud ? l.uid === me : l.mine);

const mineT = () => trucks.filter(t => cloud ? t.uid === me : t.mine);

const findIt = (k, id) => (k === "l" ? loads : trucks).find(x => String(x.id) === String(id));

function patchIt(k, id, patch) {
    const it = findIt(k, id);
    if (!it)
        return;
    Object.assign(it, patch);
    if (cloud)
        dbw(db.doc((k === "l" ? "loads/" : "trucks/") + id).update(patch));
    render();
}

function openEdit(k, id) {
    const it = findIt(k, id);
    if (!it)
        return;
    const B = $("#sheetBody"), L = k === "l";
    B.dataset.k = "";
    B.innerHTML = `<b style="font-size:19px">İlanı düzenle</b><div class="route" style="margin-top:10px">${it.from}<i></i>${it.to}</div>${L ? `<label>Ücret (₺)</label><input id="ep" type="number" inputmode="numeric" value="${it.price}">` : `<label>Boş kapasite (ton)</label><input id="ep" type="number" inputmode="decimal" value="${it.cap}">`}<label>${L ? "Yükleme günü" : "Müsait olduğun gün"}</label><select id="ed">${[...new Set(["Bugün", "Yarın", "Bu hafta", it.date])].map(d => `<option ${it.date === d ? "selected" : ""}>${d}</option>`).join("")}</select>${L ? `<label>Not</label><input id="en" maxlength="200" value="${String(it.note || "").replace(/"/g, "&quot;")}">` : ""}<button class="btn" id="es">Kaydet</button><button class="btn alt" id="close">Vazgeç</button>`;
    $("#es").onclick = () => {
        const v = +$("#ep").value;
        if (!(v > 0))
            return toast("Geçerli bir değer gir");
        const patch = L ? { price: v, date: $("#ed").value, note: $("#en").value.trim().slice(0, 200) } : { cap: v, date: $("#ed").value };
        closeSheet();
        patchIt(k, id, patch);
        toast("İlan güncellendi");
    };
    $("#close").onclick = closeSheet;
    $("#sheet").classList.add("open");
}

function askDel(k, id) {
    const it = findIt(k, id);
    if (!it)
        return;
    const B = $("#sheetBody");
    B.dataset.k = "";
    B.innerHTML = `<b style="font-size:19px">İlan silinsin mi?</b><div class="route" style="margin-top:10px">${it.from}<i></i>${it.to}</div><p style="margin-top:10px;font-size:14px;color:var(--mute)">Bu işlem geri alınamaz.</p><button class="btn" id="yes">Evet, sil</button><button class="btn alt" id="close">Vazgeç</button>`;
    $("#yes").onclick = () => {
        if (cloud)
            dbw(db.doc((k === "l" ? "loads/" : "trucks/") + id).delete());
        if (k === "l")
            loads = loads.filter(x => String(x.id) !== String(id));
        else
            trucks = trucks.filter(x => String(x.id) !== String(id));
        closeSheet();
        render();
        toast("İlan silindi");
    };
    $("#close").onclick = closeSheet;
    $("#sheet").classList.add("open");
}

const myListHTML = () => {
    const a = [...mineL().map(l => ({ k: "l", id: l.id, r: l.from + " → " + l.to, v: fmt(l.price), c: l.closed || expired(l, "load"), s: statLine(l), ff: isF(l) ? Math.max(1, Math.ceil((l.featUntil - Date.now()) / 36e5)) : 0 })), ...mineT().map(t => ({ k: "t", id: t.id, r: t.from + " → " + t.to, v: t.cap + " ton", c: t.closed || expired(t, "truck"), ff: isF(t) ? Math.max(1, Math.ceil((t.featUntil - Date.now()) / 36e5)) : 0 }))];
    return `<div class="load" style="cursor:default"><b>İlanlarım</b>${a.length ? a.map(x => `<div class="kv" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">${x.r}</b><span>${x.v}</span></div>${x.s ? `<div style="font-size:12.5px;color:var(--mute);margin-top:4px">${x.s}</div>` : ""}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center"><span class="tag">${x.k === "l" ? "Yük" : "Boş araç"}${x.c ? " · kapalı" : ""}${x.ff ? ` · öne çıkan (${x.ff} sa)` : ""}</span><button class="chip" data-me="${x.k}|${x.id}">Düzenle</button>${x.k === "l" ? `<button class="chip" data-st2="${x.id}">İstatistik</button>` : ""}${!x.c ? `<button class="chip" data-ft="${x.k}|${x.id}">${x.ff ? "Uzat" : "Öne çıkar"}</button>` : ""}<button class="chip" data-mc="${x.k}|${x.id}">${x.c ? "Yeniden aç" : "Kapat"}</button><button class="chip" data-md2="${x.k}|${x.id}">Sil</button></div></div>`).join("") : `<p style="margin-top:8px;font-size:13px;color:var(--mute)">Henüz ilan vermedin. İlan ver sekmesinden ekleyebilirsin.</p>`}</div>`;
};

const itemsTxt = l => (Array.isArray(l.items) ? l.items : []).slice(0, 6).map(i => esc(i.n) + " " + (+i.q || 0) + " " + esc(i.u)).join(", ");

function itemsUI() {
    const box = $("#its");
    if (!box)
        return;
    postImg = "";
    const add = () => {
        if (box.children.length >= 6)
            return toast("En fazla 6 kalem");
        const d = document.createElement("div");
        d.className = "itrow";
        d.innerHTML = `<input data-in placeholder="Kalem" maxlength="40"><input data-iq type="number" inputmode="decimal" placeholder="Miktar"><select data-iu>${["ton", "kg", "palet", "koli", "adet", "m³"].map(u => `<option>${u}</option>`).join("")}</select><button class="chip" type="button" data-ix aria-label="Kaldır">×</button>`;
        box.appendChild(d);
        d.querySelector("[data-ix]").onclick = () => d.remove();
    };
    $("#addit").onclick = add;
    $("#ph").onclick = () => pickImg(u => {
        postImg = u;
        $("#phs").innerHTML = `<img class="th" src="${u}" alt="">`;
    }, 200, 22000);
}

const expired = (x, k) => !!(x.ts && Date.now() - x.ts > TTL[k] * 864e5);

const ago = x => {
    if (!x.ts)
        return "";
    const d = Math.floor((Date.now() - x.ts) / 864e5);
    return d < 1 ? "bugün eklendi" : d + " gün önce";
};
