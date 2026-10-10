/**
 * Teklifler, bildirimler ve mesajlaşma
 * Teklif ve karşı teklif, teslim aşamaları, bildirimler ve rota alarmı, teklif sohbeti.
 */

// ===== Teklifler =====
// Teklif, karşı teklif, simüle yanıt, teslim aşamaları ve teslim fotoğrafı, dönüş yükü önerisi.

const opath = o => "offers/" + o.loadId + "_" + o.bidder;

function oup(o, patch) {
    Object.assign(o, patch);
    if (cloud)
        dbw(db.doc(opath(o)).update(patch));
    render();
}

const retHTML = o => {
    const c = loads.filter(l => l.from === o.to && l.id !== o.id && !(l.uid && l.uid === me)).map(l => ({ l, sc: (l.to === o.from ? 2 : 0) + (l.veh === o.veh ? 1 : 0) })).sort((a, b) => b.sc - a.sc || b.l.price - a.l.price).slice(0, 2);
    return `<div class="ret"><b>Dönüşte boş kalma${c.length ? " · gidiş + dönüş " + fmt(o.offer + c[0].l.price) : ""}</b>` + (c.length ? c.map(({ l }) => `<button class="retc" data-rl="${l.id}"><span>${o.to} → ${l.to}${l.to === o.from ? " (eve dönüş)" : ""}</span><span>${l.veh} · ${fmt(l.price)}</span></button>`).join("") : `<span class="hint">${o.to} çıkışlı yük şu an yok. Boş araç ilanı verebilirsin.</span>`) + `</div>`;
};

function openCounter(o) {
    if (!o)
        return;
    const B = $("#sheetBody");
    B.dataset.k = "";
    B.innerHTML = `<b style="font-size:19px">Karşı teklif</b><div class="route" style="margin-top:10px">${o.from}<i></i>${o.to}</div><p style="margin-top:10px;font-size:14px;color:var(--mute)">Gelen teklif: ${fmt(o.offer)}</p><label>Senin teklifin (₺)</label><input id="ct" type="number" inputmode="numeric" value="${o.price}"><button class="btn" id="cs">Gönder</button><button class="btn alt" id="close">Vazgeç</button>`;
    $("#cs").onclick = () => {
        const v = +$("#ct").value;
        if (!(v > 0))
            return toast("Tutarı gir");
        oup(o, { status: "counter", counter: v });
        closeSheet();
        toast("Karşı teklif gönderildi");
    };
    $("#close").onclick = closeSheet;
    $("#sheet").classList.add("open");
}

const offerExp = o => o.status === "wait" && !!o.ots && Date.now() - o.ots > TTL.offer * 864e5;

const stepper = o => `<div class="steps">${STG.map((t, i) => `<span class="${i <= (o.stage || 0) ? "on" : ""}"><i></i>${t}</span>`).join("")}</div>`;

const podKey = o => o.loadId + "_" + o.bidder;

function setStage(o, n) {
    if (!o)
        return;
    o.stage = n;
    if (n === 3)
        o.doneAt = Date.now();
    if (cloud)
        dbw(db.doc(opath(o)).update(n === 3 ? { stage: n, doneAt: o.doneAt } : { stage: n }));
    if (tab === "mine")
        render();
    if (n === 2 && !o.ownerUid)
        setTimeout(() => {
            if ((o.stage || 0) === 2) {
                o.stage = 3;
                o.doneAt = Date.now();
                if (cloud)
                    dbw(db.doc(opath(o)).update({ stage: 3, doneAt: o.doneAt }));
                if (tab === "mine")
                    render();
                toast("Yük sahibi teslimi onayladı");
            }
        }, 3000);
}

function sendPod(o) {
    if (!o)
        return;
    pickImg(u => {
        pods[podKey(o)] = u;
        if (cloud)
            dbw(db.doc("pods/" + podKey(o)).set({ img: u }));
        setStage(o, 2);
        toast("Teslim fotoğrafı gönderildi");
    });
}

async function showPod(o) {
    if (!o)
        return;
    let u = pods[podKey(o)];
    if (!u && cloud) {
        try {
            const d = await db.doc("pods/" + podKey(o)).get();
            u = d.exists ? d.data().img : "";
        }
        catch (e) { }
    }
    showImg(u, "Teslim fotoğrafı");
}

const stageUI = o => {
    const n = o.stage || 0;
    return `<div class="ret">${stepper(o)}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${n === 0 ? `<button class="chip on" data-sg="${o.id}|1">Yükledim</button>` : n === 1 ? `<button class="chip on" data-sp="${o.id}">Teslim ettim · fotoğraf ekle</button>` : n === 2 ? `<span class="hint">Yük sahibinin onayı bekleniyor</span>` : `<span class="st ok">✓ Teslim onaylandı</span>`}${n === 3 ? (rates.some(x => x.k === rkey(o, "c")) ? `<span class="hint">Puanın verildi ✓</span>` : `<button class="chip on" data-rt="${o.id}">Yük sahibini puanla</button>`) : ""}${n >= 2 ? `<button class="chip" data-sv="${o.id}">Fotoğrafı gör</button>` : ""}</div></div>`;
};

const incHTML = () => incoming.length ? `<b style="font-size:16px">Gelen teklifler</b>` + incoming.map((o, i) => `<div class="load" style="cursor:default;margin:10px 0 12px"><div class="route">${o.from}<i></i>${o.to}</div><div class="meta"><span class="st ${o.status === "ok" ? "ok" : o.status === "no" ? "no" : ""}">${nm(o.bidder)}${vbadge(lvU(o.bidder))} · ${offerExp(o) ? "Süresi doldu" : STT[o.status]}${o.status === "counter" ? ": " + fmt(o.counter) : ""}</span><span class="price">${fmt(o.offer)}</span></div>${o.status === "ok" ? stepper(o) : ""}<div style="display:flex;gap:8px;margin-top:10px">${o.status === "wait" && !offerExp(o) ? `<button class="chip on" data-ia="${i}">Kabul et</button><button class="chip" data-ik="${i}">Karşı teklif</button><button class="chip" data-ir="${i}">Reddet</button>` : ""}${o.status === "ok" && (o.stage || 0) === 2 ? `<button class="chip on" data-ic="${i}">Teslimi onayla</button>` : ""}${o.status === "ok" && (o.stage || 0) >= 2 ? `<button class="chip" data-iv="${i}">Fotoğraf</button>` : ""}${o.status === "ok" && (o.stage || 0) === 3 && !rates.some(x => x.k === rkey(o, "o")) ? `<button class="chip on" data-ir2="${i}">Taşıyıcıyı puanla</button>` : ""}<button class="chip" data-chat="o${o.loadId}_${esc(o.bidder)}" data-who="${nm(o.bidder)}">Mesaj</button>${callChip('data-cli="' + i + '"')}<button class="chip" data-bp="${i}">Profil</button><button class="chip" data-bu="${i}">Engelle</button></div></div>`).join("") + `<b style="font-size:16px;display:block;margin-top:8px">Verdiğim teklifler</b>` : "";

function simulate(id) {
    setTimeout(() => {
        const o = offers.find(x => x.id === id);
        if (!o || o.status !== "wait")
            return;
        const r = o.offer / o.price;
        let p;
        if (r >= .92)
            p = { status: "ok" };
        else if (r >= .8)
            p = { status: "counter", counter: Math.round(o.price * .95 / 100) * 100 };
        else
            p = { status: "no" };
        Object.assign(o, p);
        if (cloud)
            dbw(db.doc(opath(o)).update(p));
        if (tab === "mine" || tab === "me")
            render();
        toast("Teklifine yanıt geldi");
    }, 3000);
}

// ===== Bildirim ve alarm =====
// Uygulama içi bildirimler, zil, rota alarmı.

function notifs() {
    const a = [], rt = o => o.from + " → " + o.to;
    incoming.forEach(o => {
        const k = "i" + o.loadId + "_" + o.bidder;
        if (o.status === "wait" && !offerExp(o))
            a.push({ k: k + "w", t: nm(o.bidder) + " " + fmt(o.offer) + " teklif verdi", s: rt(o) });
        if (o.status === "ok" && (o.stage || 0) === 2)
            a.push({ k: k + "s2", t: "Teslim edildi, onayını bekliyor", s: rt(o) });
    });
    offers.forEach(o => {
        const k = "o" + o.id;
        if (o.status === "ok")
            a.push({ k: k + "ok", t: "Teklifin kabul edildi", s: rt(o) });
        if (o.status === "no")
            a.push({ k: k + "no", t: "Teklifin reddedildi", s: rt(o) });
        if (o.status === "counter")
            a.push({ k: k + "c" + o.counter, t: "Karşı teklif geldi: " + fmt(o.counter), s: rt(o) });
        if (o.status === "ok" && (o.stage || 0) === 3)
            a.push({ k: k + "s3", t: "Teslim onaylandı", s: rt(o) });
    });
    alerts.forEach(al => loads.filter(l => !l.closed && (!al.from || l.from === al.from) && (!al.to || l.to === al.to) && (!al.veh || l.veh === al.veh) && !(l.uid && l.uid === me)).forEach(l => a.push({ k: "a" + al.id + "_" + l.id, t: "Alarm: " + (al.from || "Her yer") + " → " + (al.to || "Her yer") + " yeni yük", s: l.cargo + " · " + fmt(l.price), tab: "list" })));
    return a;
}

function bell() {
    const b = $("#bc");
    if (!b)
        return;
    const n = notifs().filter(x => !seen.has(x.k)).length;
    b.textContent = n > 9 ? "9+" : n;
    b.style.display = n ? "grid" : "none";
}

function openBell() {
    const a = notifs(), B = $("#sheetBody");
    B.dataset.k = "";
    B.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">Bildirimler</b><button class="chip" id="close">Kapat</button></div>` + (a.length ? a.map(x => `<button class="nt ${seen.has(x.k) ? "" : "new"}" data-nt="${x.tab || "mine"}"><b>${x.t}</b><span>${x.s}</span></button>`).join("") : `<div class="empty">Henüz bildirim yok.<br>Teklif geldiğinde veya yanıt aldığında burada görünür.</div>`);
    seen = new Set([...seen, ...a.map(x => x.k)]);
    try {
        localStorage.setItem("yy-seen", JSON.stringify([...seen]));
    }
    catch (e) { }
    B.querySelectorAll("[data-nt]").forEach(b => b.onclick = () => {
        closeSheet();
        tab = b.dataset.nt || "mine";
        mode = "load";
        setNav();
        render();
    });
    $("#close").onclick = () => {
        closeSheet();
        render();
    };
    $("#sheet").classList.add("open");
    bell();
}

function addAlert() {
    const al = { id: Date.now(), from: F.from || "", to: F.to || "", veh: F.veh[0] || "" };
    if (alerts.some(x => x.from === al.from && x.to === al.to && x.veh === al.veh))
        return toast("Bu alarm zaten kurulu");
    alerts.push(al);
    notifs().filter(x => x.k.startsWith("a" + al.id + "_")).forEach(x => seen.add(x.k));
    try {
        localStorage.setItem("yy-seen", JSON.stringify([...seen]));
    }
    catch (e) { }
    save();
    render();
    toast("Alarm kuruldu: " + (al.from || "Her yer") + " → " + (al.to || "Her yer"));
}

const alertsCard = () => `<div class="load" style="cursor:default"><b>Rota alarmlarım</b>${alerts.length ? alerts.map(x => `<div class="kv"><span style="color:var(--ink);font-weight:700">${esc(x.from || "Her yer")} → ${esc(x.to || "Her yer")}${x.veh ? " · " + esc(x.veh) : ""}</span><button class="chip" data-ad="${esc(x.id)}">Kaldır</button></div>`).join("") : `<p style="margin-top:8px;font-size:13px;color:var(--mute)">Filtre ekranında nereden ve nereye seçip listedeki "Alarm kur"a dokun. Uygun yük çıkınca bildirim gelir.</p>`}</div>`;

// ===== Mesajlaşma =====
// Teklif sohbeti (gerçek kullanıcılar arasında canlı, örnek ilanlarda hazır cevaplı).

function openChat(key, who) {
    const live = cloud && /^o\d+_./.test(key), B = $("#sheetBody");
    B.dataset.k = key;
    let msgs = live ? [] : (chats[key] = chats[key] || [{ me: 0, t: "Merhaba, nasıl yardımcı olabilirim?" }]);
    const draw = () => {
        if (!$("#msgs") || B.dataset.k !== key)
            return;
        $("#msgs").innerHTML = msgs.map(x => `<div class="bub ${x.me ? "me" : ""}">${esc(x.t)}</div>`).join("");
        $("#msgs").scrollTop = 1e5;
    };
    B.innerHTML = `<div class="load-detail chat-detail"><div class="detail-top"><b>${who}</b><button class="chip detail-close" id="close" aria-label="Sohbeti kapat">Kapat ×</button></div>${!live ? '<p class="demo-note"><b>Demo sohbet</b> · Mesajlar cihazında tutulur; yanıtlar simüledir.</p>' : ""}<div id="msgs" role="log" aria-live="polite" aria-label="Mesajlar"></div><div class="chat-composer"><label class="sr-only" for="mi">Mesajın</label><input id="mi" placeholder="Mesaj yaz" maxlength="500"><button class="btn" id="ms">Gönder</button></div></div>`;
    if (unChat) {
        unChat();
        unChat = null;
    }
    if (live)
        unChat = db.collection("msgs").where("k", "==", key).onSnapshot(sn => {
            msgs = sn.docs.map(x => x.data()).sort((a, b) => (a.ts || 0) - (b.ts || 0)).map(x => ({ me: x.uid === me, t: String(x.t || "") }));
            draw();
        }, () => { });
    draw();
    syncDetailViewport();
    $("#sheet").classList.add("open");
    $("#close").onclick = closeSheet;
    const send = () => {
        const t = $("#mi").value.trim().slice(0, 500);
        if (!t)
            return;
        $("#mi").value = "";
        if (live) {
            dbw(db.collection("msgs").add({ k: key, uid: me, t, ts: Date.now() }));
            return;
        }
        msgs.push({ me: 1, t });
        draw();
        save();
        setTimeout(() => {
            msgs.push({ me: 0, t: ["Tamamdır, yarın sabah yüklemeye hazırız.", "Fiyatta biraz esneyebiliriz, ne düşünüyorsun?", "Telefonla konuşalım mı?"][Math.floor(Math.random() * 3)] });
            draw();
            save();
        }, 1500);
    };
    $("#ms").onclick = send;
    $("#mi").onkeydown = e => {
        if (e.key === "Enter")
            send();
    };
}
